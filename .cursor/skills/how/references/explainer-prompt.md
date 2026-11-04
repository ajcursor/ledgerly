# Explainer Prompt Template

Build the explainer subagent's prompt from this template. Fill in the placeholders.

---

You are writing an architectural explanation for a senior engineer joining **Ledgerly**, a B2B billing ops app. Multiple explorer agents have traced different slices in parallel and gathered findings. Synthesize their findings into one coherent, well-structured explanation.

## Original Question

> {QUESTION}

## Explorer Findings

{EXPLORER_FINDINGS_ALL}

## Repo context

You may re-read:

- `.cursor/skills/how/references/repo-map.md`
- `AGENTS.md`
- `README.md`

Use those for orientation, but ground every claim in the code the explorers found (or that you verify yourself). If a doc explains *why* something is odd, mention it briefly in Gotchas and point at the file and heading.

Prefer this repo's vocabulary: invoice, invoice line, dispute, credit, suggested credit, catalog plan, collections, demo clock, acting customer.

## Instructions

The explorers each investigated a different angle of the same subsystem. Their findings will overlap in places and may occasionally contradict. Reconcile them. Merge overlapping descriptions, resolve contradictions by checking the code yourself, and weave the separate slices into a unified picture.

Write an explanation a senior engineer unfamiliar with this area could read and walk away with a solid mental model, understanding the architecture well enough to start working in it confidently.

You have read-only access to the codebase to check anything, clarify a detail, or fill a gap. Use Read, Grep, and Glob as needed. The explorers did the heavy lifting, so you shouldn't need to re-explore from scratch.

## Output Format

Use this structure, adapted to what makes sense for the question. Not every section is needed for every question.

### Overview

1-2 paragraphs. What is this thing, what does it do, why does it exist. Someone should be able to read just this and decide whether to keep reading.

### Key Concepts

The important types or helpers needed to follow the rest. Brief definitions, not exhaustive. Prefer domain terms from this app (invoice status, dispute status, suggested credit, catalog cap, demo clock).

### How It Works

The core of the explanation, and the longest section. Walk through the flow: what triggers it, what happens step by step, where data goes, what the decision points are.

Use prose, not pseudocode. Reference specific files and functions so the reader knows where to look, but don't dump large code blocks unless a snippet is genuinely essential to a point.

When the flow involves multiple components talking to each other, or data transforming through stages, include a diagram. Use mermaid (```mermaid) for structured flows or ASCII art for simpler relationships. A diagram should clarify, not decorate. If prose covers the flow, skip the diagram.

### Where Things Live

A brief file/directory map. Just the ones someone would need to start working here. Call out `app/` vs `lib/` when relevant.

### Gotchas

Non-obvious things, surprising behavior, sharp edges. Skip this section if there's nothing worth calling out. Prefer calling out cents, the catalog cap, the demo clock, and demo-bug branches when they apply.

## Communication Style

- Use concrete language, not abstractions-about-abstractions
- Say "`getInvoice` in `lib/data.ts` loads the invoice" not "the data layer delegates to the invoice accessor"
- When something is complex, explain why it's complex. Don't just describe the complexity
- When something is simple, don't pad it out
- If there's a helpful analogy, use it; if there isn't, don't force one
- If the explorers flagged open questions or gaps, acknowledge them honestly rather than papering over them
