# Ledgerly

Fictional B2B billing ops. Fieldnote Workspace. Operator **Avery Quinn**. Catalog is Starter **$49**, Growth **$99**, Scale **$249**. Demo clock is frozen at **23 August 2026**. Synthetic data only — no real companies.

Use it for the jumpable Grok Build **101**, **201**, and **301** tracks. Copy-paste prompts live in `runbooks.html`. `start-ledgerly` renders that file in a Cursor Canvas. The Catalog menu switches tracks; `runbooks.html?track=201` selects 201 and `runbooks.html?track=301` selects 301 when the file is opened on its own. The presenter run-of-show and speaker notes are `demo-howto.md`.

## Run

Node 20. Nothing else global.

```bash
npm i
npx prisma generate
npx prisma db seed
npm run dev
```

Open **http://localhost:43173**. Or ask an agent to run the `start-ledgerly` skill — it starts the app on 43173, seeds only when the database is missing or empty, and opens `runbooks.html` in a Cursor Canvas.

`npm test` is **1 failed / 65 passed** on a clean tree — `tests/suggested-credit-api.test.ts` is the planted API-version bug. The UI shows the deprecated v1 result of $400 for `dsp_1043`; v2 and the stored credit correctly cap at the $249 Scale price. Status pills on Invoices and Disputes write `state=` while the pages read `status`, so clicking a filter does not change the list — that is a separate planted UI seam, not a second red test. Reset a demo with `npm run demo:reset` first; `reset-demo-state` only finishes reported MCP cleanup. Use `npm run db:reset` only for data.

### Planted demo issues

These are intentional. Leave them for the demo, and do not ship them outside demos.

- **Suggested credit.** `tests/suggested-credit-api.test.ts` stays red because `lib/disputes/suggested-credit-api.ts` selects deprecated v1 while the `credit_v1` bug is on. That is the default. Do not edit the test, either route, or the seed to make the suite green.
- **W2 Tab listener.** `.cursor/plans/keyboard-walkthrough-audit.md` tells the W2 task to add a document-level `keydown` listener in the app chrome that calls `event.preventDefault()` whenever the key is Tab. That step is intentional. It would block Tab on every page if that listener is added in the shell. `components/app-chrome.tsx` does not contain it yet. The change reviewer should flag it as High. It must never ship outside demos. Do not remove it, reword it, or label it inside the plan.

`npm run test:a11y` runs the WCAG checks in `tests/a11y/` (4.5:1 text contrast and missing labels). They are not part of `npm test`. The command currently fails on contrast (status badges, some muted text, and growth text); label checks pass.

## Switchable demo bugs

`lib/demo/bugs.ts` is the registry. `demo/bugs.json` is the same list for later Linear issues and support transcripts. With nothing set, the run keeps today's behavior: `credit_v1` and `filter_state` on, and **1 failed / 65 passed**.

`DEMO_BUGS` is a comma-separated list and replaces the default. An empty value turns every bug off. `DEMO_SCENARIO` is `known`, `ambiguous`, `new`, or `all` and is used only when `DEMO_BUGS` is unset. `DEMO_BUGS_FILE` points at a JSON file with `{ "bugs": ["..."] }` or `{ "scenario": "known" }` and is used only when both of those are unset. Presets live in `demo/scenarios/`.

Each new bug is off unless the set includes it. Its test asserts the correct behavior, so the test is red while the bug is on and green while it is off. `filter_state` does not fail a test; it is the planted pill seam.

| Id | Kind | Default | What the customer says | Sentry fingerprint | Linear title | Red test |
| --- | --- | --- | --- | --- | --- | --- |
| `credit_v1` | known | on | Suggested credit on dsp_1043 is $400.00. The Scale invoice is $249.00. | `suggested-credit-over-refund` | Suggested credit on dsp_1043 shows $400 instead of the $249 Scale cap | `tests/suggested-credit-api.test.ts` |
| `filter_state` | known | on | Clicking Overdue or Needs review does not filter the list. | `invoice-filter` | Clicking Overdue or Needs review does not filter the queue | — |
| `overdue_count` | ambiguous | off | The dashboard overdue count is higher than the Overdue queue. | `invoice-filter` | Dashboard overdue count includes invoices that are not due yet | `tests/overdue-count.test.ts` |
| `closed_dispute_credit` | new | off | dsp_1050 was already accepted, and the $99.00 Growth credit posted a second time. | `closed-dispute-resolve` | Resolving accepted dispute dsp_1050 posts the Growth credit again | `tests/closed-dispute-credit.test.ts` |
| `line_rounding` | new | off | A Growth seat occupied for 10 of 31 days shows $32.00 instead of $31.94. | — | Prorated invoice lines round to the nearest dollar | `tests/line-rounding.test.ts` |

