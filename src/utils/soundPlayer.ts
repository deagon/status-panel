import { StatusLevel, StatusSoundConfig } from '../types';
import { SOUNDS, STATUS_SEVERITY_ORDER } from '../constants';
import bundledDisasterAlertUrl from '../assets/alert-disaster.mp3';

/**
 * Mainland firetruck siren, inlined into the plugin bundle as a data URL.
 * Disaster "Built-in" plays this. It does not need a file under /public/plugins.
 */
export const BUNDLED_DISASTER_ALERT_URL = bundledDisasterAlertUrl;

/** How long the settings preview should show "Playing…" for the bundled siren. */
export const BUNDLED_DISASTER_PREVIEW_MS = 8500;

let audioContext: AudioContext | null = null;

/** Custom alarm elements that are waiting for a user gesture before they can play. */
const pausedCustomAudio = new Set<HTMLAudioElement>();

/** Builtin loops waiting until AudioContext is running. */
const builtinKickers = new Set<() => void>();

let gestureListenerBound = false;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioContext || audioContext.state === 'closed') {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContext = new AudioContextClass();
    }
    return audioContext;
  } catch {
    console.warn('[StatusPanel] Web Audio API not available');
    return null;
  }
}

async function ensureAudioContextReady(): Promise<AudioContext | null> {
  const ctx = getAudioContext();
  if (!ctx) {
    return null;
  }
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }
  return ctx;
}

function runBuiltinKickers(): void {
  [...builtinKickers].forEach((kick) => kick());
}

/**
 * Browsers block audio until the operator clicks or types once.
 * The listener stays for the session and retries any alarm that was paused.
 */
function onUserGesture(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    void ctx
      .resume()
      .then(() => runBuiltinKickers())
      .catch(() => {});
  } else if (ctx?.state === 'running') {
    runBuiltinKickers();
  }

  pausedCustomAudio.forEach((el) => {
    if (el.paused) {
      voidPlay(el);
    }
  });
}

function bindGestureListener(): void {
  if (gestureListenerBound || typeof document === 'undefined') {
    return;
  }
  gestureListenerBound = true;
  document.addEventListener('click', onUserGesture);
  document.addEventListener('keydown', onUserGesture);
}

function clampUnitVolume(volume: number): number {
  return Math.min(1, Math.max(0, volume / 100));
}

function voidPlay(el: HTMLAudioElement): void {
  try {
    const pending = el.play();
    if (pending && typeof pending.catch === 'function') {
      void pending.catch(() => {});
    }
  } catch {
    // play() can throw synchronously when autoplay is blocked.
  }
}

/**
 * Gap between built-in tone repeats. Custom URLs use native audio looping instead.
 * Long enough that Warning/Disaster tones do not overlap.
 */
export const BUILTIN_ALERT_LOOP_MS = 2000;

/**
 * Plays a built-in Web Audio tone for the given status level.
 */
async function playBuiltinSound(level: StatusLevel, volume: number): Promise<void> {
  const ctx = await ensureAudioContextReady();
  if (!ctx) {
    return;
  }

  const sound = SOUNDS.find((s) => s.level === level);
  if (sound) {
    sound.play(ctx, volume);
  }
}

/**
 * Plays audio from a user-provided URL using an HTMLAudioElement.
 * Volume is normalised from 0–100 to 0.0–1.0.
 */
async function playCustomSound(url: string, volume: number): Promise<void> {
  if (!url) {
    return;
  }
  try {
    const audio = new Audio(url);
    audio.volume = clampUnitVolume(volume);
    await audio.play();
  } catch (e) {
    console.warn('[StatusPanel] Failed to play custom sound:', e);
  }
}

/**
 * The plugin path operators sometimes paste. Grafana often does not serve it,
 * so playback uses the inlined file instead.
 */
