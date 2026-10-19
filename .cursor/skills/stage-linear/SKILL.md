---
name: stage-linear
description: Create or reconcile the ce-field-demos Linear board with its Fieldnote issues. Public and private teams are both valid.
---

# Stage Linear

The agent reads issues from Linear. Run this before a beat that needs the Fieldnote board.

Catalog stays Starter **$49**, Growth **$99**, Scale **$249**. Operator Avery Quinn. No real customers.

Issue bodies live in `runbooks/linear-field-demos.ts`. The board has two sets on the **same** project, never a second project:

- **Fieldnote issues** — the three in `FIELD_DEMO_ISSUES`. The 101/201 beats name only these titles.
- **Collections Command Center slices** — the nine in `COLLECTIONS_COMMAND_CENTER_ISSUES`, each tagged as part of the Collections Command Center feature (§3a).

A WCAG audit already on that project (`WCAG_KEYBOARD_WALKTHROUGH`) is a manual keyboard walkthrough. Update that copy in place. Do not add it to a clean board.

Do not invent another issue or a fourth price.

## Team

**Public and private teams are both valid.** A public team makes the project visible to that team. Linear MCP cannot create teams.

The same steps are in `README.md`, `demo-howto.md`, and `AGENTS.md`. Repeat them if the operator has no team yet:

1. Open Linear → **Settings → Teams → New team**.
2. Name it for this operator only (example: `{displayName}-field-demos`).
3. Leave it public, or turn on **Make team private**. Team key can be **LY**. Settings URL looks like `https://linear.app/<workspace>/settings/teams/LY`.
4. When the team is private, members are **only the operator**.
5. Do not attach the project to a different team later.

If the operator has no team yet, **stop**. Point them at those docs. Linear MCP cannot create teams.

## 1. Linear MCP

Authenticate the Linear plugin (`mcp_auth` if tools are gated). Confirm `get_user` with `"me"`:

- `isGuest` is false

If the user is a guest, stop.

## 1a. Confirm the target team (required)

Never **assume** which team to write to — not even when only one team exists, and not from a name that looks like `{displayName}-field-demos`. An operator may name the team anything; confirm it, do not guess. Public and private teams are both candidates.

1. Build the candidate list: every team on `me` (from `get_user` → `teams`, or `list_teams`). Free-form names are fine — any team name is valid, not just `{displayName}-field-demos`.
2. Present each candidate with: team name, team key (e.g. `LY`), privacy, and the settings URL `https://linear.app/<workspace>/settings/teams/<KEY>`.
3. **Interactive run:** stop and have the operator confirm exactly one team before any write. A team name already in the request is that confirmation when it matches exactly one candidate.
   **Non-interactive run (cloud/background):** require an explicit team name or ID in the request. If none was given, or more than one candidate matches it, stop and print the candidates — do not guess.
4. If the operator has no teams, stop and point them at the team steps. Linear MCP cannot create teams.
5. Pin the confirmed team for the rest of the run. Every `save_project` and `save_issue` uses only that confirmed team ID or name.

## 2. Reconcile the project

Search `list_projects` with query `ce-field-demos`, scoped to the confirmed team.

- Reuse a project **only** when its `teams` are exactly the confirmed team and `lead` is the operator (`me`).
- If `ce-field-demos` already exists on a different team, do **not** reuse it. Create `ce-field-demos ({displayName})` on the confirmed team instead.

Create it with `save_project` only when it is missing. Otherwise update the existing project in place:

- `name`: `ce-field-demos` (or the uniqued name above)
- `setTeams`: the confirmed team name or ID
- `leadTeam`: that same team
- `lead`: `"me"`
- `state`: `Backlog` — not a company initiative
- `summary`: from `LINEAR_FIELD_DEMOS_PROJECT.summary`
- `description`: Fieldnote demo board. Three scoped issues plus the Collections Command Center slices. Personal. Confirmed team only.

A prior `reset-demo-state` may leave this project `Canceled` with its issues `Canceled` and still attached (they are not unlinked on reset). Reactivate it: setting `state`: `Backlog` here reopens the board, and §3 sets those `Canceled` issues back to their catalog state. Archived issues are not reopened.

Do not add initiatives, Slack channels, or extra teams.

## 3. Seed issues