`overdue_count` shares the `invoice-filter` fingerprint with `filter_state`, so a support match can land in the ambiguous band. Kinds follow the triage bands: known at 0.80 or above, ambiguous from 0.60 to 0.79, new below 0.60.

```bash
# Default. credit_v1 and filter_state. 1 failed / 65 passed.
npm test
npm run demo:reset

# Known bugs only. Same set as the default.
DEMO_SCENARIO=known npm test
npm run demo:reset -- --scenario=known

# Ambiguous. The overdue count is wrong. The v1 credit test passes. 1 failed / 65 passed.
DEMO_SCENARIO=ambiguous npm test
npm run demo:reset -- --scenario=ambiguous

# New bugs. Closed-dispute credit and line rounding. 2 failed / 64 passed.
DEMO_SCENARIO=new npm test
npm run demo:reset -- --scenario=new

# Every bug. 4 failed / 62 passed. filter_state still does not fail a test.
DEMO_SCENARIO=all npm test
npm run demo:reset -- --scenario=all

# An explicit list, or a JSON file.
DEMO_BUGS=credit_v1,overdue_count npm test
npm run demo:reset -- --bugs=credit_v1,overdue_count
DEMO_BUGS_FILE=demo/scenarios/ambiguous.json npm test
npm run demo:reset -- --scenario-file=demo/scenarios/new.json
```

`npm run demo:reset` passes the chosen set to the dev server and expects that set's test result. `--bugs` wins over `--scenario`, which wins over `--scenario-file`. No flag uses the environment, then the default.

## Sentry

Error monitoring uses `@sentry/nextjs` (client, server, and edge). `@sentry/nextjs` 11 supports this app's Next.js 16 and React 19. Copy `.env.example` to `.env.local`. With no DSN set, Sentry is not initialized and no events are sent. The app still runs, builds, and tests.

| Variable | Role |
| --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser DSN. Also used on the server when `SENTRY_DSN` is empty. |
| `SENTRY_DSN` | Server and edge DSN. |
| `SENTRY_ENVIRONMENT` | Optional environment name, such as `demo`. |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Optional. `next build` uploads source maps only when all three are set. |

There is no login. Each error is attributed to a seeded customer so a support ticket can be matched on email. The Sentry user is the customer id, email, and contact name (`username`). Tags are `company` (the account name) and `plan` (`Starter`, `Growth`, or `Scale`).

The default acting customer is **Cobalt Goods** — Ellis Marlow, `accounts@cobaltgoods.example`, Scale — the account on dispute `dsp_1043`. Select another seeded customer with `?as=<email>` on any page or on the trigger route. The choice is stored in the `ledgerly-acting-customer` cookie. `?as=` with an empty value clears it. Addresses that are not in the seed are rejected. Every address is a synthetic `.example` email from `prisma/core-customers.ts` and `prisma/extra-accounts.ts`.

### Trigger an error

`GET /api/demo/trigger-error?scenario=<name>` throws only when `DEMO_MODE=true`. Otherwise it returns 404. An unknown scenario or unknown customer returns 400. Add a scenario by inserting one entry in `lib/demo/error-scenarios.ts`.

Start the app with the flag on (`DEMO_MODE=true npm run dev`), then:

```bash
curl -i "http://localhost:43173/api/demo/trigger-error?scenario=suggested-credit-over-refund"
curl -i "http://localhost:43173/api/demo/trigger-error?scenario=closed-dispute-resolve"
curl -i "http://localhost:43173/api/demo/trigger-error?scenario=invoice-filter&as=billing@acmenorth.example"
```

