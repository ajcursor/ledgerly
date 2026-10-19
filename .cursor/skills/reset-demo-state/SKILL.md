---
name: reset-demo-state
description: Run the scripted Ledgerly demo reset first, then complete only the MCP cleanup it reports.
---

# Reset the demo state

Run the script first. It is the source of truth for local cleanup.

```bash
npm run demo:reset
```

The command restores tracked files with `git reset --hard HEAD`, switches to `main`, removes recorded demo rules, skills, Canvas files, and demo branches, removes the known project path `.cursor/agents/accessibility-auditor.md`, reseeds SQLite, restarts port 43173, and confirms **1 failed / 31 passed**. It leaves the suggested-credit client on v1 and filter pills writing `state=`. It never runs `git clean`, removes an unrecorded personal skill, or deletes the Linear team.

## Session events

Start each demo session and record artifacts as they are created:

```bash
npm run demo:session -- start
npm run demo:session -- record skill "$HOME/.cursor/skills/<created-skill>"
npm run demo:session -- record project-path .cursor/agents/accessibility-auditor.md
npm run demo:session -- record branch <linear-gitBranchName> --remote
```

The ignored `.cursor/demo-session-events.json` stores recorded paths, branches, Figma file keys, and Linear identifiers. Use `npm run demo:session -- status` to inspect it. One reset clears everything it knows about — there is no per-track reset. Without the file the command still resets tracked files and the known demo paths, and says so in `skipped`. When a demo beat creates a new leftover, update `scripts/demo-reset.ts` and its event record in the same change.

## Demo-beat git branches

The script switches to main (`git checkout main` equivalent), then uses `git branch -D` and, for recorded remotes, `git push origin --delete`. It restores `app/invoices/page.tsx` and `app/disputes/page.tsx` along with every other tracked change. Do not repeat those commands after the script succeeds.

## Remaining actions

Read the JSON report printed by `demo:reset`. Only complete its `remaining` actions:

- **Figma:** for each recorded Slides `fileKey`, load `figma-use` and `figma-use-slides`, then remove every slide with `slide.remove()`.
- **Cursor user rule:** use `cursor_dialog` only for a recorded rule ID with no filesystem path. Do not remove unrelated user rules.
- **301 Reviewer automation:** this optional automation is not in the report. Remove it by hand in the Automations tab.
- **Linear:** offer teardown whenever the Linear MCP is connected, but act only when the report lists a recorded `ce-field-demos` board. Confirm the exact team before any write: present its name, key, privacy, and `https://linear.app/<workspace>/settings/teams/<KEY>`. Public and private teams are both valid. Never assume or guess a team. Cancel each recorded issue with `save_issue` (`state`: `Canceled`) and then the project with `save_project` (`state`: `Canceled`). The catalog is `FIELD_DEMO_ISSUES` plus `COLLECTIONS_COMMAND_CENTER_ISSUES`; the recorded board lists all twelve, and the WCAG keyboard-walkthrough issue when that title was on the board. That audit is a manual keyboard walkthrough. Cancel it with the other recorded issues. Do not delete the team, and do not treat the walkthrough issue as a reason to skip teardown. Leave the issue linked, leave the team-scoped `Collections Command Center` label in place, and retain the team. `stage-linear` reactivates the board. The script uses the Linear API only with both `LINEAR_API_KEY` and explicit `--confirm-linear`.

If the event file is missing or a beat predates this script, use the old discovery flow cautiously: list candidates, do not guess a team, and never cancel issues outside the recorded board.

## Never

- Never edit `tests/suggested-credit-api.test.ts`, either suggested-credit API route, or the seed to make the shipped red test green.
- Never delete a path outside the script's allowlist.
- Never cancel Linear issues on a team the operator did not confirm, and never delete the team.
