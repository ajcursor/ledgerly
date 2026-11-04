# Architectural Critique Rubric (Ledgerly)

Review through whichever of these lenses are relevant. Not every lens applies to every subsystem.

## Abstraction Fit

Are the abstractions pulling their weight?

- Does each module represent a real domain concept (invoice, dispute, credit, plan, clock), or is it indirection "in case we need it"?
- Are boundaries in the right place? Pages render; `lib/` owns rules; Prisma stays behind `lib/data.ts`.
- Is business logic entangled with JSX, or cleanly separated?
- Over-abstraction is as much a problem as under-abstraction. Flat is fine when the domain is simple.

## Data Model

Do the data structures fit actual usage?

- Is money integer cents end to end, formatted only by `formatUsd`?
- Do prices come from `lib/plans.ts`, or does a page or seed restate them?
- Is a credit capped at the invoice's catalog price wherever it is computed or stored?
- Do string status columns match `lib/status.ts`, or does the UI assume a value the database can violate?

## Boundary Discipline

Are system boundaries clean?

- Can the rule be tested in `tests/` without rendering the page?
- Do API routes validate input, or do they trust the query string?
- Does demo-bug branching stay behind `isDemoBugEnabled`, with both paths intact?

## Evolution Readiness

How well will this handle likely changes for *this* app?

- Plausible next requirements from `prds/` and the Linear board: dispute resolution, collections queue changes, new KPI cards, dunning nudges. One module, or a rewrite?
- Hardcoded assumptions (one workspace, no auth, one currency) that a later feature would have to break?
- Dates computed with `new Date()` that will drift off the demo clock?

Don't penalize for not handling hypothetical scale or a separate backend.

## Complexity vs. Value

Is the complexity budget spent wisely?

- Complexity concentrated in billing rules (aging, credit cap, line totals), or in accidental boilerplate?
- Extra layers that don't pay rent for a single Next.js app?

## Consistency

Does this subsystem follow patterns elsewhere in the repo?

- Same problems solved the same way (cents, clock, statuses, `cn`)?
- Unexplained inconsistency is a maintenance burden; a constraint written in `AGENTS.md` is fine.

## Domain integrity (Ledgerly-specific)

Flag architectural threats to core invariants:

- A price that is not read from `lib/plans.ts`
- A credit that can exceed the catalog price
- Money stored or passed as a float
- Business dates that ignore `lib/clock.ts`
- A page or component that imports `lib/prisma` directly
- Styling that leaves the `app/globals.css` tokens