| Scenario | Feature | What it throws |
| --- | --- | --- |
| `suggested-credit-over-refund` | disputes | Suggested credit for `dsp_1043` would refund the raw $400.00 claim against Scale invoice `inv_1043` ($249.00). |
| `closed-dispute-resolve` | disputes | Resolve was requested for `dsp_1050`, which is already `ACCEPTED`. |
| `invoice-filter` | invoices | The invoice queue failed while applying the Overdue filter. |

The thrown error is reported to Sentry with tags `scenario` and `feature`, plus the acting customer's user and `company` / `plan` tags.

## App

Dashboard, Invoices, Collections, Disputes, Settings. Extra book accounts are in `prisma/extra-accounts.ts`.

| Demo hook | Where |
| --- | --- |
| Runbook beats | `runbooks.html`, rendered in a Cursor Canvas by `start-ledgerly`. Regenerate with `npm run runbooks:export` after editing `runbooks/beats/` |
| `/loop` job | `POST` then `GET` `/api/demo/job` (~45s, not written to SQLite) |
| Agents | `.cursor/agents/` — `ledgerly-reviewer`, `api-instrumenter`, `dispute-verifier`, `change-reviewer` |
| Skills | `.cursor/skills/` — run the demo, stage Linear, or pick a Cursor workflow |
| Disk plugin | `plugins/standard-bug-fix/` — add from local repository; `/standard-bug-fix`, Linear MCP |
| Presenter script | `demo-howto.md`, the 101, 201, and 301 run-of-show |

## Starter prompts

Ask:

```text
What are Ledgerly's only plan prices, and which seeded invoices are overdue? Cite lib/plans.ts, prisma/seed.ts, and prisma/extra-accounts.ts.

Explain the dispute flow end to end. What is intentionally unfinished? Cite the resolve helper, the resolve API route, and the dispute page. Do not edit any files.
```

Cmd-K on the settings description default:

```text
Rewrite this input's default value as one calm sentence explaining that the demo clock is frozen on 23 August 2026 so overdue math never drifts during a meeting. Keep it under 15 words.
```

Agent — suggested-credit API migration:

```text
Diagnose why dsp_1043 shows a $400 suggested credit even though v2 caps it at $249. Switch lib/disputes/suggested-credit-api.ts from v1 to v2. Preserve both API routes, the $400 dispute claim, and tests/suggested-credit-api.test.ts. Run the relevant tests and verify the page shows $249 from v2.
```

Then create the guardrail live:

```text
/create-rule Future code must never call /api/v1/disputes/*/suggested-credit. It must use /api/v2/disputes/*/suggested-credit. Create the project rule at .cursor/rules/suggested-credit-api-v2.mdc and show me the file before I keep it.
```

Design Mode on the dashboard KPI cards:

```text
Restyle the four KPI cards on this dashboard using only the existing design tokens in app/globals.css: a soft indigo accent on each card, stronger emphasis on the value, and a subtle hover lift. No new hex colors, no layout rewrite, no data or price changes — $49, $99, and $249 stay exactly as rendered. Touch components/kpi-card.tsx, and app/page.tsx only if you must. Two files max, nothing under lib/ or tests/. Show me the diff — I am undoing this after the demo.
```

## The 101 track

Open `runbooks.html` in the Canvas (track 101), copy a card, and paste it in Grok Build. You still review the result.

1. **What is Grok Build?** — Ask, Plan, Build in Agent mode, Debug, and check the models.
2. **How do you work with an agent?** — Run Mode allowlist, verify the email feature, redact, stop, interrupt and steer, continue to the end, review diffs, restore from a checkpoint.
3. **How do you govern an agent?** — create and test a rule, create and test a skill, Canvas, MCP / Figma.

## The 201 track

Open `runbooks.html?track=201`, or switch to 201 with the Catalog menu in the Canvas, copy a card, and paste it in Grok Build. You still review the result.

