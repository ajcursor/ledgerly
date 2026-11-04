# Code Archaeology (git + in-repo) — Ledgerly

Remote: `ajcursor/ledgerly` on GitHub. Prefer `gh --repo ajcursor/ledgerly`.

**Handoff:** Explicit design rationale in `AGENTS.md`, `.cursor/rules/ledgerly.mdc`, or `demo-howto.md` belongs to the long-form-docs investigator. Here, note those mentions in commits/PRs as Additional Leads; still search inline comments and tests yourself.

## What this source contains

- Commit history (messages, dates, authors, diffs)
- PR descriptions, review comments, and discussion threads (via `gh`)
- Inline code comments, TODOs, FIXMEs, deprecation notes
- Tests under `tests/` — names and assertions often encode the motivating edge case
- Related files modified in the same commits (co-change signal)
- Linear keys (`AJC-`) in branch names, commit messages, and PR bodies
- Co-changes with `AGENTS.md`, `lib/demo/bugs.ts`, `demo/bugs.json`, or `demo-howto.md`

The most trustworthy source tied directly to the code. Everything that went through the repo should be here.

## How to search it

Expand the seed commit list:

```bash
git log --follow --oneline -- <file>
git log -S '<exact_string_from_code>' -- <file>
git log -G '<regex>' -- <file>
git blame -L <start>,<end> <file>
git show <hash>
git log <old>..<new> -p -- <file>
```

For each substantive commit, pull the PR context:

```bash
git log -1 --format=%B <hash>
gh pr view <number> --json title,body,author,createdAt,mergedAt,labels,closingIssuesReferences,comments,reviews,files
```

Look for nearby rationale signals:

```bash
git log --oneline -- AGENTS.md README.md demo-howto.md .cursor/rules/ledgerly.mdc lib/demo/bugs.ts
rg -n -C2 '(TODO|FIXME|HACK|XXX|NOTE)' <target_file>
rg -l '<symbol>' tests
```

## What good evidence looks like here

- A PR description that explains the problem being solved, not just the change
- A review thread where alternatives were debated
- An inline comment near the target line that explains a non-obvious constraint
- A test whose name or assertion reveals the edge case
- A commit message or branch that references an `AJC-` key

## Common pitfalls

- **Squash-merge flatlands.** If the repo squashes PRs, individual commits in the branch history are lost. Fall back to PR body and comments.
- **Misleading commit messages.** "Small refactor" sometimes hides an intentional behavior change. Look at the diff, not the message.
- **Cargo-culted patterns.** The author may have copied a pattern without understanding why. Check if the pattern originated earlier and investigate *that* commit.
- **Bot commits.** Dependabot and similar usually don't carry motivation.
- **Treating code as evidence of intent.** The code itself isn't evidence for why it exists. Evidence comes from commit messages, PRs, comments, tests, docs.

## What to return

Every commit/PR/comment that bears on the question, with:

- The exact text (quoted)
- The hash / PR number / file:line
- Author and date
- Whether it's direct (explicitly addresses the question) or circumstantial
