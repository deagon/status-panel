import React, { useMemo, useCallback, useRef } from 'react';
import { LoadingState, PanelProps } from '@grafana/data';
import { Icon, useTheme2 } from '@grafana/ui';
import { css, cx, keyframes } from '@emotion/css';

import { StatusPanelOptions, StatusLevel } from '../types';
import { dataFramesToMetricHints } from '../utils/processor';
import { resolveWorstStatus } from '../utils/statusResolver';
import { buildDisplayItems } from '../utils/displayBuilder';
import { getColorForStatus } from '../utils/colorResolver';
import { DEFAULT_SOUND_CONFIG } from '../constants';
import { useStatusTransition } from '../hooks/useStatusTransition';
import { useAlertSound } from '../hooks/useAlertSound';
import { MetricRow } from './MetricRow';
import { AlertSoundControls } from './AlertSoundControls';

type Props = PanelProps<StatusPanelOptions>;

const blinkAnimation = keyframes`
  0%,  100% { opacity: 1; }
  50%        { opacity: 0.35; }
`;

// ── Timestamp formatting ──────────────────────────────────────────────────────

function formatTimestamp(date: Date, format: 'time' | 'datetime' | 'relative'): string {
  switch (format) {
    case 'datetime':
      return date.toLocaleString();
    case 'relative': {
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
      if (seconds < 5)   { return 'just now'; }
      if (seconds < 60)  { return `${seconds}s ago`; }
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60)  { return `${minutes}m ago`; }
      const hours = Math.floor(minutes / 60);
      if (hours < 24)    { return `${hours}h ago`; }
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
    case 'time':
    default:
      return date.toLocaleTimeString();
  }
}

// ── Panel component ───────────────────────────────────────────────────────────

