# Sentry (Ledgerly)

Use the Sentry MCP (`plugin-sentry-sentry`). Inspect tool schemas first. Read-only: do not resolve, assign, or comment on issues. Auth failures → stop and report the gap.

## What this source contains

- Errors and messages captured by `lib/sentry.ts` and `captureDemoBug` in `lib/demo/capture-bug.ts`
- Tags: `bug_id` (the demo bug id) and `fingerprint`, which the Linear bug cites as **Sentry fingerprint**
- The acting customer (`?as=`) attached by `lib/sentry-user.ts`
- First seen / last seen dates and event counts
- Release and environment, when set

## How to search it

1. **Start with the anchor.** If the Linear issue gives a **Sentry fingerprint** or **Bug id**, search by that tag first.
2. **Keyword search.** Error messages, route paths (`/api/v1/disputes/`), symbols, and dispute or invoice ids such as `dsp_1043`.
3. **Read one full event.** Stack trace, breadcrumbs, and tags. Note which code path ran.
4. **Compare dates.** First seen against the commit that introduced the code.

## What good evidence looks like here

- An issue whose first-seen date lines up with a commit or PR
- A `bug_id` tag that matches the registry entry under investigation
- A stack trace that lands on the target lines

## Common pitfalls

- **Errors are not intent.** Sentry shows that something failed, not why the code was written that way. File it as Indirect unless an issue comment states rationale.
- **Demo triggers.** `/api/demo/trigger-error?scenario=<id>` creates events on purpose (scenarios in `lib/demo/error-scenarios.ts`). Say so when a hit came from one.
- **Retention.** Old events may be gone. Note the cliff.

## What to return

For each relevant Sentry issue:

- Issue id, title, and URL
- Tags that matter (`bug_id`, fingerprint, acting customer)
- First seen, last seen, event count
- The frame or breadcrumb that ties it to the target code
