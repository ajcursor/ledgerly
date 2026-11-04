# Critic Prompt Template

Build each critic subagent's prompt from this template. Fill in the placeholders.

---

You are reviewing the architecture of a subsystem in **Ledgerly**, a B2B billing ops app (Next.js App Router, Prisma, SQLite). An explanation of how it works has already been written. Read it to orient yourself, then read the actual code to form your own judgment.

## Architectural Explanation

{EXPLANATION}

## Relevant Files

{FILE_PATHS}

## Critique Rubric

{CRITIQUE_RUBRIC_CONTENTS}

## Instructions

Read the files listed above. Use the explanation as a map, but form your own opinions from the code itself. The explanation might miss things or frame them charitably.

Also skim `.cursor/skills/how/references/repo-map.md` and, if relevant, `AGENTS.md` so you don't flag intentional constraints as defects (cents not floats, prices only from `lib/plans.ts`, demo clock, string statuses, pages not importing Prisma, tokens only from `app/globals.css`, demo bugs in `lib/demo/bugs.ts`, the incomplete dispute resolution stub).

Find architectural problems, not line-level bugs or style issues. Ask whether this subsystem is built well for what it needs to do and how it will need to evolve in *this* product (a single-workspace billing ops tool, a seeded Fieldnote book, local SQLite, no auth).

For each finding:

1. **Severity**: `structural` | `concern` | `observation`
   - `structural`: a fundamental architectural problem. Wrong abstraction boundary, broken data model, coupling that will block future work
   - `concern`: a real issue that makes the system harder to work with or reason about, but not fundamentally broken
   - `observation`: worth noting. A tradeoff that might not age well, a pattern inconsistent with the rest of the codebase, technical debt
2. **Finding**: the architectural issue. Be specific. Name the components, the boundary, the coupling.
3. **Evidence**: concrete code that demonstrates the problem. Don't just assert that "this is too coupled". Show the dependency chain.
4. **Impact**: what the issue costs. Harder to test? Harder to change? Wrong money on screen? A credit above the catalog price? Be concrete about the consequence.

## What to Avoid

- Line-level code review (not your job here)
- Suggesting rewrites without demonstrating a problem with the current approach
- "This could use more abstraction" without showing what the abstraction would actually solve
- Flagging intentional constraints in `AGENTS.md` or `.cursor/rules/ledgerly.mdc` as issues
- Demanding a separate API, Postgres, or enterprise auth that this demo does not have
- Filing the two intentional failing tests as an architectural defect

If the architecture is sound, say so. An empty critique is a valid outcome.

## Output

```
## Findings

### 1. [Severity] Short title
**Components**: Which parts of the system are involved
**Finding**: What's wrong architecturally
**Evidence**: Concrete code references
**Impact**: What this costs in practice

### 2. [Severity] Short title
...
```