function isUnservedPluginDisasterUrl(url: string): boolean {
  const path = url.trim().split(/[?#]/, 1)[0];
  return (
    path === '/public/plugins/toropovav-status-panel/alert-disaster.mp3' ||
    path === 'public/plugins/toropovav-status-panel/alert-disaster.mp3' ||
    path.endsWith('/public/plugins/toropovav-status-panel/alert-disaster.mp3')
  );
}

export type ResolvedAlertSound = { kind: 'off' } | { kind: 'tone' } | { kind: 'file'; url: string };

/**
 * Disaster built-in, and the old `/public/plugins/.../alert-disaster.mp3` URL,
 * resolve to the bundled MP3. Other built-in levels stay Web Audio tones.
 * A real custom URL is used as entered.
 */
export function resolveAlertSound(level: StatusLevel, config?: StatusSoundConfig): ResolvedAlertSound {
  if (!(STATUS_SEVERITY_ORDER as readonly string[]).includes(level)) {
    return { kind: 'off' };
  }

  const mode = config?.mode ?? 'builtin';
  if (mode === 'off') {
    return { kind: 'off' };
  }

  if (mode === 'custom') {
    const raw = (config?.customUrl ?? '').trim();
    if (!raw) {
      return { kind: 'off' };
    }
    if (isUnservedPluginDisasterUrl(raw)) {
      return { kind: 'file', url: BUNDLED_DISASTER_ALERT_URL };
    }
    return { kind: 'file', url: raw };
  }

  if (level === 'disaster') {
    return { kind: 'file', url: BUNDLED_DISASTER_ALERT_URL };
  }

  return { kind: 'tone' };
}

/**
 * Plays the sound for the given status level according to its StatusSoundConfig.
 * One-shot: used for the settings preview and for Information transitions.
 *
 * @param level  - The status level that was just entered.
 * @param volume - Master volume 0–100.
 * @param config - Per-status sound configuration. If omitted, plays builtin.
 */
export async function playStatusSound(level: StatusLevel, volume: number, config?: StatusSoundConfig): Promise<void> {
  const resolved = resolveAlertSound(level, config);
  if (resolved.kind === 'off') {
    return;
  }
  if (resolved.kind === 'file') {
    await playCustomSound(resolved.url, volume);
    return;
  }
  await playBuiltinSound(level, volume);
}

export interface AlertLoopHandle {
  /** Start or retarget the loop. Same sound keeps playing; volume updates live. */
  start(level: StatusLevel, volume: number, config?: StatusSoundConfig): void;
  stop(): void;
}

/**
 * A per-panel looping alarm. Each panel owns one handle so several tiles can
 * sound at once. Snooze is coordinated separately and just calls `stop`.
 */
export function createAlertLoop(): AlertLoopHandle {
  bindGestureListener();

  let audio: HTMLAudioElement | null = null;
  let onEnded: (() => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let kicker: (() => void) | null = null;
  let runningKey = '';
  let active = false;
  let generation = 0;
  let currentVolume = 70;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const removeKicker = () => {
    if (!kicker) {
      return;
    }
    builtinKickers.delete(kicker);
    kicker = null;
  };

  const releaseAudio = () => {
    if (!audio) {
      return;
    }
    if (onEnded) {
      audio.removeEventListener('ended', onEnded);
      onEnded = null;
    }
    pausedCustomAudio.delete(audio);
    try {
      audio.pause();
      audio.src = '';
      audio.load();
    } catch {
      // Element may already be detached.
    }
    audio = null;
  };

  const stop = () => {
    generation += 1;
    active = false;
    runningKey = '';
    clearTimer();
    removeKicker();
    releaseAudio();
  };

  const armBuiltin = (level: StatusLevel, generationAtStart: number) => {
    const kick = () => {
      if (!active || generation !== generationAtStart) {
        builtinKickers.delete(kick);
        if (kicker === kick) {
          kicker = null;
        }
        return;
      }

      const ctx = getAudioContext();
      if (!ctx || ctx.state !== 'running') {
        return;
      }

      builtinKickers.delete(kick);
      if (kicker === kick) {
        kicker = null;
      }
      if (timer) {
        return;
      }

      const sound = SOUNDS.find((item) => item.level === level);
      sound?.play(ctx, currentVolume);
      timer = setTimeout(() => {
        timer = null;
        if (!active || generation !== generationAtStart) {
          return;
        }
        armBuiltin(level, generationAtStart);
      }, BUILTIN_ALERT_LOOP_MS);
    };

    kicker = kick;
    builtinKickers.add(kick);

    const ctx = getAudioContext();
    if (ctx?.state === 'running') {
      kick();
      return;
    }
    if (ctx && ctx.state === 'suspended') {
      void ctx
        .resume()
        .then(() => kick())
        .catch(() => {});
    }
  };

  const startCustom = (url: string, volume: number, generationAtStart: number) => {
    const el = new Audio(url);
    el.loop = true;
    el.preload = 'auto';
    el.volume = clampUnitVolume(volume);

    onEnded = () => {
      if (!active || generation !== generationAtStart || audio !== el) {
        return;
      }
      try {
        el.currentTime = 0;
      } catch {
        // Some streams reject seeking; play() still restarts them.
      }
      voidPlay(el);
    };
    el.addEventListener('ended', onEnded);

    audio = el;
    pausedCustomAudio.add(el);

    el.addEventListener(
      'error',
      () => {
        console.warn('[StatusPanel] Failed to play custom sound:', url);
      },
      { once: true }
    );

    try {
      const pending = el.play();
      if (pending && typeof pending.catch === 'function') {
        // NotAllowedError is expected until the first click. Media failures also emit `error`.
        void pending.catch(() => {});
      }
    } catch {
      // play() threw synchronously; the error listener covers media failures.
    }
  };

  const start = (level: StatusLevel, volume: number, config?: StatusSoundConfig) => {
    currentVolume = volume;
    const resolved = resolveAlertSound(level, config);

    if (resolved.kind === 'off') {
      stop();
      return;
    }

    const key =
      resolved.kind === 'file'
        ? `${level}|file|${resolved.url === BUNDLED_DISASTER_ALERT_URL ? 'bundled-disaster' : resolved.url}`
        : `${level}|tone`;

    if (active && runningKey === key) {
      if (resolved.kind === 'file' && audio) {
        audio.volume = clampUnitVolume(volume);
        if (audio.paused) {
          voidPlay(audio);
        }
        return;
      }
      if (resolved.kind === 'tone' && (timer || kicker)) {
        return;
      }
    }

    stop();
    const generationAtStart = generation;
    active = true;
    runningKey = key;

    if (resolved.kind === 'file') {
      startCustom(resolved.url, volume, generationAtStart);
      return;
    }

    armBuiltin(level, generationAtStart);
  };

  return { start, stop };
}
