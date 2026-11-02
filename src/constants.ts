import { StatusLevel, SoundConfig } from './types';

// ─── Default Colors ───────────────────────────────────────────────────────────

export const DEFAULT_COLORS: Record<StatusLevel, string> = {
  ok: '#2cda01',
  information: '#5794F2',
  warning: '#faf82a',
  average: '#ffa230',
  high: '#fa6400fc',
  disaster: '#ff0000',
  disable: '#6E6E6E',
  na: '#B0B0B0',
};

// ─── Status Order (severity ascending) ───────────────────────────────────────

export const STATUS_SEVERITY_ORDER: StatusLevel[] = [
  'information',
  'warning',
  'average',
  'high',
  'disaster',
];

// ─── Sound Definitions ────────────────────────────────────────────────────────

export interface SoundDefinition {
  label: string;
  level: StatusLevel;
  /** Generates a sound via Web Audio API */
  play: (ctx: AudioContext, volume: number) => void;
}

function playTone(
  ctx: AudioContext,
  volume: number,
  beeps: Array<{ freq: number; start: number; duration: number }>
) {
  const masterGain = ctx.createGain();
  masterGain.gain.value = volume / 100;
  masterGain.connect(ctx.destination);

  let latestOsc: OscillatorNode | null = null;
  let latestEnd = -1;

  for (const beep of beeps) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = beep.freq;

    gain.gain.setValueAtTime(0, ctx.currentTime + beep.start);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + beep.start + 0.01);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + beep.start + beep.duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(ctx.currentTime + beep.start);
    osc.stop(ctx.currentTime + beep.start + beep.duration + 0.05);

    const endAt = beep.start + beep.duration;
    if (endAt >= latestEnd) {
      latestEnd = endAt;
      latestOsc = osc;
    }
  }

  // Release the gain node after the tone. The alarm loop calls this every
  // couple of seconds, so leaving each node connected would accumulate for hours.
  if (latestOsc) {
    latestOsc.onended = () => {
      try {
        masterGain.disconnect();
      } catch {
        // Already disconnected.
      }
    };
  }
}

export const SOUNDS: SoundDefinition[] = [
  {
    label: 'Information',
    level: 'information',
    play: (ctx, vol) => playTone(ctx, vol, [
      { freq: 880, start: 0, duration: 0.2 },
    ]),
  },
  {
    label: 'Warning',
    level: 'warning',
    play: (ctx, vol) => playTone(ctx, vol, [
      { freq: 660, start: 0,   duration: 0.15 },
      { freq: 660, start: 0.2, duration: 0.15 },
    ]),
  },
  {
    label: 'Average',
    level: 'average',
    play: (ctx, vol) => playTone(ctx, vol, [
      { freq: 550, start: 0,    duration: 0.12 },
      { freq: 550, start: 0.17, duration: 0.12 },
      { freq: 550, start: 0.34, duration: 0.12 },
    ]),
  },
  {
    label: 'High',
    level: 'high',
    play: (ctx, vol) => playTone(ctx, vol, [
      { freq: 880, start: 0,    duration: 0.08 },
      { freq: 440, start: 0.12, duration: 0.08 },
      { freq: 880, start: 0.24, duration: 0.08 },
      { freq: 440, start: 0.36, duration: 0.08 },
    ]),
  },
  {
    label: 'Disaster',
    level: 'disaster',
    play: (ctx, vol) => playTone(ctx, vol, [
      { freq: 1000, start: 0,    duration: 0.1 },
      { freq: 800,  start: 0.15, duration: 0.1 },
      { freq: 1000, start: 0.30, duration: 0.1 },
      { freq: 800,  start: 0.45, duration: 0.1 },
      { freq: 1000, start: 0.60, duration: 0.1 },
      { freq: 800,  start: 0.75, duration: 0.1 },
    ]),
  },
];

// ─── Default Sound Config ─────────────────────────────────────────────────────
// By default all statuses use the built-in tone.

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  information: { mode: 'builtin', customUrl: '' },
  warning:     { mode: 'builtin', customUrl: '' },
  average:     { mode: 'builtin', customUrl: '' },
  high:        { mode: 'builtin', customUrl: '' },
  disaster:    { mode: 'custom', customUrl: 'https://storage.yandexcloud.net/alfaleasing/Grafana/Kaspersky_pig.mp3' },
};

// ─── Panel Defaults ───────────────────────────────────────────────────────────

export const DEFAULT_BLINK_DURATION = 10;
export const DEFAULT_CORNER_RADIUS  = 20;
export const DEFAULT_ICON_SIZE      = 20;
export const DEFAULT_SOUND_VOLUME   = 70;