`list_issues` on that project with `includeArchived: true`. Match a **non-archived** issue by **exact title** from `FIELD_DEMO_ISSUES`, or by that issue’s `previousTitles` if the board still has the old title. For each such match, `save_issue` with the existing Linear issue identifier and the current title, description, priority, and state so copy stays in sync. Do not create a duplicate when the title only changed.

An issue with `archivedAt` set is not a match. Do not unarchive it, and do not `save_issue` it to bring it back. Treat that title as missing and create a new issue. Leave the archived issue archived and linked.

Create missing issues **sequentially** in the `FIELD_DEMO_ISSUES` array order. Never create them in parallel:

1. `Suggested credit on dsp_1043 shows $400 instead of the $249 Scale cap`
2. `Clicking Overdue or Needs review does not filter the queue`
3. `Invoice detail has no control to change customer email`

Within a Fieldnote create batch, create them in that order, so the filter issue is second in the batch. Do not unarchive an older issue to keep an earlier timestamp. For each missing issue, `save_issue`:

- `team`: the confirmed team
- `project`: the project name or ID
- `title`, `description`, `priority`, `state` from the catalog
- `assignee`: `"me"` (the operator). Never create Avery Quinn as a Linear user.

If a matched issue already exists but is `Canceled` (left by a prior `reset-demo-state`), reuse it — `save_issue` with its `id` and set `state` back to its catalog value (`Todo` / `In Progress`). Do not create a duplicate.

Do not create workspace-wide labels. Put type (Story / Bug) in the description heading if useful. The Fieldnote issues carry no label.

Do not comment as a fake reporter. Avery Quinn copy is already in the description.

## 3a. Collections Command Center slices

Stage these **after** the three Fieldnote issues exist, on the **same** project. Do not create a second project, initiative, or milestone for the feature. Everything here is read from `COLLECTIONS_COMMAND_CENTER_ISSUES` and `COLLECTIONS_COMMAND_CENTER_LINEAR` in `runbooks/linear-field-demos.ts`.

**Tag.** Every slice is marked as part of the Collections Command Center feature in two places:

1. **Description note** — the description **starts** with `COLLECTIONS_COMMAND_CENTER_LINEAR.note`. Build the whole body with `collectionsCommandCenterDescription(issue)` (run it with `npx tsx -e` or read the function and assemble the same sections in the same order). Do not hand-write the note or drop the `Slice N of 9 · pattern · Covers …` line. That function writes the requirement ids with a non-breaking hyphen (`FR‑1`). Do not rewrite them to `FR-1`: Linear treats that as an issue key on the FR team.
2. **Team-scoped label** — `COLLECTIONS_COMMAND_CENTER_LINEAR.label` (`Collections Command Center`) on the confirmed team only. `list_issue_labels` for that team; if missing, `save_issue_label` with `name` and `teamId` = the confirmed team's UUID. Never omit `teamId` — that creates a workspace label, which this skill forbids. If the label exists on another team or the workspace, do not reuse it; skip the label and rely on the description note.

**Reconcile.** `list_issues` on the project with `includeArchived: true`. Match a **non-archived** issue by **exact title** from `COLLECTIONS_COMMAND_CENTER_ISSUES`. For each such match, `save_issue` with its identifier, the current `title`, the rendered `description`, `priority`, `state`, and `addLabels: [label]` so copy and tag stay in sync. A non-archived match left `Canceled` by `reset-demo-state` is reused: set `state` back to `Todo`. Do not create a duplicate.

An archived slice is not a match. Do not unarchive it. Create a new issue for that title and leave the archived one archived.

Create missing slices **sequentially** in array order, after the three Fieldnote issues. Never in parallel. For each, `save_issue`:

- `team`: the confirmed team
- `project`: the same project as the Fieldnote issues
- `title`: from the catalog
- `description`: `collectionsCommandCenterDescription(issue)`
- `state`: `COLLECTIONS_COMMAND_CENTER_LINEAR.state` (`Todo`)
- `priority`: `COLLECTIONS_COMMAND_CENTER_LINEAR.priority` (3, Medium)
- `assignee`: `"me"`
- `addLabels`: `[COLLECTIONS_COMMAND_CENTER_LINEAR.label]` when the team label exists

Array order:

