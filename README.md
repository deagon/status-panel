<table border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td><img src="https://raw.githubusercontent.com/ToropovAV/status-panel/main/src/img/logo.svg" width="120"></td>
    <td><h1 style="margin: 0; padding-left: 15px;">Status Panel for Grafana</h1></td>
  </tr>
</table>

<p align="left">
  <a href="https://github.com/ToropovAV/status-panel/releases">
    <img src="https://img.shields.io/github/v/release/ToropovAV/status-panel" alt="Latest version">
  </a>
  <a href="https://github.com/ToropovAV/status-panel/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/ToropovAV/status-panel" alt="License">
  </a>
  <img src="https://img.shields.io/badge/Grafana-10%2B-orange" alt="Grafana version">
  <img src="https://img.shields.io/github/downloads/ToropovAV/status-panel/total" alt="Downloads">
</p>

---

A feature-rich Grafana panel plugin for monitoring system status with configurable thresholds, alert sounds, and visual feedback.

<p align="center">
  <img src="https://raw.githubusercontent.com/ToropovAV/status-panel/main/docs/screenshots/panel-animation.gif" alt="Panel animation">
  <br><br>
  <img src="https://raw.githubusercontent.com/ToropovAV/status-panel/main/docs/screenshots/panel-ok.png" alt="Panel OK State">
  <img src="https://raw.githubusercontent.com/ToropovAV/status-panel/main/docs/screenshots/panel-average.png" alt="Panel with Metrics">
</p>

---

## Features

### 🎨 Visual
- **Color-coded status levels** — OK, Information, Warning, Average, High, Disaster, Disabled, N/A
- **Blink animation** on status change with configurable duration (5–60 seconds)
- **Colorize each metric** by its individual status level
- **Corner radius** control (0–50 px)
- **Custom icon** — choose from built-in Grafana icons or provide a custom image URL
- **Tag label** — short text displayed in the top-left corner
- **Timestamp** of last status change shown in the top-right corner (Time / Date+Time / Relative formats)
- **Panel link** — clicking the panel name opens a configurable URL (supports Grafana variables)
- **Custom text color** with automatic contrast fallback for light/dark themes
- **Adjustable font sizes** for title and metrics independently

### 📊 Metrics Display
- **Line-by-line** or **inline (comma-separated)** display modes
- **Metric URL** — click any metric name to open its URL
- **Alias** — display a custom name instead of the raw metric name
- **Description tooltip** — hover over a metric to see its description
- **Show/hide** metric name and value independently per rule

### 🔔 Alert Sound
- **5 built-in tones** generated via Web Audio API, one per severity level
- **Custom audio URL** — play any MP3/OGG from a URL
- **Per-status configuration** — each status level can be set to Off / Built-in / Custom URL independently
- **Volume control** (0–100%)
- **Sound preview** button in the settings panel
- **Looping alarm** while the status is Warning or higher (Warning, Average, High, Disaster). The sound stops on OK, Information, Disabled, or N/A
- **Timed snooze** from one opt-in panel (声音告警): 恢复报警声音, or silence for 1 minute, 30 minutes, 1 hour, 2 hours, or 4 hours. Metric panels stay clean. The unmute time is kept in the browser and applies to every Status Panel

### 📋 Rules Engine
- **Regex metric matching** with real-time validation and error highlighting
- **Number threshold** mode — trigger by numeric value with per-level thresholds
- **String threshold** mode — trigger by exact string value
- **Show-only** mode — always display the metric regardless of value
- **Reverse logic** — trigger when value is ≤ threshold instead of ≥
- **Drag & drop** reordering via `@dnd-kit`
- **Duplicate** any rule with one click
- **Export / Import** rules to/from JSON file
- **Search** — filter rules by name, metric, or alias (appears when >3 rules)

### 🛡️ Reliability
- **Switch to N/A on data source error** — prevents misleading green status during outages
- **Custom error message** — show your own text when the data source fails
- **No flicker during refresh** — keeps last known error state during `Loading`

---

## Screenshots