1. **How do you manage context?** — rename agents, Ask DDD (whole app vs `@invoice-table.tsx`), check context usage, compare agents, ask across chats.
2. **How do you standardize agent behavior?** — personal create-api skill, promote it to the project.
3. **How do you connect an agent to external tools?** — Linear MCP, MCP allowlist, list open issues from the issue tracker, add `plugins/standard-bug-fix` from the local repository, enable the Standard bug fix plugin (skills, rules, MCP server), standard bug fix on the overdue filter. Use a public or private Linear team, then run `stage-linear`.
4. **How do you parallelize a task?** — open a new agent, open the resolve-dispute plan, ledgerly-reviewer, dispatch-subagents skill, `/multitask`, Canvas subagent progress, ledgerly-reviewer check.

## The 301 track

Open `runbooks.html?track=301`, or switch to 301 with the Catalog menu in the Canvas, copy a card, and paste it in Grok Build. You still review the result. Optional features are checkboxes, checked by default. Uncheck a feature to hide its beats. The choice is saved in the browser.

1. **How do you break down tasks for agents?** Open a local agent, create accessibility-auditor, point the subagent at a faster cost-efficient model, optionally move to a Cloud Agent, `/multitask` the audit, and watch the Working tab.
2. **How do multiple agents go from plan to PR?** Optionally start and stage a Project, list collections issues, plan and build, `/side`, consolidate into a PR, and fall back to repo issues if Linear MCP is unavailable.
3. **How do you scale AI code reviews?** Feature branch, change reviewer subagent, high severity issues, optional Bugbot, highest-risk slice.
4. **How do coworkers share ownership safely?** Shift findings into a rule, skill, hook, test, subagent, or a person, optional Reviewer automation, and files that might conflict.

## Choose the Linear team (manual)

Linear MCP cannot create teams. Public and private teams are both valid. Do this in the Linear UI **before** the 201 MCP section when the operator does not already have a team.

1. Open Linear → **Settings → Teams → New team**.
2. Name it for this operator only (example: `{displayName}-field-demos`).
3. Leave it public, or turn on **Make team private**. Team key can be **LY**. Confirm it at `https://linear.app/<workspace>/settings/teams/LY`.
4. When the team is private, members are **only you**.
5. Then ask an agent to run `stage-linear`. That skill creates or reconciles project `ce-field-demos` on this team with the three Fieldnote issues plus the nine Collections Command Center slices, tagged as that feature.

`stage-linear` never guesses the team — it lists your teams and asks you to **confirm the exact one** before writing, so any team name works. `reset-demo-state` uses the same confirmation, then cancels the recorded issues and cancels the project (issues stay linked; your team is retained for the next run).

A public team makes the project visible to that team.
During a fresh setup, create issues sequentially: suggested-credit first, **Clicking Overdue or Needs review does not filter the queue** second, and invoice-email third.

## Agents and skills

| Name | Role |
| --- | --- |
| `ledgerly-reviewer` | Read-only review after a change. Confirms the work runs, then catalog, seed names, and planted seams. |
| `api-instrumenter` | One API route per parallel worker. |
| `dispute-verifier` | Dispute-resolution finish line. No product code. |
| `change-reviewer` | Diff inspection with `readonly: false` so it can run `git status` and `git diff`. Its instructions forbid edits. Reports Passed, then Incomplete with high, warning, and suggestion findings for sensitive data, hard rollback, missing tests, edited failing tests, scope outside the plan, and new dependencies or shell commands. |
| `choose-cursor-workflow` | Walk the 101, 201, or 301 track and pick the mode or model. |
| `stage-linear` | Reconcile Fieldnote issues on the `ce-field-demos` Linear project. Public and private teams are both valid. |
| `standard-bug-fix` | Pull one ce-field-demos Linear issue, then fix only that bug. |
| `dispatch-subagents` | Parallel Task launches. |
| `hand-to-cloud-agent` | Hand durable work to a Cloud Agent. |
| `autopilot` (built in) | Current PR-to-merge-ready skill; formerly `/babysit`. |
| `automate` (built in) | Draft a scheduled or event-triggered Grok Build Automation. |

## Notes

- Prices and customer names only from `lib/plans.ts`, `prisma/seed.ts`, and `prisma/extra-accounts.ts`.
- Port 43173 busy: stop the old `npm run dev`. Empty dashboard: `npm run db:reset`.