1. `Customers account shows its overdue book`
2. `Recording a full payment marks the invoice paid`
3. `A payment that is not the outstanding balance does not mark the invoice paid`
4. `Account detail saves a collection note`
5. `Avery can edit a collection note for 15 minutes`
6. `Sending a Nudge logs it on the account`
7. `A Nudge that cannot be emailed shows as failed`
8. `Dashboard shows collections totals on the next load`
9. `Dollar amounts stay masked outside Starter, Growth, and Scale`

These slices are not 101/201 beats. Do not paste them into runbooks, and do not put the tag on the three Fieldnote issues.

## 3b. WCAG audit

`WCAG_KEYBOARD_WALKTHROUGH` in `runbooks/linear-field-demos.ts` is a manual keyboard walkthrough. That is the whole WCAG 2.2 Level AA audit. A static pass over markup or tokens does not complete it.

The title is `UI changes need a WCAG 2.2 AA accessibility audit`. It is not one of the three Fieldnote issues and not a Collections Command Center slice. Do not add it to `FIELD_DEMO_ISSUES`, do not tag it with the feature label, and do not paste it into a runbook beat.

Reconcile it only when a **non-archived, non-`Canceled`** issue on this project already has that exact title. `save_issue` with that identifier and the catalog `description`, `priority`, and `state`. The description must start by saying the issue is a manual keyboard walkthrough (Tab, Shift+Tab, Enter, Escape on the running invoices page). Do not create this title when it is missing. Do not unarchive it. A `Canceled` copy stays canceled.

## 3c. Extras

After seeding both sets, list any **active** (non-`Canceled`) issue on the project whose exact title is not a current `FIELD_DEMO_ISSUES` or `COLLECTIONS_COMMAND_CENTER_ISSUES` title, is not `WCAG_KEYBOARD_WALKTHROUGH.title`, and was not already matched via `previousTitles`. **Confirm with the operator before canceling any of them** — the confirmed team may hold unrelated work. On confirmation, cancel each extra (`save_issue` with `state`: `Canceled`). Never cancel extras silently. Never cancel the WCAG keyboard-walkthrough issue as an extra. Leave canceled extras linked to the project — do not reopen them, and do not unlink them.

## 4. Confirm

Report:

- The confirmed team: name, key, and settings URL
- That every write used only the confirmed team
- Project URL
- Three Fieldnote issue identifiers + titles + URLs
- Nine Collections Command Center identifiers + titles + URLs, and that each description starts with the feature note and carries the team label (or that the label was skipped and why)
- That `teams` on the project is only the confirmed team
- That the **unarchived, non-`Canceled`** issues on the project are exactly one of each of the three Fieldnote titles plus the nine Collections Command Center titles, and the WCAG issue only when that title was already on the board — ignore canceled and archived leftovers still linked from a prior reset or reconcile
- When the WCAG issue is present: its description starts by saying the audit is a manual keyboard walkthrough, and it was not canceled as an extra
- That the filter issue is second within its Fieldnote create batch
- Any canceled or archived leftovers still on the project (titles only), if present

Runbook pastes use **titles**, not identifiers, so you do not edit runbook beats after minting IDs.

## Record for reset

After confirming the team and all twelve **unarchived** issue identifiers (three Fieldnote, then nine Collections Command Center), record that board. When the WCAG keyboard-walkthrough issue is on the board, append its identifier after those twelve. Do not record archived identifiers:

```bash
npm run demo:session -- record linear <teamId> "<teamName>" <teamKey> <projectId> <issueId,...,issueId>
```

The reset script will use only this recorded board. If a demo beat creates a new leftover, update its event record and `scripts/demo-reset.ts` in the same change.

## What this unblocks

1. Add Linear MCP (Customize → MCPs).
2. Fix the suggested-credit bug (`FIELD_DEMO_SUGGESTED_CREDIT_TITLE`).
3. Linear from the marketplace if the plugin is not already connected.
4. `/standard-bug-fix` on `FIELD_DEMO_FILTER_TITLE`.

## Never

- Never unarchive an issue. Create a new issue for an archived catalog title and leave the archived one archived.
- Never stage onto a team the operator did not confirm.
- Never put the Collections Command Center slices on a second project, and never add them to `FIELD_DEMO_ISSUES` or a runbook beat.
- Never create a workspace-wide label; the feature label is team-scoped or skipped.
- Never complete dispute resolution or migrate suggested-credit as part of staging.
- Never edit `tests/suggested-credit-api.test.ts` or the seed.
- Never add local ticket-board routes, MCP servers, or marketplace copies.
