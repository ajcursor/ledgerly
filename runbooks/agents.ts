export const PROJECT_AGENTS = [
  {
    name: "ledgerly-reviewer",
    path: ".cursor/agents/ledgerly-reviewer.md",
    when: "After any code change. Read-only check that the work exists and runs, then catalog prices, seed names, and protected paths.",
  },
  {
    name: "api-instrumenter",
    path: ".cursor/agents/api-instrumenter.md",
    when: "/multitask worker. Add the request-log helper to one named API route and nothing else.",
  },
  {
    name: "dispute-verifier",
    path: ".cursor/agents/dispute-verifier.md",
    when: "/goal and /orchestrate finish line. Report pass/fail evidence; write no product code.",
  },
  {
    name: "change-reviewer",
    path: ".cursor/agents/change-reviewer.md",
    when: "Read-only review of a diff. Flags sensitive data, hard rollback, missing tests, edited failing tests, scope outside the plan, and new dependencies or shell commands.",
  },
] as const;

export const PROJECT_SKILLS = [
  {
    name: "choose-cursor-workflow",
    path: ".cursor/skills/choose-cursor-workflow/SKILL.md",
    when: "Walk the 101 or 201 track, then choose the mode, model, rule, or skill from the shape of the work.",
  },
  {
    name: "stage-linear",
    path: ".cursor/skills/stage-linear/SKILL.md",
    when: "Reconcile Fieldnote issues on the ce-field-demos Linear project.",
  },
  {
    name: "standard-bug-fix",
    path: ".cursor/skills/standard-bug-fix/SKILL.md",
    when: "/standard-bug-fix on one ce-field-demos Linear issue.",
  },
  {
    name: "dispatch-subagents",
    path: ".cursor/skills/dispatch-subagents/SKILL.md",
    when: "Many independent pieces. Launch Task subagents in one parallel turn.",
  },
  {
    name: "hand-to-cloud-agent",
    path: ".cursor/skills/hand-to-cloud-agent/SKILL.md",
    when: "Cloud /goal, /autopilot PR supervision, or an /orchestrate planner tree.",
  },
  {
    name: "autopilot",
    path: "~/.cursor/skills-cursor/autopilot/SKILL.md",
    when: "Built-in skill for Grok Build's former /babysit PR workflow.",
  },
  {
    name: "automate",
    path: "~/.cursor/skills-cursor/automate/SKILL.md",
    when: "Open the Grok Build Automations editor with a reviewed event- or schedule-driven draft.",
  },
] as const;
