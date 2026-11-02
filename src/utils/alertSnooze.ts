import { StatusLevel } from '../types';

/**
 * Browser-local unmute time shared by every Status Panel on this origin.
 * Absolute epoch ms so a reload (or a restarted browser) keeps the remaining snooze.
 */
export const ALERT_SOUND_UNMUTE_AT_KEY = 'toropovav-status-panel.alertSoundUnmuteAt';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export const SOUND_ALERT_GROUP_LABEL = '声音告警';
export const RESUME_SOUND_LABEL = '恢复报警声音';

export interface SnoozePreset {
  label: string;
  durationMs: number;
}

/** Fixed NOC mute durations shown on the panel. */
export const SNOOZE_PRESETS: readonly SnoozePreset[] = [
  { label: '停止报警声音1分钟', durationMs: 1 * MINUTE_MS },
  { label: '停止报警声音30分钟', durationMs: 30 * MINUTE_MS },
  { label: '停止报警声音1小时', durationMs: 1 * HOUR_MS },
  { label: '停止报警声音2小时', durationMs: 2 * HOUR_MS },
  { label: '停止报警声音4小时', durationMs: 4 * HOUR_MS },
];

/**
 * Statuses that keep the alarm looping. Warning through Disaster so an
 * escalation (Warning → High, for example) does not mute the room.
 * Information stays a one-shot; OK, Disabled, and N/A are silent.
 */
const LOOPING_ALERT_LEVELS = new Set<StatusLevel>(['warning', 'average', 'high', 'disaster']);

type SnoozeListener = (unmuteAt: number | null) => void;

const listeners = new Set<SnoozeListener>();

/** Used when localStorage is blocked (private mode). */
let memoryFallback: number | null = null;

function parseStored(raw: string | null): number | null {
  if (raw == null || raw.trim() === '') {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function readUnmuteAt(): number | null {
  try {
    return parseStored(localStorage.getItem(ALERT_SOUND_UNMUTE_AT_KEY));
  } catch {
    return memoryFallback;
  }
}

export function isSnoozeActive(unmuteAt: number | null, now: number): boolean {
  return unmuteAt !== null && Number.isFinite(unmuteAt) && unmuteAt > now;
}

function notify(unmuteAt: number | null): void {
  listeners.forEach((listener) => listener(unmuteAt));
}

export function setUnmuteAt(unmuteAt: number | null): void {
  const next = unmuteAt !== null && Number.isFinite(unmuteAt) ? unmuteAt : null;
  memoryFallback = next;
  try {
    if (next === null) {
      localStorage.removeItem(ALERT_SOUND_UNMUTE_AT_KEY);
    } else {
      localStorage.setItem(ALERT_SOUND_UNMUTE_AT_KEY, String(next));
    }
  } catch {
    // In-memory fallback still applies for this tab.
  }
  notify(next);
}

export function subscribeUnmuteAt(listener: SnoozeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Silence alarms until `now + durationMs`. Returns the stored unmute timestamp. */
export function snoozeFor(durationMs: number, now = Date.now()): number {
  const unmuteAt = now + durationMs;
  setUnmuteAt(unmuteAt);
  return unmuteAt;
}

export function clearSnooze(): void {
  setUnmuteAt(null);
}

export function isLoopingAlertLevel(status: StatusLevel): status is 'warning' | 'average' | 'high' | 'disaster' {
  return LOOPING_ALERT_LEVELS.has(status);
}

export function shouldLoopAlertSound(status: StatusLevel, soundEnabled: boolean, snoozed: boolean): boolean {
  return soundEnabled && !snoozed && isLoopingAlertLevel(status);
}

/**
 * One-shot playback for severities below Warning (Information).
 * Warning and above are handled by the loop, including the initial mount.
 */
export function shouldPlayTransitionSound(
  status: StatusLevel,
  previous: StatusLevel | null,
  soundEnabled: boolean,
  snoozed: boolean
): boolean {
  if (!soundEnabled || snoozed || previous === null || previous === status) {
    return false;
  }
  if (isLoopingAlertLevel(status)) {
    return false;
  }
  return status === 'information';
}

function onStorage(event: StorageEvent): void {
  if (event.key !== ALERT_SOUND_UNMUTE_AT_KEY) {
    return;
  }
  const next = parseStored(event.newValue);
  memoryFallback = next;
  notify(next);
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', onStorage);
}
