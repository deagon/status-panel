import { StatusLevel } from '../types';
import {
  ALERT_SOUND_UNMUTE_AT_KEY,
  RESUME_SOUND_LABEL,
  SNOOZE_PRESETS,
  SOUND_ALERT_GROUP_LABEL,
  clearSnooze,
  isLoopingAlertLevel,
  isSnoozeActive,
  readUnmuteAt,
  setUnmuteAt,
  shouldLoopAlertSound,
  shouldPlayTransitionSound,
  snoozeFor,
  subscribeUnmuteAt,
} from '../utils/alertSnooze';

describe('alert snooze storage', () => {
  beforeEach(() => {
    clearSnooze();
    localStorage.clear();
  });

  it('stores an absolute unmute time and clears it', () => {
    const now = 1_700_000_000_000;
    const until = snoozeFor(60_000, now);

    expect(until).toBe(now + 60_000);
    expect(readUnmuteAt()).toBe(now + 60_000);
    expect(localStorage.getItem(ALERT_SOUND_UNMUTE_AT_KEY)).toBe(String(now + 60_000));
    expect(isSnoozeActive(readUnmuteAt(), now + 1_000)).toBe(true);
    expect(isSnoozeActive(readUnmuteAt(), now + 60_000)).toBe(false);

    clearSnooze();
    expect(readUnmuteAt()).toBeNull();
    expect(isSnoozeActive(readUnmuteAt(), now)).toBe(false);
  });

  it('ignores corrupt storage values', () => {
    localStorage.setItem(ALERT_SOUND_UNMUTE_AT_KEY, 'not-a-time');
    expect(readUnmuteAt()).toBeNull();
    expect(isSnoozeActive(Number.NaN, Date.now())).toBe(false);
  });

  it('notifies same-tab listeners and other tabs via storage events', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeUnmuteAt(listener);

    setUnmuteAt(50);
    expect(listener).toHaveBeenCalledWith(50);

    window.dispatchEvent(new StorageEvent('storage', { key: ALERT_SOUND_UNMUTE_AT_KEY, newValue: null }));
    expect(listener).toHaveBeenLastCalledWith(null);

    window.dispatchEvent(new StorageEvent('storage', { key: ALERT_SOUND_UNMUTE_AT_KEY, newValue: '80' }));
    expect(listener).toHaveBeenLastCalledWith(80);

    unsubscribe();
    setUnmuteAt(90);
    expect(listener).not.toHaveBeenCalledWith(90);
  });
});

describe('snooze presets', () => {
  it('uses the operator-facing Chinese labels and fixed durations', () => {
    expect(SOUND_ALERT_GROUP_LABEL).toBe('声音告警');
    expect(RESUME_SOUND_LABEL).toBe('恢复报警声音');
    expect(SNOOZE_PRESETS.map((preset) => preset.label)).toEqual([
      '停止报警声音1分钟',
      '停止报警声音30分钟',
      '停止报警声音1小时',
      '停止报警声音2小时',
      '停止报警声音4小时',
    ]);
    expect(SNOOZE_PRESETS.map((preset) => preset.durationMs)).toEqual([
      60_000,
      30 * 60_000,
      60 * 60_000,
      2 * 60 * 60_000,
      4 * 60 * 60_000,
    ]);
  });
});

describe('alert sound policy', () => {
  const alerting: StatusLevel[] = ['warning', 'average', 'high', 'disaster'];
  const quiet: StatusLevel[] = ['ok', 'information', 'disable', 'na'];

  it('loops Warning and above only while sound is enabled and not snoozed', () => {
    for (const status of alerting) {
      expect(isLoopingAlertLevel(status)).toBe(true);
      expect(shouldLoopAlertSound(status, true, false)).toBe(true);
      expect(shouldLoopAlertSound(status, false, false)).toBe(false);
      expect(shouldLoopAlertSound(status, true, true)).toBe(false);
    }
    for (const status of quiet) {
      expect(shouldLoopAlertSound(status, true, false)).toBe(false);
    }
  });

  it('plays Information once on a real transition and leaves looping levels to the loop', () => {
    expect(shouldPlayTransitionSound('information', 'ok', true, false)).toBe(true);
    expect(shouldPlayTransitionSound('information', null, true, false)).toBe(false);
    expect(shouldPlayTransitionSound('information', 'information', true, false)).toBe(false);
    expect(shouldPlayTransitionSound('information', 'ok', false, false)).toBe(false);
    expect(shouldPlayTransitionSound('information', 'ok', true, true)).toBe(false);
    expect(shouldPlayTransitionSound('warning', 'ok', true, false)).toBe(false);
    expect(shouldPlayTransitionSound('disaster', 'warning', true, false)).toBe(false);
    expect(shouldPlayTransitionSound('ok', 'disaster', true, false)).toBe(false);
    expect(shouldPlayTransitionSound('high', 'warning', true, false)).toBe(false);
  });
});
