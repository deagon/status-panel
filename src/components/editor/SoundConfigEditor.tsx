import React, { useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Field, Input, RadioButtonGroup, Slider } from '@grafana/ui';
import { css } from '@emotion/css';

import { SoundConfig, SoundMode, StatusSoundConfig, StatusLevel } from '../../types';
import { DEFAULT_SOUND_CONFIG, STATUS_SEVERITY_ORDER } from '../../constants';
import { BUNDLED_DISASTER_PREVIEW_MS, playStatusSound } from '../../utils/soundPlayer';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CombinedValue {
  volume: number;
  soundConfig: SoundConfig;
}

// ── Static data ───────────────────────────────────────────────────────────────

const SOUND_MODE_OPTIONS = [
  { value: 'off',     label: 'Off'       },
  { value: 'builtin', label: 'Built-in'  },
  { value: 'custom',  label: 'Custom URL'},
];

const STATUS_LABELS: Record<string, string> = {
  information: 'Information',
  warning:     'Warning',
  average:     'Average',
  high:        'High',
  disaster:    'Disaster',
};

// ── Helper ────────────────────────────────────────────────────────────────────

function mergeConfig(partial?: Partial<SoundConfig>): SoundConfig {
  const defaults = DEFAULT_SOUND_CONFIG;
  if (!partial) { return defaults; }
  return {
    information: { ...defaults.information, ...(partial.information ?? {}) },
    warning:     { ...defaults.warning,     ...(partial.warning     ?? {}) },
    average:     { ...defaults.average,     ...(partial.average     ?? {}) },
    high:        { ...defaults.high,         ...(partial.high        ?? {}) },
    disaster:    { ...defaults.disaster,    ...(partial.disaster    ?? {}) },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SoundConfigEditor: React.FC<StandardEditorProps<CombinedValue>> = ({
  value,
  onChange,
}) => {
  const volume      = value?.volume      ?? 70;
  const soundConfig = mergeConfig(value?.soundConfig);

  // Track which status is currently playing for button feedback
  const [playing, setPlaying] = useState<string | null>(null);

  const setVolume = (v: number) => onChange({ volume: v, soundConfig });

  const setStatusConfig = (level: string, patch: Partial<StatusSoundConfig>) => {
    const updated: SoundConfig = {
      ...soundConfig,
      [level]: { ...soundConfig[level as keyof SoundConfig], ...patch },
    };
    onChange({ volume, soundConfig: updated });
  };

  const handlePreview = async (level: string) => {
    if (playing) { return; }
    const cfg = soundConfig[level as keyof SoundConfig];
    setPlaying(level);
    await playStatusSound(level as StatusLevel, volume, cfg);
    // Web Audio tones are under a second. The bundled Disaster siren is several seconds.
    const previewMs = level === 'disaster' && cfg.mode === 'builtin' ? BUNDLED_DISASTER_PREVIEW_MS : 1100;
    setTimeout(() => setPlaying(null), previewMs);
  };

  // ── Styles ─────────────────────────────────────────────────────────────────

  const wrapperCss = css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  `;

  const volumeRowCss = css`
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  const statusRowCss = css`
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    border: 1px solid var(--border-weak, rgba(255,255,255,0.1));
    border-radius: 4px;
  `;

  const statusLabelCss = css`
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.75;
    margin-bottom: 2px;
  `;

  const controlRowCss = css`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  `;

  const hintCss = css`
    font-size: 12px;
    line-height: 1.4;
    opacity: 0.8;
  `;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={wrapperCss}>

      {/* ── Volume slider ─────────────────────────────────────────────────── */}
      <Field label="Volume (%)">
        <div className={volumeRowCss}>
          <div style={{ flex: 1 }}>
            <Slider
              min={0}
              max={100}
              step={5}
              value={volume}
              onChange={(v) => setVolume(v)}
            />
          </div>
          <span style={{ minWidth: 36, textAlign: 'right', fontSize: '0.85rem' }}>
            {volume}%
          </span>
        </div>
      </Field>

      {/* ── Per-status rows ───────────────────────────────────────────────── */}
      {STATUS_SEVERITY_ORDER.map((level) => {
        const cfg  = soundConfig[level as keyof SoundConfig];
        const mode = cfg.mode as SoundMode;
        const canPlay  = mode !== 'off' && (mode === 'builtin' || Boolean(cfg.customUrl));
        const isPlaying = playing === level;

        return (
          <div key={level} className={statusRowCss}>
            <div className={statusLabelCss}>{STATUS_LABELS[level]}</div>

            <div className={controlRowCss}>
              {/* Mode selector */}
              <RadioButtonGroup
                options={
                  level === 'disaster'
                    ? SOUND_MODE_OPTIONS.map((option) =>
                        option.value === 'builtin' ? { ...option, label: 'Built-in (firetruck)' } : option
                      )
                    : SOUND_MODE_OPTIONS
                }
                value={mode}
                onChange={(v) => setStatusConfig(level, { mode: v as SoundMode })}
              />

              {/* Preview button — shown when mode is not 'off' */}
              {mode !== 'off' && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={isPlaying ? 'spinner' : 'play'}
                  disabled={!canPlay || Boolean(playing)}
                  onClick={() => handlePreview(level)}
                  tooltip={canPlay ? 'Preview sound' : 'Enter a URL first'}
                >
                  {isPlaying ? 'Playing…' : 'Preview'}
                </Button>
              )}
            </div>

            {level === 'disaster' && mode === 'builtin' && (
              <div className={hintCss}>
                Built-in plays the firetruck siren shipped in the plugin (alert-disaster.mp3). It loops while Disaster is active. No file copy or URL is required.
              </div>
            )}

            {/* Custom URL field */}
            {mode === 'custom' && (
              <Input
                placeholder="https://example.com/alert.mp3"
                value={cfg.customUrl}
                onChange={(e) => setStatusConfig(level, { customUrl: e.currentTarget.value })}
              />
            )}
            {level === 'disaster' && mode === 'custom' && (
              <div className={hintCss}>Optional. Choose Built-in (firetruck) to use the siren included in the plugin.</div>
            )}
          </div>
        );
      })}
    </div>
  );
};