export const StatusPanel: React.FC<Props> = ({
  options,
  data,
  width,
  height,
  replaceVariables,
}) => {
  const theme = useTheme2();

  // ── Data source error detection ─────────────────────────────────────────────
  // Use useRef to remember the last error state, so that during Loading
  // (between refreshes) we keep showing the error instead of flashing normal color.

  const lastErrorRef = useRef<{ hasError: boolean; errorText: string }>({
    hasError: false,
    errorText: '',
  });

  const currentHasError = data.state === LoadingState.Error;
  const isLoading = data.state === LoadingState.Loading;

  const currentErrorText = useMemo(() => {
    // Grafana 10+: data.errors array
    if (data.errors && data.errors.length > 0) {
      return data.errors
        .map((e) => e.message || e.data?.message || '')
        .filter(Boolean)
        .join('; ');
    }
    // Deprecated data.error object
    if (data.error) {
      return data.error.message || data.error.data?.message || '';
    }
    return '';
  }, [data.errors, data.error]);

  // Update the ref when we get a definitive state (not Loading)
  if (!isLoading) {
    lastErrorRef.current = {
      hasError: currentHasError,
      errorText: currentErrorText,
    };
  }

  // During Loading, use the last known error state to prevent flashing
  const hasDataError = isLoading ? lastErrorRef.current.hasError : currentHasError;
  const dataErrorText = isLoading ? lastErrorRef.current.errorText : currentErrorText;
  const switchToNa = hasDataError && (options.switchToNaOnError ?? true);

  // ── Data processing ─────────────────────────────────────────────────────────

  const hints = useMemo(
    () => dataFramesToMetricHints(data.series),
    [data.series]
  );

  const ruleConfig = useMemo(
    () => options.ruleConfig ?? { rules: [] },
    [options.ruleConfig]
  );

  const rules = useMemo(
    () => ruleConfig.rules ?? [],
    [ruleConfig]
  );

  const status: StatusLevel = useMemo(() => {
    if (switchToNa) { return 'na'; }
    if (options.statePanel === 'disable') { return 'disable'; }
    if (options.statePanel === 'na')      { return 'na'; }
    return resolveWorstStatus(hints, rules);
  }, [hints, rules, options.statePanel, switchToNa]);

  const displayItems = useMemo(
    () => (options.statePanel === 'enable' ? buildDisplayItems(hints, ruleConfig) : []),
    [hints, ruleConfig, options.statePanel]
  );

  // ── Blink & Sound ───────────────────────────────────────────────────────────

  const { isBlinking, lastChangedAt } = useStatusTransition(
    status,
    options.blink,
    options.blinkDuration ?? 15
  );

  const soundSettings = (options as unknown as { soundSettings?: { volume?: number; soundConfig?: import('../types').SoundConfig } }).soundSettings; // eslint-disable-line @typescript-eslint/no-explicit-any
  const alertSound = useAlertSound(
    status,
    options.soundEnabled,
    soundSettings?.volume ?? options.soundVolume ?? 70,
    soundSettings?.soundConfig ?? DEFAULT_SOUND_CONFIG
  );
  // Opt-in. Undefined (dashboards saved before the option) stays hidden.
  const showAlertSoundControls = options.showAlertSoundControls ?? false;

  // ── Colors ──────────────────────────────────────────────────────────────────

  const backgroundColor = useMemo(() => {
    const rawColor = getColorForStatus(status, options);
    return theme.visualization.getColorByName(rawColor);
  }, [status, options, theme.visualization]);

  const textColor = useMemo(() => {
    if (options.textColorEnabled && options.textColor) {
      return options.textColor;
    }
    return theme.colors.getContrastText(backgroundColor);
  }, [options.textColorEnabled, options.textColor, backgroundColor, theme.colors]);

  // ── Layout values ───────────────────────────────────────────────────────────

  const radius = options.cornerRadius ?? 4;
  const inline = options.modePanel === 'inline';
  const fontSizeTitle   = options.fontSizeTitle   ?? 18;
  const fontSizeMetrics = options.fontSizeMetrics ?? 12;

  // ── Memoized styles ─────────────────────────────────────────────────────────

  const shellCss = useMemo(() => css`
    width: ${width + 16}px;
    height: ${height + 16}px;
    margin: -8px 0 0 -8px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: ${radius}px;
    background: ${theme.colors.background.primary};
  `, [width, height, radius, theme.colors.background.primary]);

  const panelCss = useMemo(() => css`
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    padding: 8px;
    position: relative;
    overflow: hidden;
    background-color: ${backgroundColor};
    color: ${textColor};
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    box-sizing: border-box;
    animation: ${isBlinking && options.blink ? `${blinkAnimation} 1s linear infinite` : 'none'};
  `, [backgroundColor, textColor, isBlinking, options.blink]);

  const headerCss = useMemo(() => css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 4px;
  `, []);

  const titleCss = useMemo(() => css`
    margin: 0;
    font-size: ${fontSizeTitle}px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.2;
  `, [fontSizeTitle]);

  const metricsCss = useMemo(() => css`
    font-size: ${fontSizeMetrics}px;
    line-height: 1.5;
    ${inline ? 'display: flex; flex-wrap: wrap; justify-content: center; gap: 2px 8px;' : ''}
  `, [fontSizeMetrics, inline]);

  const emblemCss = useMemo(() => css`
    position: absolute;
    top: ${Math.max(6, radius * 0.3)}px;
    left: ${Math.max(8, radius * 0.6)}px;
    font-size: 0.75rem;
    opacity: 0.7;
  `, [radius]);

  const timestampCss = useMemo(() => css`
    position: absolute;
    top: ${Math.max(6, radius * 0.3)}px;
    right: ${Math.max(8, radius * 0.6)}px;
    font-size: 0.7rem;
    opacity: 0.65;
    color: ${textColor};
  `, [radius, textColor]);

  const errorMessageCss = useMemo(() => css`
    font-size: ${fontSizeMetrics}px;
    opacity: 0.85;
    margin-top: 4px;
  `, [fontSizeMetrics]);

  // ── Memoized callbacks ──────────────────────────────────────────────────────

  const getColor = useCallback(
    (s: StatusLevel) => theme.visualization.getColorByName(getColorForStatus(s, options)),
    [theme.visualization, options]
  );

  // ── Icon rendering ──────────────────────────────────────────────────────────

  const renderIcon = () => {
    if (options.iconType === 'builtin' && options.iconBuiltin) {
      return (
        <Icon
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name={options.iconBuiltin as any}
          size="lg"
          style={{ color: textColor }}
        />
      );
    }
    if (options.iconType === 'url' && options.iconUrl) {
      return (
        <img
          src={options.iconUrl}
          alt=""
          width={options.iconSize ?? 20}
          height={options.iconSize ?? 20}
          style={{ objectFit: 'contain', flexShrink: 0 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      );
    }
    return null;
  };

  // ── Error message for data source failures ──────────────────────────────────

  const renderErrorMessage = () => {
    if (!switchToNa) {
      return null;
    }
    const customMessage = options.dataErrorMessage?.trim();
    const displayMessage = customMessage || dataErrorText || 'No data';
    return <div className={errorMessageCss}>{displayMessage}</div>;
  };

  // ── Panel title ─────────────────────────────────────────────────────────────

  const panelName = replaceVariables(options.panelName || '');
  const dataLink = options.dataLink ? replaceVariables(options.dataLink) : '';

  const titleContent = dataLink ? (
    <a
      href={dataLink}
      target={options.openLinkInNewTab ? '_blank' : '_self'}
      rel="noopener noreferrer"
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      {panelName}
    </a>
  ) : (
    panelName
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={shellCss}>
    <div className={panelCss}>

      {/* Embleb */}
      {options.emblem && (
        <div className={emblemCss}>{options.emblem}</div>
      )}

      {/* Timestamp — top right corner */}
      {options.showTimestamp && lastChangedAt && (
        <div className={timestampCss}>
          {formatTimestamp(lastChangedAt, options.timestampFormat ?? 'time')}
        </div>
      )}

      {/* Title row with optional icon */}
      <div className={headerCss}>
        {renderIcon()}
        <h2 className={cx(titleCss)}>{titleContent}</h2>
      </div>

      {/* Error message when data source fails */}
      {renderErrorMessage()}

      {/* Metrics list */}
      {displayItems.length > 0 && (
        <div className={metricsCss}>
          {displayItems.map((item, index) => (
            <MetricRow
              key={index}
              item={item}
              inline={inline}
              colorizeMetrics={options.colorizeMetrics ?? false}
              getColor={getColor}
              textColor={textColor}
            />
          ))}
        </div>
      )}

    </div>
    {showAlertSoundControls && (
      <AlertSoundControls
        snoozed={alertSound.snoozed}
        unmuteAt={alertSound.unmuteAt}
        onSnooze={alertSound.snoozeFor}
        onResume={alertSound.resume}
      />
    )}
    </div>
  );
};
