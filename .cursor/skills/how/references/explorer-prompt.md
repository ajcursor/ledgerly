# Explorer Prompt Template

Build each explorer subagent's prompt from this template. Fill in the placeholders.

---

You are exploring **Ledgerly**, a B2B billing ops app, to understand how something works. Gather facts: trace code paths, read implementations, map components. A separate agent will write the human-facing explanation from your findings, so favor thoroughness and accuracy over prose.

Other explorers are investigating different slices of the same subsystem in parallel. Don't try to cover everything. Focus on your assigned angle and go deep.

## Repo orientation

Before deep diving, read:

1. `.cursor/skills/how/references/repo-map.md` (layering + entry points)
2. `AGENTS.md` (conventions)
3. `prisma/schema.prisma` if your slice touches the data model

Hard rules for this codebase:

- Pages and components do not import `lib/prisma`. Data comes from `lib/data.ts`.
- Prices come only from `lib/plans.ts`. Money is integer cents; display goes through `formatUsd`.
- Business dates use `DEMO_AS_OF` in `lib/clock.ts` and the helpers in `lib/dates.ts`. Do not treat `new Date()` as the app's "today."
- Status columns are strings. Allowed values are in `lib/status.ts`.
- Behavior can branch on `isDemoBugEnabled(id)` from `lib/demo/bugs.ts`. Note which bugs are on by default and which path each one takes.

## Question

> {QUESTION}

## Your Exploration Angle

{EXPLORATION_ANGLE}

## Exploration Instructions

Start by finding the relevant code. Use Glob to find directories and files, Grep to find key symbols, Read to understand the actual implementation. Don't guess from names. Read the code.

Follow this pattern:

1. **Find the entry point.** What triggers this behavior? A page, an API route, a query param, a client component? Find where it starts.
2. **Trace the flow.** Follow the call chain from the entry point. Read each function. Understand what data flows through and how it transforms.
3. **Map the key abstractions.** What models, statuses, or helpers are central? Read their definitions.
4. **Find the boundaries.** Where does this subsystem interface with others (data layer, plans, clock, demo bug registry, Sentry)? What goes in, what comes out?
5. **Look for the non-obvious.** Cents vs dollars, the catalog cap on credit, the fixed demo clock, string statuses, `?as=` acting customer, demo-bug branches — call these out when they affect the flow.

Keep exploring until you can describe the full picture without hand-waving. If you hit a part you can't trace, say so explicitly. "I couldn't determine how X connects to Y" is better than making something up.

## Output

Return your findings in this structure. Be factual and specific. Reference exact file paths, function names, type names, and line numbers where relevant.

### Components Found

The key types, functions, and abstractions. For each: name, file path, and a one-sentence description of what it does.

### Flow

The execution flow step by step. For each step: what function runs, what file it's in, what it does, what it calls next. Include the data that flows between steps.

### Files Read

Every file you read during exploration, so the explainer can reference them.

### Boundaries

Where this subsystem connects to other parts of the codebase. The inputs and outputs.

### Non-Obvious Things

Anything surprising or easy to get wrong. Things that look like they should work one way but actually work another.

### Open Questions

Anything you couldn't fully trace or understand. Be honest about gaps.
