import type { DemoSection } from "@/runbooks/types";

export const RUNBOOK_SECTIONS_201 = [
  {
    id: "target-context",
    title: "How do you manage context?",
    beats: [
      {
        id: "rename-agent-1-all",
        title: "Rename Agent 1 All",
        promptType: "reusable",
        detail: "Open one agent and ask it for information about the entire codebase.",
        example: "/rename-chat Agent 1 All",
      },
      {
        id: "ask-ddd-all",
        title: "Ask DDD of the application",
        promptType: "reusable",
        detail: "",
        example: "/ask what is the domain driven design of the application.",
      },
      {
        id: "rename-agent-2-target",
        title: "Rename Agent 2 Target",
        promptType: "reusable",
        detail: "Open a second agent for a new targeted context window.",
        example: "/rename-chat Agent 2 Target",
      },
      {
        id: "ask-ddd-invoice-table",
        title: "Ask DDD of the invoice table",
        promptType: "reusable",
        detail: "",
        example: "/ask what is the domain driven design of the @invoice-table.tsx",
      },
      {
        id: "context-usage",
        title: "Check context usage",
        promptType: "none",
        detail:
          "Go to Agent 1 All chat. Click the Context Usage indicator below the chat. Go to Agent 2 Target. Click the Context Usage indicator below the chat.",
      },
      {
        id: "compare-agents",
        title: "Compare agents",
        promptType: "none",
        detail:
          "Agent 1 maps all the domains in the whole codebase. Its context window shows X%. Agent 2 maps half of the domains based on the targeted context. Its context window shows Y%. The difference in context window may not be significant but can affect larger repositories.",
      },
      {
        id: "ask-cross-context",
        title: "Ask across agents",
        promptType: "reusable",
        detail:
          "Agent 1 mapped all domains; Agent 2 can reuse that summary. Go to Agent 2 Target chat.",
        example: "/ask @Agent 1 All Does refactoring the table change anything across all contexts?",
      },
    ],
  },
  {
    id: "standardize-behavior",
    title: "How do you standardize agent behavior?",
    beats: [
      {
        id: "create-api-personal-skill",
        title: "Create personal create-api skill",
        promptType: "reusable",
        detail:
          "Open a new agent. It scans the entire repository for the pattern. Create a personal skill for how to create a new API. Open skill in ~/.cursor/skills.",
        example:
          "/create-skill for how to create a new API. Follow the standards in this repo. This is a personal skill named create-api.",
      },
      {
        id: "promote-create-api-project",
        title: "Promote create-api to project",
        promptType: "reusable",
        detail:
          "Promote the create-api skill so teammates can use it. Open skill in .cursor/skills. Review the other project skills for this repository, such as add-dashboard-widget, draft-collection-email, or write-prisma-query.",
        example: "Promote the create-api skill to this project.",
      },
    ],
  },
  {
    id: "parallelize-task",
    title: "How do you parallelize a task?",
    beats: [
      {
        id: "open-new-agent",
        title: "Open a new agent",
        promptType: "none",
        detail: "Open a new agent.",
      },
      {
        id: "open-resolve-dispute-plan",
        title: "Open resolve-dispute plan",
        promptType: "none",
        detail:
          "Open .cursor/plans/resolve-dispute.md. Review the plan and how it splits data, API, and UI tasks.",
      },
      {
        id: "open-ledgerly-reviewer",
        title: "Open ledgerly-reviewer",
        promptType: "none",
        detail: "Open .cursor/agents/ledgerly-reviewer.md",
      },
      {
        id: "open-dispatch-subagents-skill",
        title: "Open dispatch-subagents skill",
        promptType: "none",
        detail: "Open .cursor/skills/dispatch-subagents/SKILL.md.",
      },
      {
        id: "multitask-resolve-dispute",
        title: "Multitask resolve-dispute",
        promptType: "reusable",
        detail: "Build the feature using the /multitask command.",
        example: "/multitask @resolve-dispute.md",
      },
      {
        id: "canvas-subagent-progress",
        title: "Canvas subagent progress",
        promptType: "adaptable",
        detail:
          "Use Canvas to keep track of the progress of subagents and their tasks. Review Canvas with subagent progress and worktree conflicts.",
        example:
          "Update Canvas with subagent progress and models used. Make a list of worktree conflicts as you encounter them.",
      },
      {
        id: "ledgerly-reviewer-check",
        title: "ledgerly-reviewer check",
        promptType: "adaptable",
        detail: "Use the specialized reviewer subagent to check the completed task.",
        example: "ledgerly-reviewer check my work",
      },
    ],
  },
] as const satisfies readonly DemoSection[];
