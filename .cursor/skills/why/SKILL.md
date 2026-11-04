---
name: why
description: "Use for \"why does X work this way\", design rationale, rejected alternatives, regressions, or constraint archaeology in Ledgerly — the catalog cap on credit, v1 vs v2 suggested credit, integer cents, the demo clock, overdue aging, invoice line rounding, the demo bug registry, red tests. Searches git/gh, the Brightdesk / Ledgerly Linear project, local docs, Slack, and Sentry in parallel. Prefer this over a generic why skill when working in this repo. Companion to how (mechanics vs motivation)."
---

# Why (Ledgerly)

Investigate the motivation and intent behind code in this repo. Why was it built this way? What edge cases, product constraints, or demo requirements shaped it? What alternatives were rejected?

Prefer this project skill over a generic `/why` skill while working here. Companion to [how](../how/SKILL.md): `how` answers what the code does; `why` answers what forces led to its shape.

Repo map for anchoring: [../how/references/repo-map.md](../how/references/repo-map.md). There is no `docs/decisions.md`. The written record is `AGENTS.md`, `README.md`, `.cursor/rules/ledgerly.mdc`, `demo-howto.md`, `prds/`, and `.cursor/plans/`.

## Models

Do **not** pin exact Task `model` slugs. Dead pins fail the Task allow-list.

Default: omit `model` or pass `inherit` (parent model). If you pick a family, use the latest listed slug of that family — not an older version.

| Role | `model` |
| --- | --- |
| Investigator | `inherit` |
| Synthesizer | `inherit` |

## How this skill works

Historical context for this app spreads across: git/gh (`ajcursor/ledgerly`), the Linear project **Brightdesk / Ledgerly** (team AJCursor, key `AJC`), in-repo docs, Slack, and Sentry. Enumerate available MCPs at run time, map them to the coverage table below, query every **available** category in parallel, then synthesize with explicit confidence calibration. Null results are first-class evidence — report them. The default is coverage, not minimalism.

This is a local demo app. Meeting notes (Granola), Confluence, infrastructure observability, and product-analytics warehouses are **not relevant / unavailable** — skip those with an explicit written justification in Sources Consulted, not silently.

## Operating Posture

Operate as a careful, cautious, precise investigator. Think like a detective piecing together a historical case from fragmentary records. When the record is thin, say so.

- **Evidence before narrative.** Collect first, then see what story the pieces support.
- **Precision over polish.** Prefer the exact quote and citation over a smooth paraphrase.
- **Name the gaps.** If a thread goes cold or a source isn't searchable, document it.
- **Hedge on purpose.** Indirect evidence → "appears to" / "likely" / "suggests".
- **No shortcut by code-reading.** Code tells you what it does, rarely why. Resist inferring intent from code shape. Exception: `AGENTS.md`, `README.md`, `.cursor/rules/ledgerly.mdc`, and `demo-howto.md` text that explicitly states rationale *is* evidence — cite it as docs, not as "the code". The `description` and `linearTitle` fields in `lib/demo/bugs.ts` count as docs too.

Read [references/epistemics.md](references/epistemics.md) for the confidence framework. The synthesizer must follow it.

Chat answers may cite `demo-howto.md` and the demo bug registry. Linear comments, PR descriptions, and Slack posts must not say a defect was planted, is a demo, or is intentional seed state. State the behavior and the evidence.

## Step 1. Understand the Target and the Question

Parse the **target** (code, pattern, feature, named constraint) and the **question** shape:

- Design rationale — "Why was X designed this way?"
- Tradeoff — "Why X instead of Y?"
- Edge cases — "What motivated this guard?"
- External constraint — "What product constraint led to this?"
- Dead code / persistence — "Why does this still exist?"
- Broad history — "What's the history of X?"

Typical Ledgerly targets: the catalog cap in `lib/dispute-credit.ts`, why both v1 and v2 suggested-credit routes exist, the `dsp_1043` $400 claim, integer cents, the fixed demo clock, overdue aging basis, line rounding in `lib/invoice-lines.ts`, demo bug defaults, the dispute resolution stub, two tests left failing.

If vague, state your best-guess interpretation from conversation context, then proceed.

## Step 2. Establish the Code Anchor

Before spawning investigators, anchor in concrete code:

- File path(s) and line range(s)
- Key symbols
- Last few commits touching the target
- PR numbers from merge commits (`(#1234)` pattern)
- Linked Linear keys if present in commits, branches, or PRs (`AJC-`)
- The demo bug id, if the target branches on `isDemoBugEnabled`

```bash
git blame -L <start>,<end> <file>
git log --follow -p -- <file>
git log --oneline -20 -- <file>
git log -1 --format=%B <commit>
```

Pull PR bodies via `gh` when substantive:

