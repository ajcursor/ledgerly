---
name: how
description: "Use for \"how does X work\" in Ledgerly — the dashboard KPIs, invoice list and detail, invoice line totals, disputes and suggested credit, collections, the demo clock, acting as a customer, the demo bug registry, or page-to-lib flow. Code walkthroughs before changing something; placement / ownership (\"where should this live\", \"pages vs lib\"). Explains architecture and runtime flow; can critique. Prefer this over a generic how skill when working in this repo. Use why for motivation."
---

# How (Ledgerly)

Explore this repo to answer "how does X work?" Produce clear architectural explanations at the level of a senior engineer onboarding onto a subsystem. Enough to build a working mental model, not annotated source code.

Prefer this project skill over a generic `/how` skill while working here. Repo map and layering live in [references/repo-map.md](references/repo-map.md). Skim `AGENTS.md` and `README.md` when relevant. There is no `docs/architecture.md` or `docs/decisions.md`.

## Models

Do **not** pin exact Task `model` slugs. Dead pins fail the Task allow-list.

Default: omit `model` or pass `inherit` (parent model). If you pick a family, use the latest listed slug of that family — not an older version.

| Role | `model` |
| --- | --- |
| Explorer | `inherit` |
| Explainer (direct + synthesize) | `inherit` |
| Critics | `inherit` (spawn several; latest of family is fine for diversity) |

Two modes:

1. **Explain** (default). Explore the codebase and produce a clear explanation
2. **Critique.** Explain first, then spawn multiple models to independently identify architectural issues

## Explain Mode

### Step 1. Understand the Question and Assess Complexity

Parse what the user is asking about. Typical shapes in this repo:

- "How does the dashboard count overdue invoices?", `app/page.tsx` → `getDashboard` → `lib/dashboard.ts`
- "How does the suggested credit get chosen?", `lib/disputes/suggested-credit-api.ts` → v1 or v2 route → `lib/dispute-credit.ts`
- "How are invoice line totals rounded?", `lib/invoice-lines.ts` + the invoice detail page
- "How does acting as a customer work?", `?as=` → `lib/acting-customer.ts` → `lib/demo/viewing-as.ts`
- "Where should new business logic live?", `lib/`, not pages

Identify the scope. If ambiguous, state your best-guess interpretation before exploring. Don't ask. Let the user redirect if you're off.

**Assess complexity to decide the approach:**

- **Simple** (one module, one page, a narrow "how does function X work"): skip explorer agents; the explainer explores and explains in a single pass. Go to Step 2b.
- **Complex** (data layer + API route + a page, full architectural overview): spawn parallel explorer agents first, then hand off to the explainer. Go to Step 2a.

When in doubt, lean simple. You can always spawn explorers if the explainer hits a wall.

### Step 2a. Explore (complex questions only)

Decompose the question into 2–4 parallel exploration angles, each a distinct slice so explorers don't duplicate work. Example splits for this repo:

**"How does a dispute page show its suggested credit?"**

- Explorer 1: `app/disputes/[id]/page.tsx` and `components/disputes/` render
- Explorer 2: `lib/disputes/suggested-credit-api.ts`, the v1 and v2 routes, and the `credit_v1` branch
- Explorer 3: `lib/dispute-credit.ts` catalog cap and the seeded dispute data

**"How does the dashboard build its KPIs?"**

- Explorer 1: `getDashboard` in `lib/data.ts`
- Explorer 2: `lib/dashboard.ts` windows, aging, and percent change against `lib/clock.ts`
- Explorer 3: `app/page.tsx` and `components/kpi-card.tsx`

The right decomposition depends on the question. Narrow questions: 2 explorers is fine. Broad subsystems: up to 4.

Spawn all explorers in a single message:

- `subagent_type`: `generalPurpose`
- `model`: `inherit`
- `readonly`: `true`

Each explorer gets the same base prompt from [references/explorer-prompt.md](references/explorer-prompt.md) plus a specific exploration angle naming its slice. Each explorer should:

