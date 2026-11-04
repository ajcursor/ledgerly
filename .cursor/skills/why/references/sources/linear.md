# Linear (Brightdesk / Ledgerly)

## What this source contains

- Bugs, features, and improvements for Ledgerly
- Bug descriptions with **Bug id**, **Sentry fingerprint**, **Affected area**, then Symptom, Repro (Expected / Actual), and Notes
- Comments clarifying scope or decisions, including "Implementation complete" comments from agents
- Labels (`Bug`, `feature`, `Improvement`), priority, linked PRs
- Status history: Backlog, Todo, Agent In Progress, In Progress, Ready for Review, In Review, Done, Canceled, Duplicate

Default project: **Brightdesk / Ledgerly** on team **AJCursor** (key `AJC`), workspace `xsi-linear`. Project URL: https://linear.app/xsi-linear/project/brightdesk-ledgerly-b94465ae260c. Issue URLs look like `https://linear.app/xsi-linear/issue/AJC-5`.

The ce-field-demos project is a separate demo board staged by `stage-linear`. Search it only when a seed points there.

## How to search it

Use the Linear MCP (`plugin-linear-linear`). Read-only: do not save issues, comments, or labels.

1. **Start with linked keys.** If commits, branch names, or PRs mention `AJC-` keys, fetch with `get_issue`. Read comments with `list_comments`. Read the description and comments fully.
2. **Keyword search** with `list_issues`, scoped to the project and team:

   ```
   list_issues(team: "AJCursor", project: "Brightdesk / Ledgerly", query: "<feature or symbol>")
   ```

   Try multiple phrasings: feature name, module (`getSuggestedCredit`, `countOverdueInvoices`, `lineAmountCents`), demo bug id (`credit_v1`), user-visible strings, bug symptoms. Page with `cursor` while `hasNextPage` is true.
3. **Include closed work.** Canceled, Duplicate, and Done issues often carry the decision. Do not filter to open issues only.
4. **Walk links.** Parent, related, duplicates, and attachments linking to PRs.
5. **Read labels and priority.** Bugs vs features signal different motivations.

## What good evidence looks like here

- A Bug whose Expected matches the code under investigation
- A feature with acceptance criteria stating the product constraint
- A comment recording "we decided X because Y"
- A **Bug id** that matches an entry in `lib/demo/bugs.ts`
- Links from the issue to a PR that shipped the change

## Common pitfalls

- **Template boilerplate.** "Improve UX" without specifics is weak evidence.
- **Scope drift.** Issue reopened with a different meaning than the original ship.
- **Duplicates.** Multiple similar bugs may exist — compare dates to the code's ship window.
- **Wrong project.** Stay in Brightdesk / Ledgerly unless a seed explicitly points elsewhere.
- **Auth / access failures.** Report as a gap; don't invent findings.
- **Presenter language.** Do not copy "planted" or "demo bug" wording out of an issue into a new Linear comment if you are the one writing it. Quoting an existing issue is fine when the citation needs the exact words.

## What to return

For each relevant issue:

- Issue key and title
- Motivation quoted from description or comments (verbatim when it matters)
- Labels, priority, status, dates
- Linked PRs / related keys
- URL
