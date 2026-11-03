import { useEffect, useRef } from 'react';
import { StatusLevel, SoundConfig, StatusSoundConfig } from '../types';
import { DEFAULT_SOUND_CONFIG } from '../constants';
import { createAlertLoop, playStatusSound, type AlertLoopHandle } from '../utils/soundPlayer';
import { isLoopingAlertLevel, shouldLoopAlertSound, shouldPlayTransitionSound } from '../utils/alertSnooze';
import { useAlertSnooze, type AlertSnoozeState } from './useAlertSnooze';

function levelSoundConfig(soundConfig: SoundConfig, status: StatusLevel): StatusSoundConfig | undefined {
  if (!isLoopingAlertLevel(status) && status !== 'information') {
    return undefined;
  }
  return (soundConfig ?? DEFAULT_SOUND_CONFIG)[status];
}

/**
 * Loops the configured sound while the panel is Warning or higher, unless the
 * operator has snoozed the alarm. Information still plays once on transition.
 * Playback also starts on mount when the panel is already alerting, so a kiosk
 * reload does not wait for the next status change.
 */
export function useAlertSound(
  status: StatusLevel,
  soundEnabled: boolean,
  volume: number,
  soundConfig: SoundConfig
): AlertSnoozeState {
  const snooze = useAlertSnooze();
  const loopRef = useRef<AlertLoopHandle | null>(null);
  const prevStatusRef = useRef<StatusLevel | null>(null);

  // Create the player before the effect that starts it. Effects run in declaration order.
  useEffect(() => {
    const loop = createAlertLoop();
    loopRef.current = loop;
    return () => {
      loop.stop();
      loopRef.current = null;
    };
  }, []);

  useEffect(() => {
    const loop = loopRef.current;
    if (!loop) {
      return;
    }

    const previous = prevStatusRef.current;
    prevStatusRef.current = status;
    const config = soundConfig ?? DEFAULT_SOUND_CONFIG;

    if (shouldLoopAlertSound(status, soundEnabled, snooze.snoozed)) {
      loop.start(status, volume, levelSoundConfig(config, status));
      return;
    }

    loop.stop();

    if (shouldPlayTransitionSound(status, previous, soundEnabled, snooze.snoozed)) {
      void playStatusSound(status, volume, levelSoundConfig(config, status)).catch(() => {});
    }
  }, [status, soundEnabled, volume, soundConfig, snooze.snoozed]);

  const snoozeFor = (durationMs: number) => {
    loopRef.current?.stop();
    snooze.snoozeFor(durationMs);
  };

  const resume = () => {
    snooze.resume();
    if (soundEnabled && isLoopingAlertLevel(status)) {
      const config = soundConfig ?? DEFAULT_SOUND_CONFIG;
      loopRef.current?.start(status, volume, levelSoundConfig(config, status));
    }
  };

  return {
    snoozed: snooze.snoozed,
    unmuteAt: snooze.unmuteAt,
    snoozeFor,
    resume,
  };
}
