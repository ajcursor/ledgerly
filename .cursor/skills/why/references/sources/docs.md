# Long-form docs (in-repo)

## What this source contains

- `AGENTS.md` — working conventions, product constraints, the red tests, planted demo issues, and the dispute resolution stub. Often the strongest Direct evidence for intentional shape (cents, catalog prices, demo clock, where data access lives).
- `.cursor/rules/ledgerly.mdc` — catalog, seed names, and the seams the demo depends on.
- `README.md` — setup, port, demo bugs and how to select them, Viewing as addresses.
- `demo-howto.md` and `runbooks/meta.ts` — presenter run-of-show and beats. Strong evidence for *why a behavior exists*. Cite them in chat. Do not carry their demo framing into Linear, Slack, or PR text.
- `prds/` — product requirements, such as the Collections Command Center PRD.
- `.cursor/plans/` — slice plans, such as dispute resolution and the keyboard walkthrough audit.
- `lib/demo/bugs.ts` — each demo bug's `description`, `linearTitle`, and `redTests`.

There is no `docs/decisions.md` and no `docs/architecture.md`. Do not search for them and then treat the miss as a mystery; record that they are not part of this repo.

No MCP required. Prefer these over guessing from code shape.

## How to search it

1. Skim `AGENTS.md` and `.cursor/rules/ledgerly.mdc` for a constraint that names the behavior.
2. If the question is about a known defect, read its entry in `lib/demo/bugs.ts` and the matching section of `demo-howto.md`, and quote them.
3. If the question is about a feature, read the matching PRD or plan.
4. Grep:

   ```bash
   rg -n -i 'decision|we chose|intentional|on purpose|trade.?off|rejected|must not|do not' AGENTS.md README.md demo-howto.md prds/ .cursor/rules/ .cursor/plans/
   ```

5. Quote headings exactly so the synthesizer can cite them.

## What good evidence looks like here

- An `AGENTS.md` or rule sentence that states the constraint and the reason
- A registry entry or `demo-howto.md` beat that names the file, the repro, and the expected fix
- Divergence between a doc and the code — surface as contradiction

## Common pitfalls

- **Treating a plan as current code.** Prefer the code for "what"; the docs for "why."
- **Paraphrasing.** Quote the doc; don't rewrite it into a cleaner story.
- **Skipping this pass.** Local docs are mandatory for this category.
- **Exporting presenter framing.** `demo-howto.md` may call a bug planted. That sentence is evidence in chat. It is not wording for a new Linear comment or Slack post.

## What to return

For each relevant section:

- Path and heading
- Verbatim motivation quote
- Whether it matches or contradicts the shipped code (observation only — synthesizer weighs it)