- Read [references/repo-map.md](references/repo-map.md) first, then `AGENTS.md` if needed
- Start broad: Glob / Grep for routes, lib modules, components
- Follow the thread: `page → lib/data.ts → lib/prisma.ts` (pages do not import Prisma)
- Read the actual code; don't guess from file names
- Stop when it can describe the full path from input to output without hand-waving
- Note cents vs display, the catalog cap, the demo clock, and demo-bug branches

Each explorer returns structured findings: components found, flow traced, files read, anything non-obvious. Overlap is fine; the explainer reconciles.

Then proceed to Step 3.

### Step 2b. Direct Explain (simple questions)

Spawn a single Task subagent that explores and explains in one pass:

- `subagent_type`: `generalPurpose`
- `model`: `inherit`
- `readonly`: `true`

The agent does its own exploration (Glob, Grep, Read) and writes the explanation directly. Read [references/explainer-prompt.md](references/explainer-prompt.md) for style and format. Point it at [references/repo-map.md](references/repo-map.md). Same structure, no explorer findings as input.

Proceed to Step 4.

### Step 3. Synthesize (complex questions only)

Once all explorers return, spawn a single Task subagent to synthesize:

- `subagent_type`: `generalPurpose`
- `model`: `inherit`
- `readonly`: `true`

The explainer gets all explorers' findings and writes the human-facing explanation. Read [references/explainer-prompt.md](references/explainer-prompt.md). Reconcile overlaps, resolve contradictions against the code, weave slices into one picture.

### Step 4. Present

Present the explainer's output to the user. You may lightly edit for clarity or add conversation context, but don't substantially rewrite. The explainer's communication is the product.

### Output Format

Follow this structure, adapted to the question. Not every section is needed every time.

**Overview.** 1–2 paragraphs. What it is, what it does, why it exists.

**Key Concepts.** Important types and modules (invoice, dispute, suggested credit, catalog plan, demo clock).

**How It Works.** Core flow in prose; cite files/functions; mermaid only when it clarifies.

**Where Things Live.** Short map of the files someone needs to start editing.

**Gotchas.** Cents, the catalog cap, demo clock, string statuses, demo-bug branches, red tests.

## Critique Mode

Triggered when the user asks for architectural issues, problems, or improvements — not just understanding.

### Step 1. Explain First

Run the full explain flow above (Steps 1–4). Understand before critiquing.

### Step 2. Spawn Critics

After the explanation is complete, spawn several architectural critics in a single message (`inherit`, or latest listed slugs of different families if you want diversity).

For each critic:

- `subagent_type`: `generalPurpose`
- `model`: `inherit` (or latest listed slug of a family)
- `readonly`: `true`

Read [references/critic-prompt.md](references/critic-prompt.md). Each critic gets:

1. The explanation from Step 1
2. The relevant file paths
3. The rubric from [references/critique-rubric.md](references/critique-rubric.md)

Critics must not treat constraints in `AGENTS.md` or `.cursor/rules/ledgerly.mdc` as defects without arguing the constraint itself is wrong. The red tests and the demo bug registry are demo state, and the dispute resolution stub is incomplete on purpose; do not file those as architectural defects.

### Step 3. Lead Judgment

You're a pragmatic lead, not an aggregator. Categorize findings:

- **Act on.** Architectural problems worth fixing now
- **Consider.** Real concerns; cost/benefit unclear
- **Noted.** Valid, low priority
- **Dismissed.** Wrong, missing context, or style preference

Present the explanation first, then the critique verdict. The explanation should stand alone for readers who only want to understand the system.

## Additional resources

- [references/repo-map.md](references/repo-map.md) — stack, layering, entry points by question type
- [references/explorer-prompt.md](references/explorer-prompt.md)
- [references/explainer-prompt.md](references/explainer-prompt.md)
- [references/critic-prompt.md](references/critic-prompt.md)
- [references/critique-rubric.md](references/critique-rubric.md)
- `AGENTS.md`, `README.md`, `.cursor/rules/ledgerly.mdc`
