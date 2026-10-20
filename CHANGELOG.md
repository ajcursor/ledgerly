# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### In progress

- **201 track** — Runbooks track `201` / `RUNBOOK_SECTIONS_201` is on main for CE workshop demos (Outline Show beats, Linear staging, disk plugin) but is not a formal release in this cut.
- **301 track.** Runbooks track `301` / `RUNBOOK_SECTIONS_301` adds the Outline Show for orchestrating agents, tasks, and coworkers (four sections, 34 beats: 11, 12, 5, 6). Not a formal release in this cut.

### Added

- Optional runbook beats record a feature name from the Outline tag. Each track lists those features as checkboxes, on by default. Turning one off hides its beats and the browser remembers the choice.
- `change-reviewer` project agent. Read-only diff inspection for the 301 review beat. It owns the closer-inspection list: authentication, payments, personal data, permissions, or secrets; difficult rollback; missing tests; a test an agent edited; scope outside the plan; and new dependencies or shell commands. Like `ledgerly-reviewer`, it reports Passed and Incomplete, with high, warning, and suggestion inside Incomplete.

### Removed

- Contrast hook for shared color tokens (`.cursor/hooks.json`, `contrast-collect.sh`, `contrast-check.mjs`) and the two 301 beats that opened it.

### Changed

- Synced 301 Show beats to the live Outline: the in-scope keyboard plan, change-reviewer readonly false, the planted Tab step flagged high and never kept, and the Linear fallback file.
- Runbook cards show Say, then the Do lines in their own box, then the prompt. Several Do lines are numbered. The box matches the prompt border, radius, and padding, with the indigo soft fill and no copy button.
- 301 beats now copy Say, Do, and Prompt from the live Outline, including optional feature tags. Three Show steps that were missing are now beats.
- The side-question step uses two cards. side-chat keeps the Outline heading. ask-subagent-progress is titled Ask what the first subagent is remediating.
- **301 beats synced to the Outline.** Four sections hold 11, 12, 5, and 6 beats (34 total). The review section has no keyboard-confirmation step.
- `ledgerly-reviewer` no longer carries the closer-inspection list. It confirms the claimed work runs, then checks the catalog, seed, and protected paths.
- Runbooks left the app. The catalog is `runbooks.html`, rendered in a Cursor Canvas by `start-ledgerly`.

## [1.0.0] - 2026-09-15

First stable release of Ledgerly as the CE field-demo app for Adopting Grok Build for AI Development.

### Released

- **101 track** — Runbooks track `101` / `RUNBOOK_SECTIONS_101` released for CE workshop demos (Adopting Grok Build for AI Development). Workshop beats are aligned to the Adopting Grok Build Outline.

### Added

- Ledgerly demo app: Fieldnote Workspace billing ops (dashboard, invoices, collections, disputes, settings). Catalog prices stay Starter $49, Growth $99, Scale $249.
- Copy-paste runbook beats in `runbooks.html` (tracks 101 and 201); presenter run-of-show in `demo-howto.md`.
- Project agents (`ledgerly-reviewer`, `api-instrumenter`, `dispute-verifier`) and skills for demo reset, Prisma lookups, workflow choice, and Cloud Agent handoff.

### Changed

- 101 govern-rule, MCP/Figma, and checkpoint-restore beats synced to the Adopting Grok Build Outline Show wording.

[Unreleased]: https://github.com/joatmon08x/ce-field-demos/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/joatmon08x/ce-field-demos/releases/tag/v1.0.0
