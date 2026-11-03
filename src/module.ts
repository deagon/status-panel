import { PanelPlugin } from '@grafana/data';
import { StatusPanelOptions } from './types';
import { StatusPanel } from './components/StatusPanel';
import { RuleEditor } from './components/editor/RuleEditor';
import { SoundConfigEditor } from './components/editor/SoundConfigEditor';
import { IconReferenceButton } from './components/editor/IconReferenceButton';
import {
  DEFAULT_COLORS,
  DEFAULT_BLINK_DURATION,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_ICON_SIZE,
  DEFAULT_SOUND_VOLUME,
  DEFAULT_SOUND_CONFIG,
} from './constants';

export const plugin = new PanelPlugin<StatusPanelOptions>(StatusPanel).setPanelOptions(
  (builder) =>
    builder

      // ══════════════════════════════════════════════════════
      // GENERAL
      // ══════════════════════════════════════════════════════

      .addTextInput({
        path: 'panelName',
        name: 'Panel name',
        description: 'Name of the system displayed in the panel. Supports Grafana variables.',
        defaultValue: 'System Name',
        category: ['General'],
      })

      .addTextInput({
        path: 'emblem',
        name: 'Tag',
        description: 'Short text label displayed in the top-left corner of the panel.',
        defaultValue: '',
        category: ['General'],
      })

      .addRadio({
        path: 'modePanel',
        name: 'Metrics display mode',
        defaultValue: 'line',
        category: ['General'],
        settings: {
          options: [
            { value: 'line',   label: 'Line by line' },
            { value: 'inline', label: 'Inline (comma-separated)' },
          ],
        },
        showIf: (c) => c.statePanel === 'enable',
      })

      .addBooleanSwitch({
        path: 'switchToNaOnError',
        name: 'Switch to N/A on data source error',
        description: 'When the data source returns an error, the panel switches to N/A status instead of showing the last known value.',
        defaultValue: true,
        category: ['General'],
      })

      .addTextInput({
        path: 'dataErrorMessage',
        name: 'Error status text',
        description: 'Text shown on the panel when data source is in error state. Leave empty to show the original error.',
        defaultValue: '',
        category: ['General'],
        showIf: (c) => c.switchToNaOnError,
      })

      .addSliderInput({
        path: 'fontSizeTitle',
        name: 'Title font size (px)',
        defaultValue: 18,
        category: ['General'],
        settings: { min: 10, max: 48, step: 1 },
      })

      .addSliderInput({
        path: 'fontSizeMetrics',
        name: 'Metrics font size (px)',
        defaultValue: 12,
        category: ['General'],
        settings: { min: 8, max: 32, step: 1 },
      })

      .addSliderInput({
        path: 'cornerRadius',
        name: 'Corner radius (px)',
        defaultValue: DEFAULT_CORNER_RADIUS,
        category: ['General'],
        settings: { min: 0, max: 50, step: 1 },
      })

      .addBooleanSwitch({
        path: 'colorizeMetrics',
        name: 'Colorize each metric by its status',
        defaultValue: true,
        category: ['General'],
        showIf: (c) => c.statePanel === 'enable',
      })

      .addBooleanSwitch({
        path: 'showTimestamp',
        name: 'Show last status change time',
        description: 'Displays the time of the last status transition in the top-right corner.',
        defaultValue: true,
        category: ['General'],
      })

      .addRadio({
        path: 'timestampFormat',
        name: 'Timestamp format',
        defaultValue: 'relative',
        category: ['General'],
        settings: {
          options: [
            { value: 'time',     label: 'Time only' },
            { value: 'datetime', label: 'Date + Time' },
            { value: 'relative', label: 'Relative' },
          ],
        },
        showIf: (c) => c.showTimestamp,
      })

      .addRadio({
        path: 'statePanel',
        name: 'State mode',
        defaultValue: 'enable',
        category: ['General'],
        settings: {
          options: [
            { value: 'enable',  label: 'Enabled' },
            { value: 'disable', label: 'Disabled' },
            { value: 'na',      label: 'N/A' },
          ],
        },
      })

      // ══════════════════════════════════════════════════════
      // LINK
      // ══════════════════════════════════════════════════════

      .addTextInput({
        path: 'dataLink',
        name: 'Panel link URL',
        description: 'Clicking the panel name opens this URL. Supports Grafana variables.',
        defaultValue: '',
        category: ['Link'],
      })

      .addBooleanSwitch({
        path: 'openLinkInNewTab',
        name: 'Open link in new tab',
        defaultValue: true,
        category: ['Link'],
        showIf: (c) => Boolean(c.dataLink),
      })

      // ══════════════════════════════════════════════════════
      // ICON
      // ══════════════════════════════════════════════════════

      .addRadio({
        path: 'iconType',
        name: 'Icon type',
        defaultValue: 'none',
        category: ['Icon'],
        settings: {
          options: [
            { value: 'none',    label: 'None' },
            { value: 'builtin', label: 'Built-in (Grafana icons)' },
            { value: 'url',     label: 'Custom URL' },
          ],
        },
      })

      .addTextInput({
        path: 'iconBuiltin',
        name: 'Icon name',
        description: 'Grafana icon name, e.g. "database", "server", "cloud"',
        defaultValue: '',
        category: ['Icon'],
        showIf: (c) => c.iconType === 'builtin',
      })

      .addCustomEditor({
        id: 'iconReference',
        path: 'iconReference',
        name: '',
        editor: IconReferenceButton,
        category: ['Icon'],
        showIf: (c) => c.iconType === 'builtin',
      })

      .addTextInput({
        path: 'iconUrl',
        name: 'Icon URL',
        description: 'URL to an image (PNG, SVG, JPEG). Must be accessible from the browser.',
        defaultValue: '',
        category: ['Icon'],
        showIf: (c) => c.iconType === 'url',
      })

      .addSliderInput({
        path: 'iconSize',
        name: 'Icon size (px)',
        defaultValue: DEFAULT_ICON_SIZE,
        category: ['Icon'],
        settings: { min: 12, max: 64, step: 2 },
        showIf: (c) => c.iconType === 'url',
      })

      // ══════════════════════════════════════════════════════
      // BLINK & SOUND
      // ══════════════════════════════════════════════════════

      .addBooleanSwitch({
        path: 'blink',
        name: 'Enable blink on status change',
        defaultValue: true,
        category: ['Blink & Sound'],
      })

      .addSliderInput({
        path: 'blinkDuration',
        name: 'Blink duration (seconds)',
        defaultValue: DEFAULT_BLINK_DURATION,
        category: ['Blink & Sound'],
        settings: { min: 5, max: 60, step: 5 },
        showIf: (c) => c.blink,
      })

      .addBooleanSwitch({
        path: 'soundEnabled',
        name: 'Enable alert sound',
        description: 'Warning and higher severities loop until the status drops below Warning or an operator snoozes the alarm. Information plays once on change. This does not draw snooze buttons.',
        defaultValue: true,
        category: ['Blink & Sound'],
      })

      .addBooleanSwitch({
        path: 'showAlertSoundControls',
        name: 'Show alert sound controls',
        description: '全局声音控制面板. Show the 声音告警 buttons on this panel only. Leave off on metric tiles. Turn on for one dashboard panel to mute and resume alert sound for every Status Panel in this browser. The buttons stay available even when this panel is OK.',
        defaultValue: false,
        category: ['Blink & Sound'],
      })

      // Combined volume + per-status sound config editor
      .addCustomEditor({
        id: 'soundSettings',
        path: 'soundSettings',
        name: 'Sound settings',
        description: 'Configure volume and sound per status level.',
        editor: SoundConfigEditor,
        defaultValue: {
          volume: DEFAULT_SOUND_VOLUME,
          soundConfig: DEFAULT_SOUND_CONFIG,
        },
        category: ['Blink & Sound'],
        showIf: (c) => c.soundEnabled,
      })

      // ══════════════════════════════════════════════════════
      // COLORS
      // ══════════════════════════════════════════════════════

      .addColorPicker({
        path: 'colorOK',
        name: 'OK color',
        defaultValue: DEFAULT_COLORS.ok,
        category: ['Colors'],
        showIf: (c) => c.statePanel === 'enable',
      })

      .addColorPicker({
        path: 'colorInformation',
        name: 'Information color',
        defaultValue: DEFAULT_COLORS.information,
        category: ['Colors'],
        showIf: (c) => c.statePanel === 'enable',
      })

      .addColorPicker({
        path: 'colorWarning',
        name: 'Warning color',
        defaultValue: DEFAULT_COLORS.warning,
        category: ['Colors'],
        showIf: (c) => c.statePanel === 'enable',
      })

      .addColorPicker({
        path: 'colorAverage',
        name: 'Average color',
        defaultValue: DEFAULT_COLORS.average,
        category: ['Colors'],
        showIf: (c) => c.statePanel === 'enable',
      })

      .addColorPicker({
        path: 'colorHigh',
        name: 'High color',
        defaultValue: DEFAULT_COLORS.high,
        category: ['Colors'],
        showIf: (c) => c.statePanel === 'enable',
      })

      .addColorPicker({
        path: 'colorDisaster',
        name: 'Disaster color',
        defaultValue: DEFAULT_COLORS.disaster,
        category: ['Colors'],
        showIf: (c) => c.statePanel === 'enable',
      })

      .addColorPicker({
        path: 'colorDisable',
        name: 'Disabled color',
        defaultValue: DEFAULT_COLORS.disable,
        category: ['Colors'],
        showIf: (c) => c.statePanel === 'disable',
      })

      .addColorPicker({
        path: 'colorNa',
        name: 'N/A color',
        defaultValue: DEFAULT_COLORS.na,
        category: ['Colors'],
        showIf: (c) => c.statePanel === 'na',
      })

      .addBooleanSwitch({
        path: 'textColorEnabled',
        name: 'Custom text color',
        defaultValue: true,
        category: ['Colors'],
      })

      .addColorPicker({
        path: 'textColor',
        name: 'Text color',
        description: 'Color of panel name and metric text.',
        defaultValue: '#000000',
        category: ['Colors'],
        showIf: (c) => c.textColorEnabled,
      })

      // ══════════════════════════════════════════════════════
      // RULES
      // ══════════════════════════════════════════════════════

      .addCustomEditor({
        id: 'ruleConfig',
        path: 'ruleConfig',
        name: 'Rules',
        description: 'Define which metrics to display and their alert thresholds',
        editor: RuleEditor,
        defaultValue: { rules: [] },
        category: ['Rules'],
      })
);
