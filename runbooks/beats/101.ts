import type { DemoSection } from "@/runbooks/types";

export const RUNBOOK_SECTIONS_101 = [
  {
    id: "first-prompt",
    title: "What is Grok Build?",
    beats: [
      {
        id: "ask",
        title: "Ask",
        promptType: "reusable",
        detail: "Let’s learn more about the application with Ask mode.",
        example: "/ask Tell me what this application does in 3 sentences",
      },
      {
        id: "plan",
        title: "Plan",
        promptType: "adaptable",
        detail: "Map your approach to building a new feature in Plan mode.",
        example:
          "/plan I want a new feature to update the customer email in the invoice detail customer card. Don’t implement email validation.",
      },
      {
        id: "agent-build",
        title: "Build in Agent mode",
        promptType: "none",
        detail: "Build the feature in Agent mode. Build the plan locally. Check the feature in the UI.",
      },
      {
        id: "debug",
        title: "Debug",
        promptType: "reusable",
        detail:
          "Investigate the failing test using Debug mode. Debug mode is useful because the agent investigates the codebase and presents some hypothesis on the root cause. I can choose to reproduce the bug and attempt to fix based on the agent’s hypotheses.",
        example: "/debug the failing test",
      },
      {
        id: "model-fast",
        title: "Check the models",
        promptType: "none",
        detail:
          "Check the models available for use. Select Auto in the chat and review the models available for use.",
      },
      {
        id: "fix",
        title: "Plan to fix the bug",
        promptType: "adaptable",
        detail: "Use shift-tab to toggle to Agent mode.",
        example: "Fix the failing test.",
      },
    ],
  },
  {
    id: "work-with-agent",
    title: "How do you work with an agent?",
    beats: [
      {
        id: "allowlist",
        title: "Run Mode Allowlist",
        promptType: "none",
        detail:
          "Let’s change how our agent asks for approvals by configuring an allowlist - a known set of commands that Grok Build can run without asking for review. Go to Settings > Agents > Executions & Approvals > Run Mode > Allowlist.",
      },
      {
        id: "verify-email",
        title: "Verify the email feature",
        promptType: "none",
        detail:
          "Go to http://localhost:43173/invoices/inv_1048. Find the edit email feature you implemented in the Customer box.",
      },
      {
        id: "start-and-stop",
        title: "Redact (partial)",
        promptType: "adaptable",
        detail: "",
        example:
          "Redact the customer email in the UI. The first two characters and domain are plaintext. When I click to type in the box, clear it and save the new email.",
      },
      {
        id: "stop",
        title: "Stop the prompt",
        promptType: "none",
        detail: "Stop the prompt with the Stop button in the chat.",
      },
      {
        id: "interrupt-steer",
        title: "Interrupt and steer",
        promptType: "adaptable",
        detail:
          "Steer the prompt. Show how the agent pauses for your approval. Continue running after reviewing the first file.",
        example:
          "Redact the customer email in the UI. Show it in plaintext when I click the box to edit it. Stop every time you change a file for me to review.",
      },
      {
        id: "continue-no-approval",
        title: "Continue to the end",
        promptType: "adaptable",
        detail: "",
        example: "Continue to the end, do not wait for my approval.",
      },
      {
        id: "diffs",
        title: "Review diffs",
        promptType: "none",
        detail: "Select Changes in the right hand panel. Show diffs from agent’s last turn.",
      },
      {
        id: "checkpoint-restore",
        title: "Restore from a checkpoint",
        promptType: "none",
        detail:
          "If I want to revert the code, I can restore from a checkpoint. Scroll back to a prompt before updating the feature. Select the restore icon next to the prompt.",
      },
    ],
  },
  {
    id: "govern-agent",
    title: "How do you govern an agent?",
    beats: [
      {
        id: "rule",
        title: "Create a user rule",
        promptType: "adaptable",
        detail:
          "Let’s create a user rule so the agent doesn’t try to improve the invoice UI without our approval. Use /create-rule, a built-in skill, to create a rule. Go to Customize > Rules > User to view the rule.",
        example:
          "/create-rule Preserve the invoice view. Do not rename, restyle, or rearrange invoice screens unless the user names the **exact** new copy (or a specific layout change). This is a personal rule.",
      },
      {
        id: "test-rule",
        title: "Test the rule",
        promptType: "adaptable",
        detail: "",
        example: 'Change "Line Items" in the UI to something else.',
      },
      {
        id: "skill",
        title: "Create a user skill",
        promptType: "adaptable",
        detail:
          "Let’s create a user skill that tells me the domain breakdown and available APIs. Go to Customize > Skills to view the skill.",
        example:
          "/create-skill Use domain-driven design to break down the domains in this application and match it to available APIs or data schemas. This is a personal skill.",
      },
      {
        id: "test-skill",
        title: "Test the skill",
        promptType: "adaptable",
        detail: "",
        example: "Use domain-driven design on this application. Do not edit files.",
      },
      {
        id: "canvas",
        title: "Canvas",
        promptType: "reusable",
        detail: "Use Canvas to generate interactive artifacts that render next to the chat.",
        example: "Create a canvas explaining what we did today.",
      },
      {
        id: "mcp",
        title: "MCP / Figma",
        promptType: "adaptable",
        detail:
          "Ask Grok Build to create a slideshow in Figma using MCP Servers. Find an MCP server for slideshow generation in Grok Build. Go to Customize > MCPs > Figma.",
        example:
          "Create three slides in Figma Slides outlining how I used Grok Build to develop a new feature. I want to use this as part of my demo showcase.",
      },
    ],
  },
  {
    id: "mcp-more-info",
    title: "How do you connect an agent to external tools?",
    beats: [
      {
        id: "add-jira-mcp",
        title: "Enable Jira MCP",
        promptType: "none",
        detail:
          "Let’s start the issue tracker’s MCP server. For this workshop, that is Jira. Get a ticket for this project. Review MCP servers in Customize > MCPs. Enable the Jira MCP server.",
      },
      {
        id: "mcp-allowlist",
        title: "Check MCP allowlist",
        promptType: "none",
        detail:
          "Go to Settings > Agents > Execution and Approvals > Allowlist Options > MCP Allowlist to check valid MCP servers and tools from your administrator.",
      },
      {
        id: "ask-jira-bug",
        title: "List open issues",
        promptType: "adaptable",
        detail:
          "Open a new agent. Someone reported a bug and it was logged in our issue tracker. I want more information on it. Review the tool calls to the Jira MCP server.",
        example: "List the open issues from our issue tracker.",
      },
      {
        id: "add-local-plugin",
        title: "Add plugin",
        promptType: "none",
        detail:
          "A teammate created a plugin for standardizing bug fixes. Go to Customize > Plugins > Add > From Local Repository. Find the plugins/standard-bug-fix file directory and add it.",
      },
      {
        id: "check-plugin",
        title: "Enable Standard bug fix plugin",
        promptType: "none",
        detail:
          "Go to Customize > Plugins. Go to Personal. Click Add to enable the “Standard bug fix” plugin. Show that the plugin has skills, rules, and MCP server.",
      },
      {
        id: "standard-bug-fix",
        title: "Standard bug fix",
        promptType: "adaptable",
        detail:
          "Let’s fix the bug and update the issue with the standard template. Go to the issue in Jira and review the comments following the bug template.",
        example: "Work on a standard bug fix for the issue where clicking overdue does not filter.",
      },
    ],
  },
] as const satisfies readonly DemoSection[];
