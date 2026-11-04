# Incident & postmortem context (Ledgerly)

Not a separate source — a **cross-cutting angle**. Defensive code in this repo is often motivated by a billing invariant (credit capped at the catalog price, cents not floats, aging against the demo clock) rather than a production SEV.

Append these hunts **inside** your assigned source when the target looks defensive: `Math.min` around a credit, catalog lookups in `lib/dispute-credit.ts`, rounding in `lib/invoice-lines.ts`, aging basis in `lib/dashboard.ts`, validation that blocks a page or route.

## What to hunt (by source)

- **Local docs**: `AGENTS.md`, `.cursor/rules/ledgerly.mdc`, and `demo-howto.md` sections that name the failure mode. The matching entry in `lib/demo/bugs.ts`.
- **Linear**: Bugs in Brightdesk / Ledgerly with an Expected matching the guard; Urgent or High priority; titles mentioning the symptom near the ship date.
- **Slack**: Threads about wrong credit, over-refunds, overdue counts, or rounding. Do not assume a channel name.
- **Sentry**: Issues tagged with the matching `bug_id`, or errors on the guarded route.
- **Git / gh**: commits/PRs saying "fix", "cap", "round", "aging"; tests named for the edge case.

## What good evidence looks like

- A doc section + Bug issue + PR that all name the same failure mode
- A test added in the same commit as the guard, asserting the boundary (credit capped at $249 on a Scale invoice, overdue count matching the aging basis, line totals in whole cents)

## What to return

Incident-flavored hits with quotes and citations, filed under Direct / Indirect in the normal investigator output. Note when you hunted for incident context and found none.
