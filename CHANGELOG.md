# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

- Looping alert sound while status is Warning or higher (Warning, Average, High, Disaster). The loop stops on OK, Information, Disabled, or N/A. Information still plays once on transition. Volume and per-status Off / Built-in / Custom URL settings are unchanged.
- Opt-in **Show alert sound controls** (全局声音控制面板), off by default. One panel with it enabled shows 恢复报警声音 and the 1 minute / 30 minute / 1 hour / 2 hour / 4 hour snooze buttons. The unmute time is stored in `localStorage` and mutes or resumes every Status Panel in the browser, including after a reload. Metric panels do not render the button row.

---

## [1.0.0] — 2025-02-24

### ✨ Added — Complete rewrite for Grafana 10+

This is a full rewrite of the abandoned `serrrios-statusoverview-panel` plugin with no shared code.

#### Visual

- Status levels: OK, Information, Warning, Average, High, Disaster, Disabled, N/A
- Blink animation on status change with configurable duration (5–60 seconds)
- Colorize each metric individually by its own status color
- Configurable corner radius (0–50 px)
- Icon support: None / Built-in Grafana icons / Custom URL image
- Tag label in the top-left corner
- Timestamp of last status change in the top-right corner (Time / Date+Time / Relative)
- Panel link URL with Grafana variable support
- Custom text color with auto-contrast fallback
- Separate font size controls for title and metrics

#### Sound

- 5 built-in alert tones via Web Audio API (one per severity level)
- Custom audio URL (MP3/OGG) per status level
- Per-status mode: Off / Built-in / Custom URL
- Master volume slider (0–100%)
- Preview button for each sound in settings

#### Rules

- Regex metric matching with real-time validation and error highlighting
- Number threshold, String threshold, and Show-only display modes
- Reverse logic (trigger when value ≤ threshold)
- Drag & drop rule reordering via `@dnd-kit`
- Duplicate rule with one click
- Export / Import rules to/from JSON
- Search filter (appears when more than 3 rules)
- Metric URL per rule (click metric name to open URL)
- Description tooltip on hover

#### Reliability

- Switch to N/A on data source error (prevents false-green status)
- Custom error message when data source fails
- No flicker during Grafana refresh cycles

#### Developer

- Full TypeScript rewrite with strict typing
- Separated hooks: `useStatusTransition`, `useAlertSound`
- Unit tests for `colorResolver`, `comparisonFunctions`, `displayBuilder`, `statusResolver`

#### Migration

- `migrate_panel.py` — Python script for automated migration of existing dashboards from the old plugin format
