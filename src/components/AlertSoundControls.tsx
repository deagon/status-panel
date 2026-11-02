import React, { useId, useMemo, useState } from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { RESUME_SOUND_LABEL, SNOOZE_PRESETS, SOUND_ALERT_GROUP_LABEL } from '../utils/alertSnooze';

export interface AlertSoundControlsProps {
  snoozed: boolean;
  unmuteAt: number | null;
  onSnooze: (durationMs: number) => void;
  onResume: () => void;
}

function formatUnmuteAt(timestamp: number): string {
  const when = new Date(timestamp);
  const now = new Date();
  const sameDay = when.toDateString() === now.toDateString();
  if (sameDay) {
    return when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return when.toLocaleString([], {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function ResumeIcon() {
  return (
    <svg className="alert-sound-icon" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M9.6 3.4a4 4 0 1 0 .5 3.2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M9.5 1.5v2.3H7.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="alert-sound-icon" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <rect x="2.15" y="1.5" width="2.3" height="9" rx="0.4" fill="currentColor" />
      <rect x="7.55" y="1.5" width="2.3" height="9" rx="0.4" fill="currentColor" />
    </svg>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden="true"
      focusable="false"
      style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms ease' }}
    >
      <path
        d="M2 3.6 L5 6.6 L8 3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * On-panel NOC controls. Labels match the operator toolbar:
 * 声音告警 / 恢复报警声音 / 停止报警声音…
 */
export const AlertSoundControls: React.FC<AlertSoundControlsProps> = ({ snoozed, unmuteAt, onSnooze, onResume }) => {
  const theme = useTheme2();
  const [open, setOpen] = useState(true);
  const controlsId = useId();

  const classes = useMemo(() => {
    const iconColor = theme.colors.primary.text;
    return {
      bar: css`
        flex-shrink: 0;
        box-sizing: border-box;
        width: 100%;
        padding: 6px 8px 8px;
        background: ${theme.colors.background.primary};
        border-top: 1px solid ${theme.colors.border.weak};
        color: ${theme.colors.text.primary};
        user-select: none;
      `,
      header: css`
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
        margin-bottom: ${open ? '4px' : '0'};
      `,
      hint: css`
        font-size: 12px;
        line-height: 18px;
        color: ${theme.colors.warning.text};
      `,
      toggle: css`
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
        color: ${theme.colors.text.secondary};
        font: inherit;
        font-size: 12px;
        line-height: 18px;
        cursor: pointer;
      `,
      row: css`
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      `,
      button: css`
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin: 0;
        padding: 1px 8px;
        border: 1px solid ${theme.colors.border.medium};
        border-radius: 2px;
        background: ${theme.colors.background.primary};
        color: ${theme.colors.text.primary};
        font: inherit;
        font-size: 12px;
        line-height: 22px;
        white-space: nowrap;
        cursor: pointer;

        .alert-sound-icon {
          color: ${iconColor};
          flex-shrink: 0;
        }

        &:hover {
          border-color: ${theme.colors.primary.border};
          color: ${theme.colors.primary.text};
        }

        &:focus-visible {
          outline: 2px solid ${theme.colors.primary.border};
          outline-offset: 1px;
        }
      `,
    };
  }, [open, theme]);

  return (
    <section className={classes.bar} aria-label={SOUND_ALERT_GROUP_LABEL} data-testid="alert-sound-controls">
      <div className={classes.header}>
        {snoozed && unmuteAt != null && <span className={classes.hint}>静音至 {formatUnmuteAt(unmuteAt)}</span>}
        <button
          type="button"
          className={classes.toggle}
          aria-expanded={open}
          aria-controls={controlsId}
          onClick={() => setOpen((value) => !value)}
        >
          {SOUND_ALERT_GROUP_LABEL}
          <Chevron expanded={open} />
        </button>
      </div>

      {open && (
        <div className={classes.row} id={controlsId}>
          <button type="button" className={classes.button} onClick={onResume}>
            <ResumeIcon />
            <span>{RESUME_SOUND_LABEL}</span>
          </button>
          {SNOOZE_PRESETS.map((preset) => (
            <button
              key={preset.durationMs}
              type="button"
              className={classes.button}
              onClick={() => onSnooze(preset.durationMs)}
            >
              <PauseIcon />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
