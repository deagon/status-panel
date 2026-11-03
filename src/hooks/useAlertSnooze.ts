import { useCallback, useEffect, useState } from 'react';
import {
  clearSnooze,
  isSnoozeActive,
  readUnmuteAt,
  snoozeFor as persistSnooze,
  subscribeUnmuteAt,
} from '../utils/alertSnooze';

export interface AlertSnoozeState {
  /** True while the stored unmute time is still in the future. */
  snoozed: boolean;
  /** Epoch ms when sound should return, or null when not snoozed. */
  unmuteAt: number | null;
  snoozeFor: (durationMs: number) => void;
  /** Clears the snooze. Callers resume playback if the panel is still alerting. */
  resume: () => void;
}

/**
 * Shared snooze clock. The unmute timestamp lives in localStorage, and a timer
 * forces a render when it elapses so looping sound can start again without a reload.
 */
export function useAlertSnooze(): AlertSnoozeState {
  const [unmuteAt, setUnmuteAtState] = useState<number | null>(() => readUnmuteAt());
  const [now, setNow] = useState(() => Date.now());

  const refreshNow = useCallback(() => {
    setNow(Date.now());
  }, []);

  useEffect(
    () =>
      subscribeUnmuteAt((value) => {
        setUnmuteAtState(value);
        refreshNow();
      }),
    [refreshNow]
  );

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshNow();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshNow]);

  useEffect(() => {
    if (unmuteAt === null || unmuteAt <= Date.now()) {
      return;
    }
    const delay = unmuteAt - Date.now();
    const timer = window.setTimeout(() => {
      // Floor the clock at the deadline so a timer that fires slightly early still ends the snooze.
      setNow(Math.max(Date.now(), unmuteAt));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [unmuteAt, now]);

  const snoozed = isSnoozeActive(unmuteAt, now);

  const snoozeFor = useCallback((durationMs: number) => {
    persistSnooze(durationMs);
  }, []);

  const resume = useCallback(() => {
    clearSnooze();
  }, []);

  return {
    snoozed,
    unmuteAt: snoozed ? unmuteAt : null,
    snoozeFor,
    resume,
  };
}
