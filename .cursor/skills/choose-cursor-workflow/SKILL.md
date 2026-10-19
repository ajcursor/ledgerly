---
name: choose-cursor-workflow
description: Walk the 101, 201, or 301 Ledgerly track, then choose the mode, model, rule, or skill that fits the shape of the work. You still review the result.
---

# Walk the 101, 201, or 301 track

The demo ships three jumpable tracks: **101**, **201**, and **301**. Every beat is independent. If the user names a beat, jump directly to it. You still review the result.

## The tracks

101 — You will explore different ways to work in Grok Build, use modes and models for the right tasks, apply rules and skills to ensure consistent quality, and complete at least one task with an agent.

201 — You will curate what belongs in an agent's context, encode conventions as project skills, connect a curated set of MCP servers, and split one task across parallel agents.

301: You will orchestrate work across agents, tasks, and coworkers: break tasks down for multiple agents, take a plan through parallel agents to a reviewable PR, scale review when several streams finish, and share ownership safely.

The beats live in `runbooks/meta.ts` and in `runbooks.html`, which `start-ledgerly` renders in a Cursor Canvas. Open `runbooks.html?track=301` for the 301 track. Optional cards stay hidden until Include optional cards is checked. Use the matching `example` verbatim. Do not invent another catalog price.

The named demo error is `dsp_1043` / the suggested-credit v1 client. Do not mention the invoice or dispute filter-pill `state=` seam unless the user is on that click path.

Start a demo session with `npm run demo:session -- start`. Record every rule, skill, Canvas, Figma deck, Linear board, and demo branch it creates. Reset is script-first and clears every track at once; update the event record and reset script whenever a beat gains a new leftover.

## 101 sections and beats

1. **What is Grok Build?** — Ask, Plan, Build in Agent mode, Debug, check the models, plan to fix the bug.
2. **How do you work with an agent?** — Run Mode allowlist, verify the email feature, redact, stop, interrupt and steer, continue to the end, review diffs, restore from a checkpoint.
3. **How do you govern an agent?** — create a user rule, test the rule, create a user skill, test the skill, Canvas, MCP / Figma.

## 201 sections and beats

1. **How do you manage context?** — rename agents, Ask DDD, check context usage, compare agents, ask across chats.
2. **How do you standardize agent behavior?** — personal create-api skill, promote it.
3. **How do you connect an agent to external tools?** — Linear MCP, MCP allowlist, list open issues from the issue tracker, add `plugins/standard-bug-fix` from the local repository, enable the Standard bug fix plugin (skills, rules, MCP server), standard bug fix on the overdue filter. The operator uses a public or private Linear team. Linear MCP cannot create teams (Settings → Teams → New team; **Make team private** is optional). Then run `stage-linear`. `.cursor/mcp.json` has no project servers and there is no `mcp/` directory. Do not stand up a SQLite MCP.
4. **How do you parallelize a task?** — open a new agent, resolve-dispute plan, ledgerly-reviewer, dispatch-subagents skill, `/multitask`, Canvas subagent progress, ledgerly-reviewer check.

## 301 sections and beats

1. **How do you break down tasks for agents?** Open a local agent, create accessibility-auditor, point the subagent at a faster cost-efficient model, optionally move to a Cloud Agent, `/multitask` the audit, and watch the Working tab.
2. **How do multiple agents go from plan to PR?** Optionally start and stage a Project, list open collections issues, plan and build, use `/side`, consolidate into a PR, and fall back to repo issue descriptions if Linear MCP is unavailable.
3. **How do you scale AI code reviews?** Open the feature branch, run the change reviewer subagent, check high severity issues, optionally run Bugbot, and read the highest-risk slice.
4. **How do coworkers share ownership safely?** Shift review findings into a rule, skill, hook, test, subagent, or a person, optionally create a Reviewer automation, and list files that might conflict.

## Choose the mode

- **Ask** reads and explains; it does not edit. Use it to orient before touching code.
- **Plan** maps an approach before implementation.
- **Agent** is the default; it inspects, edits, and runs checks within the boundary you give it.
- **Debug** verifies a change and investigates failures.

## Choose the model

Use a high-reasoning model to plan and coordinate, and a faster model for narrow, well-scoped edits. On Teams and Enterprise, Auto (Grok Build Router) classifies each request for you. Pin a model when the role is already known.

## What does not change

The human reviews the result and decides what ships. Modes and models change how the work runs, not who is accountable.