```bash
gh pr view <number> --repo ajcursor/ledgerly --json title,body,author,createdAt,mergedAt,labels,closingIssuesReferences,comments,reviews
```

Also skim `AGENTS.md`, `.cursor/rules/ledgerly.mdc`, and `demo-howto.md` for a matching section — if one exists, pass its heading to every investigator as a seed lead.

Pass the code anchor (paths, symbols, commits, PRs, issue keys, bug ids, doc hits) to investigators so they don't rediscover it.

## Step 3. Spawn Parallel Investigators

**Default to full parallel coverage of every available category.**

### Coverage map for this repo

| Category | MCP / tool | Playbook | Usually |
| --- | --- | --- | --- |
| Source control history | git + `gh` | [sources/code-archaeology.md](references/sources/code-archaeology.md) | Always spawn |
| Issue / ticket tracker | Linear (Brightdesk / Ledgerly) | [sources/linear.md](references/sources/linear.md) | Spawn when Linear MCP available |
| Long-form documents | Local docs | [sources/docs.md](references/sources/docs.md) | Always spawn (no MCP) |
| Real-time team chat | Slack | [sources/slack.md](references/sources/slack.md) | Spawn when Slack MCP available |
| Error / exception tracking | Sentry | [sources/sentry.md](references/sources/sentry.md) | Spawn when Sentry MCP available |
| Meeting notes | — | — | Skip: not relevant for this repo |
| Infrastructure observability | — | — | Skip: no Datadog/etc for this demo |
| Product analytics warehouse | — | — | Skip: no warehouse for this demo |

If an unexpected MCP appears that fits a skipped category, spawn it and use the generic playbook pattern. Record the coverage map including skips.

### Subagent config

Each investigator:

- `subagent_type`: `generalPurpose`
- `model`: `inherit`
- `readonly`: `false` (agent mode — readonly strips MCP access). Investigators still must not write files or mutate external state.

Each gets:

1. Base prompt from [references/investigator-prompt.md](references/investigator-prompt.md)
2. The single category playbook from the table above
3. [references/sources/incident-postmortem.md](references/sources/incident-postmortem.md) **if** the target looks defensive (catalog cap, credit guards, aging basis, rounding, validation that blocks a page or route)
4. The code anchor from Step 2
5. The user's original question

Launch all matching investigators in one message. One investigator per category.

### When to skip

Only with an **explicit written justification** in Sources Consulted:

- No MCP for that category (flag as gap)
- Provably irrelevant (high bar — e.g. a token-only CSS change → skip error tracking)

"Probably not in Slack" is not a skip reason. Run the search; let null results speak.

If a single-commit trivial target already has the complete answer in `AGENTS.md` or `demo-howto.md` *and* the PR body, you may answer inline **only after** stating that the remaining available category searches would be redundant. Rare.

## Step 4. Synthesize

Spawn one synthesizer:

- `subagent_type`: `generalPurpose`
- `model`: `inherit`
- `readonly`: `false` (needs MCP for citation spot-checks)

Give it: investigator findings (including nulls and skips), code anchor, user question, [references/epistemics.md](references/epistemics.md), and [references/synthesizer-prompt.md](references/synthesizer-prompt.md).

## Step 5. Present

Present the synthesizer's output. Light edits for clarity are fine; **do not rewrite confidence language**. Dropping hedges is the failure mode this skill prevents.

If the `why` is a precursor to changing the code, append a short **Preserve / Change / Avoid / Risk** constraint set from the lineage findings.

## Output Format

Keep the confidence separation intact:

**The Question** · **The Code in Question** · **What We Found (direct evidence)** · **What We Can Reasonably Infer** · **Competing Hypotheses** (if needed) · **What We Don't Know** · **Sources Consulted**

Sources Consulted: one line per category, including empties and skips. Format:

`- <Source>: <what was searched>. <what was found | "no relevant results" | "skipped. reason">.`

## Common Failure Modes

- Confident storytelling from thin evidence
- Citing code as evidence for its own intent (doc text is a doc cite, not this)
- Recency bias — current shape is often accretion; trace back
- Sycophantic agreement with the user's embedded hypothesis
- Skipping the gaps section
- Skipping investigators by anticipation
- Collapsing multiple MCPs into one investigator
- Quoting presenter-note language into Linear, Slack, or a PR

## Additional resources

- [references/epistemics.md](references/epistemics.md)
- [references/investigator-prompt.md](references/investigator-prompt.md)
- [references/synthesizer-prompt.md](references/synthesizer-prompt.md)
- [references/source-playbook.md](references/source-playbook.md)
- [references/sources/](references/sources/) — per-category playbooks
- `AGENTS.md`, `README.md`, `.cursor/rules/ledgerly.mdc`, `demo-howto.md`
- [../how/references/repo-map.md](../how/references/repo-map.md)
