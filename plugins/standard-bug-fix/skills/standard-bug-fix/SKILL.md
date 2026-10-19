---
name: standard-bug-fix
description: Pull one ce-field-demos Linear issue by title or identifier, fix only that Ledgerly bug, and write hypothesis, debug notes, and the fix PR back to Linear. Use when the user runs /standard-bug-fix with a field-demo title such as the Overdue or Needs review filter bug.
---

# Standard bug fix

Work one Linear issue from the operator’s **ce-field-demos** project. Keep Linear current. Do not invent a second issue. Do not expand scope to catalog migration, dispute resolution, or unrelated UI.

## Prerequisites

This plugin ships the Linear MCP server (`https://mcp.linear.app/mcp`). If Linear tools are missing, authenticate that MCP, then continue. If the project is empty, tell the operator to run `stage-linear`.

## 1. Read the ticket

Call Linear MCP:

1. `list_projects` query `ce-field-demos` — use the project on the confirmed team. Public and private teams are both valid.
2. `list_issues` on that project. Match `FIELD_DEMO_ISSUES` titles in `runbooks/linear-field-demos.ts` when the user passed a title (the 201 paste uses titles).
3. `get_issue` only when the user passed a real identifier (for example `CE-16`). Do **not** assume `LY-003` is the filter bug. After `stage-linear` on a `LY` team, identifiers follow create order: suggested-credit, then filter, then email — so `LY-003` is the email story.

Work only the matched ticket. Then `save_issue` on that issue only: `state`: `In Progress`. Do this before product edits. Do not change any other issue. Do not mark the issue Done or Complete.

## 2. Stay inside the ticket

- Reproduce on the URLs in the issue body.
- Edit only paths named in the issue unless a listed file clearly imports a one-line helper you must touch.
- Catalog stays Starter **$49**, Growth **$99**, Scale **$249**. Seed names and `.example` emails only. Operator is Avery Quinn.
- Do not "correct" the $400 claim on `dsp_1043`.
- Do not edit `tests/suggested-credit-api.test.ts` to force green.
- Do not finish the dispute resolution stub unless the ticket names it.

## 3. Known 201 cards

- **Invoice detail has no control to change customer email** — skip email validation.
- **Suggested credit on dsp_1043 shows $400 instead of the $249 Scale cap** — switch the suggested-credit client to v2 only.
- **Clicking Overdue or Needs review does not filter the queue** — fix filter selection so the active pill matches the table.

## Linear comment template

Every Linear writeback uses this shape. Concise. No extra sections.

```markdown
# Bug Fix Summary: [Service affected] - [Short Description]

## 1. The Core Problem (Why it happened)
* **Immediate Trigger:** [e.g., A missing environment variable after deployment.]
* **Underlying Flaw:** [e.g., The deployment script lacked a validation step to ensure keys existed before spinning up containers.]

## 2. Quick Takeaways
* **Good:** Detection was instant; rollback process worked flawlessly.
* **Bad:** Debugging took too long because logs lacked contextual request IDs.

## 3. Fixes
- [ ] **Action:** Add check to deployment script | **Owner:** @name | **PR:** #123
```

## Sequence

1. **Read the issue** as in §1. Reproduce from the repo (tests, seed, running app).
2. **In Progress.** `save_issue` on that issue: `state`: `In Progress`. Skip if it is already In Progress. Do not move other issues. Do not mark Done or Complete.
3. **Hypothesis (Linear comment).** Before product edits, comment with the template. Fill **Service affected**, **Short Description**, and **Core Problem**. Leave Takeaways/Fixes as `TBD` if unknown.
4. **Debug.** Instrument or inspect only what you need. Note what confirmed or killed the hypothesis.
5. **Debugging notes (Linear comment).** Comment again with the template. Keep Core Problem; fill **Quick Takeaways** (Good / Bad) from the actual debug path.
6. **Fix.** Smallest change that matches the ticket. Verify with the relevant tests (and the UI path if the change is visible).
7. **PR.** Open a pull request for the fix. Do not merge it.
8. **Fix PR (Linear comment).** Comment with the **full** template. Check the Fixes item (`[x]`). **Action** is what shipped. **Owner** is the Linear assignee, or Avery Quinn. **PR** is the PR number or URL. Link the PR on the Linear issue if the MCP can.

Do not skip the three Linear comments. Do not paste secrets, production PII, or real company names into Linear.

## 4. Finish

Run the tests that cover the files you changed. Leave the planted suggested-credit red test red unless this issue is the dsp_1043 client migration and the user asked to migrate.
