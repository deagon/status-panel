import { RuleItemType } from './components/editor/RuleEditor.types';

// ─── Panel Options ────────────────────────────────────────────────────────────

export interface StatusPanelOptions {
  // General
  panelName: string;
  statePanel: 'enable' | 'disable' | 'na';
  modePanel: 'line' | 'inline';
  cornerRadius: number;

  // Emblem
  emblem?: string;

  // Icon
  iconType: 'none' | 'builtin' | 'url';
  iconBuiltin: string;
  iconUrl: string;
  iconSize: number;

  // Link
  dataLink: string;
  openLinkInNewTab: boolean;

  // Blink
  blink: boolean;
  blinkDuration: number;

  // Sound
  soundEnabled: boolean;
  soundVolume: number;
  soundConfig: SoundConfig;
  /**
   * Render the shared 声音告警 snooze buttons on this panel.
   * Off by default so metric tiles stay clean. One panel with this on
   * mutes and resumes sound for every Status Panel in the browser.
   */
  showAlertSoundControls: boolean;

  // Data source error handling
  switchToNaOnError: boolean;
  dataErrorMessage: string;

  // Colors
  colorOK: string;
  colorDisable: string;
  colorInformation: string;
  colorWarning: string;
  colorAverage: string;
  colorHigh: string;
  colorDisaster: string;
  colorNa: string;
  textColorEnabled: boolean;
  textColor: string;

  // Typography
  fontSizeTitle: number;
  fontSizeMetrics: number;
  colorizeMetrics: boolean;

  // Timestamp
  showTimestamp: boolean;
  timestampFormat: 'time' | 'datetime' | 'relative';

  // Rules
  ruleConfig: RuleConfig;
}

// ─── Sound ────────────────────────────────────────────────────────────────────

// 'off'     — no sound for this status
// 'builtin' — play the built-in Web Audio tone
// 'custom'  — play audio from a user-provided URL
export type SoundMode = 'off' | 'builtin' | 'custom';

export interface StatusSoundConfig {
  mode: SoundMode;
  customUrl: string;
}

export interface SoundConfig {
  information: StatusSoundConfig;
  warning:     StatusSoundConfig;
  average:     StatusSoundConfig;
  high:        StatusSoundConfig;
  disaster:    StatusSoundConfig;
}

// ─── Rules ────────────────────────────────────────────────────────────────────

export interface RuleConfig {
  rules: RuleItemType[];
}

// ─── Internal Data Models ─────────────────────────────────────────────────────

export interface MetricHint {
  label: string;
  value: number | string | null;
}

export interface DisplayDataItem {
  text: string;
  url?: string;
  tooltip?: string;
  status?: StatusLevel;
}

// ─── Status ───────────────────────────────────────────────────────────────────

export type StatusLevel =
  | 'ok'
  | 'information'
  | 'warning'
  | 'average'
  | 'high'
  | 'disaster'
  | 'disable'
  | 'na';

export const STATUS_ORDER: StatusLevel[] = [
  'information',
  'warning',
  'average',
  'high',
  'disaster',
];