| Panel — OK | Panel — Multiple statuses |
|---|---|
| ![OK](https://raw.githubusercontent.com/ToropovAV/status-panel/main/docs/screenshots/panel-ok.png) | ![Average](https://raw.githubusercontent.com/ToropovAV/status-panel/main/docs/screenshots/panel-average.png) |

| General Settings | Link & Icon Settings |
|---|---|
| ![General](https://raw.githubusercontent.com/ToropovAV/status-panel/main/docs/screenshots/settings-general.png) | ![Link Icon](https://raw.githubusercontent.com/ToropovAV/status-panel/main/docs/screenshots/settings-link-icon.png) |

| Blink & Sound Settings | Colors Settings |
|---|---|
| ![Sound](https://raw.githubusercontent.com/ToropovAV/status-panel/main/docs/screenshots/settings-blink-sound.png) | ![Colors](https://raw.githubusercontent.com/ToropovAV/status-panel/main/docs/screenshots/settings-colors.png) |

| Rule Editor | Threshold Settings |
|---|---|
| ![Rules](https://raw.githubusercontent.com/ToropovAV/status-panel/main/docs/screenshots/settings-rules.png) | ![Thresholds](https://raw.githubusercontent.com/ToropovAV/status-panel/main/docs/screenshots/settings-thresholds.png) |

---

## Requirements

- Grafana **10.0.0** or newer
- Node.js **20+** (for building from source)

---

## Installation

### Option 1 — Install from Grafana Catalog (recommended)

> Coming soon — submission to the official Grafana plugin catalog is in progress.

### Option 2 — Manual installation

1. Download the latest release archive from the [Releases](https://github.com/ToropovAV/status-panel/releases) page.

2. Extract it into your Grafana plugins directory:
   ```bash
   # Default plugin directory on Linux
   unzip toropovav-status-panel-1.0.0.zip -d /var/lib/grafana/plugins/
   ```

3. Allow unsigned plugins in `grafana.ini`:
   ```ini
   [plugins]
   allow_loading_unsigned_plugins = toropovav-status-panel
   ```

4. Restart Grafana:
   ```bash
   sudo systemctl restart grafana-server
   ```

5. Open Grafana → add a new panel → select **Status Panel** from the visualization list.

### Option 3 — Build from source

```bash
git clone https://github.com/ToropovAV/status-panel.git
cd status-panel
npm install
npm run build
```

Then copy the `dist/` folder into your Grafana plugins directory (see Option 2, step 2).

To run in development mode with hot reload:
```bash
npm run dev
```

---

## Configuration Reference

### General

| Setting | Description | Default |
|---|---|---|
| Panel name | Title displayed in the center. Supports Grafana variables. | `System Name` |
| Tag | Short label in the top-left corner. | — |
| Metrics display mode | `Line by line` or `Inline (comma-separated)` | `Line by line` |
| Switch to N/A on data source error | Show N/A status when the data source fails. | On |
| Error status text | Custom message shown on the panel during an error. Leave empty to show the original error. | — |
| Title font size | Panel title font size in px. | `18` |
| Metrics font size | Metric rows font size in px. | `12` |
| Corner radius | Panel border radius in px. | `20` |
| Colorize each metric by its status | Highlight each metric row with its own status color. | On |
| Show last status change time | Timestamp in the top-right corner. | On |
| Timestamp format | `Time only`, `Date + Time`, or `Relative` (e.g. "5m ago"). | `Relative` |
| State mode | `Enabled` (rules active), `Disabled` (grey), `N/A` (forced N/A). | `Enabled` |

### Link

| Setting | Description |
|---|---|
| Panel link URL | URL opened when the panel title is clicked. Supports Grafana variables. |
| Open link in new tab | Open the link in a new browser tab. |

### Icon

| Setting | Description |
|---|---|
| Icon type | `None`, `Built-in` (Grafana icon library), or `Custom URL` (any PNG/SVG/JPEG). |
| Icon name | Grafana icon name, e.g. `database`, `server`, `cloud`. See the [icon reference](https://developers.grafana.com/ui/latest/index.html?path=/story/iconography-icon--icons-overview). |
| Icon URL | URL to an external image. Must be accessible from the browser. |
| Icon size | Width/height of the custom icon in px (12–64). |

### Blink & Sound

| Setting | Description | Default |
|---|---|---|
| Enable blink on status change | Animate panel opacity on status change. | On |
| Blink duration | How long the blink animation runs in seconds. | `10` |
| Enable alert sound | Warning and higher severities loop until the status drops below Warning or the alarm is snoozed. Information plays once when the status changes. Does not draw buttons. | On |
| Show alert sound controls | 全局声音控制面板. Draw the 声音告警 buttons on this panel. Leave off on metric tiles. | Off |
| Volume | Master volume for all sounds (0–100%). | `70%` |
| Per-status sound | Each level (Information → Disaster) can be `Off`, `Built-in`, or `Custom URL`. | Built-in for all; Disaster uses Custom URL |

Snooze buttons are not on every tile. Add one Status Panel, open **Blink & Sound**, and turn **Show alert sound controls** on. Place that panel as a short full-width row (the status block shrinks and the buttons stay visible). Leave the option off on the metric panels, and leave **Enable alert sound** on for the tiles that should loop. The control panel does not need to be Warning. Its buttons mute and resume every Status Panel in this browser.

| Button | Effect |
|---|---|
| 恢复报警声音 | Clear the snooze and resume immediately on any panel that is still Warning or higher |
| 停止报警声音1分钟 / 30分钟 / 1小时 / 2小时 / 4小时 | Silence the alarm for that long |

The unmute time is stored in `localStorage` under `toropovav-status-panel.alertSoundUnmuteAt`. When it expires, sound resumes only on panels that are still alerting. Browsers block autoplay until the operator clicks or presses a key on the dashboard once; after that gesture, looping audio is allowed for the rest of the session.

### Colors

Each status level has an individually configurable color:

| Level | Default color |
|---|---|
| OK | `#2cda01` |
| Information | `#5794F2` |
| Warning | `#faf82a` |
| Average | `#ffa230` |
| High | `#fa6400` |
| Disaster | `#ff0000` |
| Disabled | `#6E6E6E` |
| N/A | `#B0B0B0` |

You can also set a custom text color or let the plugin auto-select one based on the background.

### Rules

Each rule defines which metric to monitor and how to evaluate it.

| Field | Description |
|---|---|
| Rule Name | Label shown in the metrics list on the panel. |
| Metric | Metric name or **regular expression** to match one or more series. |
| Alias | Alternative display name (replaces the metric name on the panel). |
| Description | Tooltip shown when hovering over the metric. |
| Metric URL | URL opened when the metric name is clicked. |
| Show metric name / value | Toggle visibility of name and value independently. |
| Display Mode | `Number threshold`, `String threshold`, or `Show only`. |
| Unit | Unit for numeric values (uses Grafana unit picker). |
| Decimal places | Number of decimal places for numeric display. |
| Show only on threshold | Hide the metric when its value is within the OK range. |
| Reverse logic | Trigger when value is **≤** threshold (instead of ≥). |
| Thresholds | Per-level threshold values (Information / Warning / Average / High / Disaster). |

#### Export & Import Rules

Rules can be exported to a JSON file and re-imported into any panel:

1. Click **Export** in the Rules editor — saves `status-panel-rules.json`.
2. On another panel, click **Import** and select the file — rules are appended to existing ones.

---

## Status Levels

Levels are evaluated in ascending severity order. The panel displays the **worst** active status across all rules.

| Level | Meaning |
|---|---|
| **OK** | All thresholds within normal range |
| **Information** | Informational alert, no action required |
| **Warning** | Worth monitoring |
| **Average** | Moderate issue |
| **High** | Serious issue requiring attention |
| **Disaster** | Critical failure |
| **Disabled** | Panel manually set to disabled state |
| **N/A** | No data, data source error, or panel set to N/A mode |

---

## Data Sources

The plugin is designed to work with any data sources and has been tested with:
- [Prometheus](https://grafana.com/docs/grafana/latest/datasources/prometheus/)
- [Zabbix](https://grafana.com/grafana/plugins/alexanderzobnin-zabbix-app/)
- [Infinity](https://grafana.com/grafana/plugins/yesoreyeram-infinity-datasource/)
- [PostgreSQL](https://grafana.com/docs/grafana/latest/datasources/postgres/)
- [Microsoft SQL Server](https://grafana.com/docs/grafana/latest/datasources/mssql/)
- [MySQL](https://grafana.com/docs/grafana/latest/datasources/mysql/)
- [Elasticsearch](https://grafana.com/docs/grafana/latest/datasources/elasticsearch/)
- [OpenSearch](https://grafana.com/grafana/plugins/grafana-opensearch-datasource/)

If you encounter any issues with specific data sources, please leave an issue.

---

## Migrating from `serrrios-statusoverview-panel`

If you have existing dashboards built with the old plugin, use the included migration script to convert the panel JSON automatically.

### What the script fixes

- `revers: true` → `reverseLogic: true` (the field that caused rules to silently not work)
- `unit: ""` / `unit: "None"` → `unit: "none"`
- `clickThrough` → `metricURL`
- Removes legacy fields: `label`, `shortAlias`, `showMembers`, `isTemplated`, `enabled`, `clickThroughOpenNewTab`, `clickThroughSanitize`
- Renames color fields: `ColorOK` → `colorOK`, etc.
- Sets default values for all new fields (`soundSettings`, `iconType`, `fontSizeTitle`, etc.)
- Changes panel type: `serrrios-statusoverview-panel` → `toropovav-status-panel`

### Usage

```bash
# Migrate a folder of panel JSON files
python migrate_panel.py -i ./panels_old -o ./panels_new

# Migrate a single file
python migrate_panel.py -i dashboard.json -o dashboard_migrated.json

# In-place (overwrites originals — make a backup first!)
python migrate_panel.py -i ./panels -o ./panels
```

The script is located in the [tools/](https://github.com/ToropovAV/status-panel/tree/main/tools) directory of this repository.

---

## Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Run unit tests
npm test

# Production build
npm run build
```

### Project structure

```
src/
├── components/
│   ├── StatusPanel.tsx          # Main panel component
│   ├── AlertSoundControls.tsx   # 声音告警 snooze button row
│   ├── MetricRow.tsx            # Single metric row
│   └── editor/
│       ├── RuleEditor.tsx       # Rules list with drag & drop
│       ├── RuleItem.tsx         # Single rule form
│       ├── RuleEditor.types.ts  # Rule type definitions
│       ├── SoundConfigEditor.tsx
│       └── IconReferenceButton.tsx
├── hooks/
│   ├── useStatusTransition.ts   # Blink logic
│   ├── useAlertSnooze.ts        # Timed snooze persisted in localStorage
│   └── useAlertSound.ts         # Loop Warning and above; one-shot Information
├── utils/
│   ├── processor.ts             # DataFrame → MetricHint
│   ├── statusResolver.ts        # Resolve worst status across rules
│   ├── displayBuilder.ts        # Build display items list
│   ├── colorResolver.ts         # Map status → color
│   ├── comparisonFunctions.ts   # Threshold comparison logic
│   ├── soundPlayer.ts           # One-shot preview and looping alarm playback
│   └── alertSnooze.ts           # Snooze duration, policy, localStorage
├── constants.ts                 # Default colors, sounds, durations
├── types.ts                     # All TypeScript interfaces
└── module.ts                    # Plugin registration & settings schema
```

---

## License

Apache License 2.0 — see [LICENSE](https://github.com/ToropovAV/status-panel/blob/main/LICENSE) for details.

---

## Author

**Aleksey Toropov**

---

## Acknowledgements

Originally inspired by the abandoned [`serrrios-statusoverview-panel`](https://github.com/serrrios/Status-Overview-Panel) plugin. This is a complete rewrite with no shared code.
