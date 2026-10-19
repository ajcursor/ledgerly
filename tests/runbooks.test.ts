import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  RUNBOOK_SECTIONS_101,
  RUNBOOK_SECTIONS_201,
  RUNBOOK_SECTIONS_301,
  RUNBOOK_TRACKS,
  runbookBeatSequence,
  runbookBeats,
  stripOptionalTags,
  trackOptionalFeatures,
} from "@/runbooks/meta";
import {
  STATIC_RUNBOOKS_PATH,
  beatFeature,
  renderBeatHtml,
  renderRunbooksHtml,
} from "@/runbooks/static-page";

const root = process.cwd();
const beats101 = runbookBeats("101");
const beats201 = runbookBeats("201");
const beats301 = runbookBeats("301");

describe("runbook catalog", () => {
  it("ships the 101, 201, and 301 tracks", () => {
    expect(RUNBOOK_TRACKS.map((track) => track.id)).toEqual(["101", "201", "301"]);

    const track101 = RUNBOOK_TRACKS.find((track) => track.id === "101");
    const track201 = RUNBOOK_TRACKS.find((track) => track.id === "201");
    const track301 = RUNBOOK_TRACKS.find((track) => track.id === "301");

    expect(track101?.description).toBe(
      "You will explore different ways to work in Grok Build, use modes and models for the right tasks, apply rules and skills to ensure consistent quality, and complete at least one task with an agent.",
    );
    expect(track201?.description).toBe(
      "You will curate what belongs in an agent's context, encode conventions as project skills, connect a curated set of MCP servers, and split one task across parallel agents.",
    );
    expect(track301?.description).toBe(
      "You will orchestrate work across agents, tasks, and coworkers: break tasks down for multiple agents, take a plan through parallel agents to a reviewable PR, scale review when several streams finish, and share ownership safely.",
    );

    for (const track of RUNBOOK_TRACKS) {
      expect(track).not.toHaveProperty("runbookSlugs");
    }
  });

  it("keeps the 101 beats intact", () => {
    const skill = readFileSync(join(root, ".cursor/skills/choose-cursor-workflow/SKILL.md"), "utf8");
    const track101 = RUNBOOK_TRACKS.find((track) => track.id === "101");
    expect(skill).toContain(track101?.description ?? "");

    expect(runbookBeatSequence("101")).toBe(
      "Ask → Plan → Build in Agent mode → Debug → Check the models → Plan to fix the bug → Run Mode Allowlist → Verify the email feature → Redact (partial) → Stop the prompt → Interrupt and steer → Continue to the end → Review diffs → Restore from a checkpoint → Create a user rule → Test the rule → Create a user skill → Test the skill → Canvas → MCP / Figma",
    );

    expect(beats101.map((beat) => beat.id)).toEqual([
      "ask",
      "plan",
      "agent-build",
      "debug",
      "model-fast",
      "fix",
      "allowlist",
      "verify-email",
      "start-and-stop",
      "stop",
      "interrupt-steer",
      "continue-no-approval",
      "diffs",
      "checkpoint-restore",
      "rule",
      "test-rule",
      "skill",
      "test-skill",
      "canvas",
      "mcp",
    ]);

    const beat = (id: (typeof beats101)[number]["id"]) => beats101.find((entry) => entry.id === id);

    expect(beat("ask")?.detail).toBe("Let’s learn more about the application with Ask mode.");
    expect(beat("ask")?.example).toBe("/ask Tell me what this application does in 3 sentences");
    expect(beat("plan")?.detail).toBe("Map your approach to building a new feature in Plan mode.");
    expect(beat("plan")?.example).toBe(
      "/plan I want a new feature to update the customer email in the invoice detail customer card. Don’t implement email validation.",
    );
    expect(beat("agent-build")?.detail).toBe(
      "Build the feature in Agent mode. Build the plan locally. Check the feature in the UI.",
    );
    expect(beat("agent-build")?.example).toBeUndefined();
    expect(beat("debug")?.detail).toBe(
      "Investigate the failing test using Debug mode. Debug mode is useful because the agent investigates the codebase and presents some hypothesis on the root cause. I can choose to reproduce the bug and attempt to fix based on the agent’s hypotheses.",
    );
    expect(beat("debug")?.example).toBe("/debug the failing test");
    expect(beat("model-fast")?.title).toBe("Check the models");
    expect(beat("model-fast")?.promptType).toBe("none");
    expect(beat("model-fast")?.detail).toBe(
      "Check the models available for use. Select Auto in the chat and review the models available for use.",
    );
    expect(beat("model-fast")?.example).toBeUndefined();
    expect(beat("fix")?.detail).toBe("Use shift-tab to toggle to Agent mode.");
    expect(beat("fix")?.example).toBe("Fix the failing test.");
    expect(beat("allowlist")?.example).toBeUndefined();
    expect(beat("allowlist")?.detail).toBe(
      "Let’s change how our agent asks for approvals by configuring an allowlist - a known set of commands that Grok Build can run without asking for review. Go to Settings > Agents > Executions & Approvals > Run Mode > Allowlist.",
    );
    expect(beat("verify-email")?.promptType).toBe("none");
    expect(beat("verify-email")?.example).toBeUndefined();
    expect(beat("verify-email")?.detail).toBe(
      "Go to http://localhost:43173/invoices/inv_1048. Find the edit email feature you implemented in the Customer box.",
    );
    expect(beat("start-and-stop")?.title).toBe("Redact (partial)");
    expect(beat("start-and-stop")?.detail).toBe("");
    expect(beat("start-and-stop")?.example).toBe(
      "Redact the customer email in the UI. The first two characters and domain are plaintext. When I click to type in the box, clear it and save the new email.",
    );
    expect(beat("stop")?.example).toBeUndefined();
    expect(beat("stop")?.detail).toBe("Stop the prompt with the Stop button in the chat.");
    expect(beat("interrupt-steer")?.detail).toBe(
      "Steer the prompt. Show how the agent pauses for your approval. Continue running after reviewing the first file.",
    );
    expect(beat("interrupt-steer")?.example).toBe(
      "Redact the customer email in the UI. Show it in plaintext when I click the box to edit it. Stop every time you change a file for me to review.",
    );
    expect(beat("continue-no-approval")?.detail).toBe("");
    expect(beat("continue-no-approval")?.example).toBe(
      "Continue to the end, do not wait for my approval.",
    );
    expect(beat("diffs")?.example).toBeUndefined();
    expect(beat("diffs")?.detail).toBe(
      "Select Changes in the right hand panel. Show diffs from agent’s last turn.",
    );
    expect(beat("checkpoint-restore")?.title).toBe("Restore from a checkpoint");
    expect(beat("checkpoint-restore")?.promptType).toBe("none");
    expect(beat("checkpoint-restore")?.example).toBeUndefined();
    expect(beat("checkpoint-restore")?.detail).toBe(
      "If I want to revert the code, I can restore from a checkpoint. Scroll back to a prompt before updating the feature. Select the restore icon next to the prompt.",
    );
    expect(beat("rule")?.detail).toBe(
      "Let’s create a user rule so the agent doesn’t try to improve the invoice UI without our approval. Use /create-rule, a built-in skill, to create a rule. Go to Customize > Rules > User to view the rule.",
    );
    expect(beat("rule")?.example).toBe(
      "/create-rule Preserve the invoice view. Do not rename, restyle, or rearrange invoice screens unless the user names the **exact** new copy (or a specific layout change). This is a personal rule.",
    );
    expect(beat("test-rule")?.detail).toBe("");
    expect(beat("test-rule")?.example).toBe('Change "Line Items" in the UI to something else.');
    expect(beat("skill")?.detail).toBe(
      "Let’s create a user skill that tells me the domain breakdown and available APIs. Go to Customize > Skills to view the skill.",
    );
    expect(beat("skill")?.example).toBe(
      "/create-skill Use domain-driven design to break down the domains in this application and match it to available APIs or data schemas. This is a personal skill.",
    );
    expect(beat("test-skill")?.detail).toBe("");
    expect(beat("test-skill")?.example).toBe("Use domain-driven design on this application. Do not edit files.");
    expect(beat("canvas")?.title).toBe("Canvas");
    expect(beat("canvas")?.example).toBe("Create a canvas explaining what we did today.");
    expect(beat("mcp")?.title).toBe("MCP / Figma");
    expect(beat("mcp")?.detail).toBe(
      "Ask Grok Build to create a slideshow in Figma using MCP Servers. Find an MCP server for slideshow generation in Grok Build. Go to Customize > MCPs > Figma.",
    );
    expect(beat("mcp")?.example).toBe(
      "Create three slides in Figma Slides outlining how I used Grok Build to develop a new feature. I want to use this as part of my demo showcase.",
    );

    expect(beats101.every((entry) => entry.promptType !== undefined)).toBe(true);
    expect(beat("ask")?.promptType).toBe("reusable");
    expect(beat("plan")?.promptType).toBe("adaptable");
    expect(beat("agent-build")?.promptType).toBe("none");
    expect(RUNBOOK_SECTIONS_101.map((section) => section.title)).toEqual([
      "What is Grok Build?",
      "How do you work with an agent?",
      "How do you govern an agent?",
    ]);
    expect(
      RUNBOOK_SECTIONS_101.find((section) => section.id === "work-with-agent")?.beats.map(
        (entry) => entry.id,
      ),
    ).toEqual([
      "allowlist",
      "verify-email",
      "start-and-stop",
      "stop",
      "interrupt-steer",
      "continue-no-approval",
      "diffs",
      "checkpoint-restore",
    ]);
    expect(RUNBOOK_SECTIONS_101.flatMap((section) => section.beats.map((entry) => entry.id))).toEqual(
      beats101.map((entry) => entry.id),
    );
  });

  it("keeps the 201 beats intact", () => {
    const skill = readFileSync(join(root, ".cursor/skills/choose-cursor-workflow/SKILL.md"), "utf8");
    const track201 = RUNBOOK_TRACKS.find((track) => track.id === "201");
    expect(skill).toContain(track201?.description ?? "");

    expect(RUNBOOK_SECTIONS_201.map((section) => section.title)).toEqual([
      "How do you manage context?",
      "How do you standardize agent behavior?",
      "How do you connect an agent to external tools?",
      "How do you parallelize a task?",
    ]);
    expect(RUNBOOK_SECTIONS_201.map((section) => section.id)).toEqual([
      "target-context",
      "standardize-behavior",
      "mcp-more-info",
      "parallelize-task",
    ]);

    expect(beats201.map((beat) => beat.id)).toEqual([
      "rename-agent-1-all",
      "ask-ddd-all",
      "rename-agent-2-target",
      "ask-ddd-invoice-table",
      "context-usage",
      "compare-agents",
      "ask-cross-context",
      "create-api-personal-skill",
      "promote-create-api-project",
      "add-linear-mcp",
      "mcp-allowlist",
      "ask-linear-bug",
      "add-local-plugin",
      "check-plugin",
      "standard-bug-fix",
      "open-new-agent",
      "open-resolve-dispute-plan",
      "open-ledgerly-reviewer",
      "open-dispatch-subagents-skill",
      "multitask-resolve-dispute",
      "canvas-subagent-progress",
      "ledgerly-reviewer-check",
    ]);
    expect(RUNBOOK_SECTIONS_201.flatMap((section) => section.beats.map((entry) => entry.id))).toEqual(
      beats201.map((entry) => entry.id),
    );

    const beat = (id: (typeof beats201)[number]["id"]) => beats201.find((entry) => entry.id === id);

    expect(beat("rename-agent-1-all")?.detail).toBe(
      "Open one agent and ask it for information about the entire codebase.",
    );
    expect(beat("rename-agent-1-all")?.example).toBe("/rename-chat Agent 1 All");
    expect(beat("ask-ddd-all")?.detail).toBe("");
    expect(beat("ask-ddd-all")?.example).toBe(
      "/ask what is the domain driven design of the application.",
    );
    expect(beat("rename-agent-2-target")?.detail).toBe(
      "Open a second agent for a new targeted context window.",
    );
    expect(beat("rename-agent-2-target")?.example).toBe("/rename-chat Agent 2 Target");
    expect(beat("ask-ddd-invoice-table")?.detail).toBe("");
    expect(beat("ask-ddd-invoice-table")?.example).toBe(
      "/ask what is the domain driven design of the @invoice-table.tsx",
    );
    expect(beat("context-usage")?.promptType).toBe("none");
    expect(beat("context-usage")?.detail).toBe(
      "Go to Agent 1 All chat. Click the Context Usage indicator below the chat. Go to Agent 2 Target. Click the Context Usage indicator below the chat.",
    );
    expect(beat("context-usage")?.example).toBeUndefined();
    expect(beat("compare-agents")?.promptType).toBe("none");
    expect(beat("compare-agents")?.example).toBeUndefined();
    expect(beat("compare-agents")?.detail).toBe(
      "Agent 1 maps all the domains in the whole codebase. Its context window shows X%. Agent 2 maps half of the domains based on the targeted context. Its context window shows Y%. The difference in context window may not be significant but can affect larger repositories.",
    );
    expect(beat("ask-cross-context")?.detail).toBe(
      "Agent 1 mapped all domains; Agent 2 can reuse that summary. Go to Agent 2 Target chat.",
    );
    expect(beat("ask-cross-context")?.example).toBe(
      "/ask @Agent 1 All Does refactoring the table change anything across all contexts?",
    );
    expect(beat("create-api-personal-skill")?.detail).toBe(
      "Open a new agent. It scans the entire repository for the pattern. Create a personal skill for how to create a new API. Open skill in ~/.cursor/skills.",
    );
    expect(beat("create-api-personal-skill")?.example).toBe(
      "/create-skill for how to create a new API. Follow the standards in this repo. This is a personal skill named create-api.",
    );
    expect(beat("promote-create-api-project")?.detail).toBe(
      "Promote the create-api skill so teammates can use it. Open skill in .cursor/skills. Review the other project skills for this repository, such as add-dashboard-widget, draft-collection-email, or write-prisma-query.",
    );
    expect(beat("promote-create-api-project")?.example).toBe("Promote the create-api skill to this project.");
    expect(beat("add-linear-mcp")?.detail).toBe(
      "Let’s start the issue tracker’s MCP server. For this workshop, that is Linear. Get a ticket for this project. Review MCP servers in Customize > MCPs. Enable the Linear MCP server.",
    );
    expect(beat("add-linear-mcp")?.example).toBeUndefined();
    expect(beat("mcp-allowlist")?.promptType).toBe("none");
    expect(beat("mcp-allowlist")?.example).toBeUndefined();
    expect(beat("mcp-allowlist")?.detail).toBe(
      "Go to Settings > Agents > Execution and Approvals > Allowlist Options > MCP Allowlist to check valid MCP servers and tools from your administrator.",
    );
    expect(beat("ask-linear-bug")?.detail).toBe(
      "Open a new agent. Someone reported a bug and it was logged in our issue tracker. I want more information on it. Review the tool calls to the Linear MCP server.",
    );
    expect(beat("ask-linear-bug")?.example).toBe("List the open issues from our issue tracker.");
    expect(beat("add-local-plugin")?.promptType).toBe("none");
    expect(beat("add-local-plugin")?.example).toBeUndefined();
    expect(beat("add-local-plugin")?.detail).toBe(
      "A teammate created a plugin for standardizing bug fixes. Go to Customize > Plugins > Add > From Local Repository. Find the plugins/standard-bug-fix file directory and add it.",
    );
    expect(beat("check-plugin")?.promptType).toBe("none");
    expect(beat("check-plugin")?.example).toBeUndefined();
    expect(beat("check-plugin")?.detail).toBe(
      "Go to Customize > Plugins. Go to Personal. Click Add to enable the “Standard bug fix” plugin. Show that the plugin has skills, rules, and MCP server.",
    );
    expect(beat("standard-bug-fix")?.detail).toBe(
      "Let’s fix the bug and update the issue with the standard template. Go to the issue in Linear and review the comments following the bug template.",
    );
    expect(beat("standard-bug-fix")?.example).toBe(
      "Work on a standard bug fix for the issue where clicking overdue does not filter.",
    );
    expect(beat("open-new-agent")?.title).toBe("Open a new agent");
    expect(beat("open-new-agent")?.promptType).toBe("none");
    expect(beat("open-new-agent")?.example).toBeUndefined();
    expect(beat("open-new-agent")?.detail).toBe("Open a new agent.");
    expect(beat("open-resolve-dispute-plan")?.promptType).toBe("none");
    expect(beat("open-resolve-dispute-plan")?.example).toBeUndefined();
    expect(beat("open-resolve-dispute-plan")?.detail).toBe(
      "Open .cursor/plans/resolve-dispute.md. Review the plan and how it splits data, API, and UI tasks.",
    );
    expect(beat("open-ledgerly-reviewer")?.promptType).toBe("none");
    expect(beat("open-ledgerly-reviewer")?.example).toBeUndefined();
    expect(beat("open-ledgerly-reviewer")?.detail).toBe("Open .cursor/agents/ledgerly-reviewer.md");
    expect(beat("open-dispatch-subagents-skill")?.promptType).toBe("none");
    expect(beat("open-dispatch-subagents-skill")?.example).toBeUndefined();
    expect(beat("open-dispatch-subagents-skill")?.detail).toBe(
      "Open .cursor/skills/dispatch-subagents/SKILL.md.",
    );
    expect(beat("multitask-resolve-dispute")?.detail).toBe(
      "Build the feature using the /multitask command.",
    );
    expect(beat("multitask-resolve-dispute")?.example).toBe("/multitask @resolve-dispute.md");
    expect(beat("canvas-subagent-progress")?.promptType).toBe("adaptable");
    expect(beat("canvas-subagent-progress")?.detail).toBe(
      "Use Canvas to keep track of the progress of subagents and their tasks. Review Canvas with subagent progress and worktree conflicts.",
    );
    expect(beat("canvas-subagent-progress")?.example).toBe(
      "Update Canvas with subagent progress and models used. Make a list of worktree conflicts as you encounter them.",
    );
    expect(beat("ledgerly-reviewer-check")?.detail).toBe(
      "Use the specialized reviewer subagent to check the completed task.",
    );
    expect(beat("ledgerly-reviewer-check")?.example).toBe("ledgerly-reviewer check my work");

    expect(beats201.every((entry) => entry.promptType !== undefined)).toBe(true);
    expect(beat("rename-agent-1-all")?.promptType).toBe("reusable");
    expect(beat("ask-ddd-all")?.promptType).toBe("reusable");
    expect(beat("rename-agent-2-target")?.promptType).toBe("reusable");
    expect(beat("ask-ddd-invoice-table")?.promptType).toBe("reusable");
    expect(beat("context-usage")?.promptType).toBe("none");
    expect(beat("ask-cross-context")?.promptType).toBe("reusable");
    expect(beat("create-api-personal-skill")?.promptType).toBe("reusable");
    expect(beat("promote-create-api-project")?.promptType).toBe("reusable");
    expect(beat("add-linear-mcp")?.promptType).toBe("none");
    expect(beat("ask-linear-bug")?.promptType).toBe("adaptable");
    expect(beat("standard-bug-fix")?.promptType).toBe("adaptable");
    expect(beat("open-new-agent")?.promptType).toBe("none");
    expect(beat("multitask-resolve-dispute")?.promptType).toBe("reusable");
    expect(beat("canvas-subagent-progress")?.promptType).toBe("adaptable");
    expect(beat("ledgerly-reviewer-check")?.promptType).toBe("adaptable");
  });

  it("keeps the 301 beats intact", () => {
    const skill = readFileSync(join(root, ".cursor/skills/choose-cursor-workflow/SKILL.md"), "utf8");
    const track301 = RUNBOOK_TRACKS.find((track) => track.id === "301");
    expect(skill).toContain(track301?.description ?? "");
    expect(skill).toContain("runbooks.html?track=301");

    expect(RUNBOOK_SECTIONS_301.map((section) => section.title)).toEqual([
      "How do you orchestrate tasks across agents?",
      "How do multiple agents go from plan to reviewable code?",
      "How do you scale AI code reviews?",
      "How do coworkers share ownership safely?"
    ]);
    expect(RUNBOOK_SECTIONS_301.map((section) => section.id)).toEqual([
      "break-down-tasks",
      "plan-to-pr",
      "scale-reviews",
      "share-ownership"
    ]);
    expect(RUNBOOK_SECTIONS_301.map((section) => section.beats.length)).toEqual([11, 12, 5, 6]);
    expect(RUNBOOK_SECTIONS_301.flatMap((section) => section.beats.map((entry) => entry.id))).toEqual(
      beats301.map((entry) => entry.id),
    );
    expect(runbookBeatSequence("301")).toBe(
      "Get the issues for the collections command center from the issue tracker. \u2192 Plan the collections command center in a separate agent. \u2192 Start a keyboard walkthrough for the accessibility audit in a new agent. \u2192 Show the problem by hand. \u2192 Checking every page like this by hand takes a lot of time and judgment, so let's build a subagent that does it for us. \u2192 Move to a Cloud Agent. \u2192 Start a new agent to audit accessibility. \u2192 Show /multitask for small coordinated jobs. \u2192 Review the subagents. \u2192 Check the output of the subagents. \u2192 Fallback: reference repo issues \u2192 Start a new Project. \u2192 Stage the Project. \u2192 Use Projects to assign tasks to agents. \u2192 Start a new agent. \u2192 Start a plan to fix the walkthrough failures on a separate worktree. \u2192 Review the plan. \u2192 Build the plan. \u2192 Use Cloud Agents to build the plan if you do not have Projects. \u2192 Ask a side question while the coordinator remediates the findings. \u2192 Ask what the first subagent is remediating. \u2192 Consolidate and open a reviewable PR. \u2192 Keep track of the Project. \u2192 Start a new agent. \u2192 Run the change reviewer subagent before you conduct manual review. \u2192 Identify any changes requiring closer inspection. \u2192 Review the high-risk changes. \u2192 Run Bugbot. \u2192 Start a new agent. \u2192 Identify the most reliable fix for each review finding. \u2192 Create an Automation. \u2192 Trigger the PR Automation. \u2192 Return to the collections command center plan. \u2192 Check other PRs for files and comments that conflict with the next project.",
    );

    // Say, Do, and Prompt are copied from the Outline. Optional tags are on optional.feature, not in the prompt.
    expect(beats301.map(({ id, title, promptType, detail, example, optional, say, after }) => ({ id, title, promptType, detail, example, optional, say, after }))).toEqual([
  {
    "id": "get-command-center-issues",
    "title": "Get the issues for the collections command center from the issue tracker.",
    "promptType": "adaptable",
    "detail": "Start a new agent for the command center plan.",
    "example": "/ask List open issues for the collections command center in Linear.",
    "say": "The Linear MCP server returns a list of nine issues to create the collections command center."
  },
  {
    "id": "plan-command-center",
    "title": "Plan the collections command center in a separate agent.",
    "promptType": "adaptable",
    "detail": "",
    "example": "/plan the collections command center from its issues. List the tasks, the files each touches, and the open questions.",
    "say": "We are going to run this first and handle the manual part in parallel. This agent only plans. It builds nothing until we come back to it."
  },
  {
    "id": "open-local-agent",
    "title": "Start a keyboard walkthrough for the accessibility audit in a new agent.",
    "promptType": "none",
    "detail": "Start a new agent for the keyboard walkthrough."
  },
  {
    "id": "show-problem-by-hand",
    "title": "Show the problem by hand.",
    "promptType": "none",
    "detail": "Open Browser to http://localhost:43173/invoices.\nPress Tab a few times on the invoices page.",
    "say": "Focus is the control the keyboard is on right now. When you press Tab, focus moves to the next button, link, or field. A visible outline usually shows where it is, so a keyboard user always knows what Enter will do.\nWatch the page. After a couple of presses the outline disappears. Focus is still on something, but I can't tell what, so a keyboard user is now lost."
  },
  {
    "id": "create-accessibility-manual-reviewer",
    "title": "Checking every page like this by hand takes a lot of time and judgment, so let's build a subagent that does it for us.",
    "promptType": "adaptable",
    "detail": "",
    "example": "/create-subagent accessibility-manual-reviewer that walks pages by keyboard in the Browser, since CI runs automated tests. Report tab order, focus, trap, Escape, and navigation failures with screenshots. Set model: fast, read-only: false.",
    "say": "CI catches missing labels, which break screen readers, and low contrast, which makes text hard to read.\nA keyboard walkthrough takes judgment, so this subagent uses the page the way a keyboard user would. Reuse it any time you change the UI."
  },
  {
    "id": "optional-cloud-agent",
    "title": "Move to a Cloud Agent.",
    "promptType": "none",
    "detail": "Click Continue on Cloud to move this to a Cloud Agent.\nClick Include Changes.",
    "optional": {
      "feature": "Cloud Agents"
    },
    "say": "Rather than run all of these subagents locally, move everything to a Cloud Agent on a remote environment and build everything on an isolated branch.\nOnce it is done, check its work."
  },
  {
    "id": "start-audit-agent",
    "title": "Start a new agent to audit accessibility.",
    "promptType": "none",
    "detail": "Start a new local agent.",
    "say": "Start a new audit for accessibility. Check the accessibility test suite and run a keyboard walkthrough. Run the application test suite to make sure the application works as intended."
  },
  {
    "id": "multitask-walkthroughs",
    "title": "Show /multitask for small coordinated jobs.",
    "promptType": "adaptable",
    "detail": "",
    "example": "/multitask Run these in parallel to find what I need to fix: the accessibility-manual-reviewer subagent on the invoices page, the accessibility test suite, and the application test suite.",
    "say": "The coordinator gives each task its own subagent: a keyboard walkthrough of the invoices page, the accessibility test suite, and the application test suite."
  },
  {
    "id": "review-subagents",
    "title": "Review the subagents.",
    "promptType": "none",
    "detail": "Watch the Working indicator above the chat box.",
    "say": "Stop one task if it drifts. When each agent completes, you get a set of recommendations."
  },
  {
    "id": "summarize-subagents",
    "title": "Check the output of the subagents.",
    "promptType": "adaptable",
    "detail": "",
    "example": "Give me a one-sentence summary for each subagent.",
    "say": "The coordinator summarizes the failures from the keyboard walkthrough of the invoices page, the accessibility test suite, and the application test suite."
  },
  {
    "id": "linear-issue-fallback",
    "title": "Fallback: reference repo issues",
    "promptType": "adaptable",
    "detail": "If an agent cannot access the Linear MCP server, use the issue descriptions in the repository.",
    "example": "Reference issues from @linear-field-demo.ts instead of Linear."
  },
  {
    "id": "optional-start-project",
    "title": "Start a new Project.",
    "promptType": "none",
    "detail": "Start a new Project.\nName it {INSERT COMPANY HERE, default is Ledgerly}.",
    "optional": {
      "feature": "Projects"
    },
    "say": "Starting a new Project creates a long-running Cloud Agent that acts as a coordinator.\nRun the remaining commands in the Project. Note that responses to prompts may differ from responses in an individual agent."
  },
  {
    "id": "optional-stage-project",
    "title": "Stage the Project.",
    "promptType": "adaptable",
    "detail": "",
    "example": "Run each agent in its own worktree to avoid conflicts, and parallelize where possible.",
    "optional": {
      "feature": "Projects"
    },
    "say": "Make clear to the Project that each agent runs in its own worktree to isolate work and avoid conflicts."
  },
  {
    "id": "optional-assign-project",
    "title": "Use Projects to assign tasks to agents.",
    "promptType": "none",
    "detail": "Run the following prompts from the Project without starting new agents.",
    "optional": {
      "feature": "Projects"
    },
    "say": "Let Projects decide how best to assign tasks and complete work."
  },
  {
    "id": "open-plan-agent",
    "title": "Start a new agent.",
    "promptType": "none",
    "detail": "Open a new local agent.",
    "say": "I want to fix the keyboard walkthrough failures from all three pages."
  },
  {
    "id": "plan-remediation",
    "title": "Start a plan to fix the walkthrough failures on a separate worktree.",
    "promptType": "adaptable",
    "detail": "",
    "example": "/plan fixes for the keyboard failures on invoices, collections, and settings in @.cursor/plans/keyboard-walkthrough-audit.md. One task per failure, mark parallel tasks, and use a separate worktree with auto-approved changes.",
    "say": "Create a plan based on the combined failures from the three walkthroughs. If the plan asks questions, choose to run tasks in parallel and write updates to the issue tracker.\nBy starting the work on a separate worktree, you avoid editing the working code on the main branch. If you do not let the agent automatically approve changes on the worktree, you may have to manually approve each file change."
  },
  {
    "id": "review-plan",
    "title": "Review the plan.",
    "promptType": "none",
    "detail": "Review the plan.",
    "say": "The plan assigns tasks to workers and notes which ones run in parallel."
  },
  {
    "id": "build-plan",
    "title": "Build the plan.",
    "promptType": "none",
    "detail": "Build locally."
  },
  {
    "id": "optional-build-cloud",
    "title": "Use Cloud Agents to build the plan if you do not have Projects.",
    "promptType": "none",
    "detail": "Build the plan with Cloud Agents.",
    "optional": {
      "feature": "Cloud Agents"
    }
  },
  {
    "id": "side-chat",
    "title": "Ask a side question while the coordinator remediates the findings.",
    "promptType": "reusable",
    "detail": "",
    "example": "/side"
  },
  {
    "id": "ask-subagent-progress",
    "title": "Ask what the first subagent is remediating.",
    "promptType": "reusable",
    "detail": "",
    "example": "/ask What is the first subagent remediating? Answer with the finding and the files it changes.",
    "say": "If you want to know what a subagent is doing, you can open a side chat and ask without blocking the coordinator."
  },
  {
    "id": "consolidate-pr",
    "title": "Consolidate and open a reviewable PR.",
    "promptType": "reusable",
    "detail": "Open the PR. Show the summary a coworker would read first.",
    "example": "Consolidate the completed tasks into one branch so reviewers get one PR. Open a PR with what each task changed and what a human should verify.",
    "say": "Move finished worktrees back deliberately. Resolve conflicts on purpose."
  },
  {
    "id": "optional-project-notes",
    "title": "Keep track of the Project.",
    "promptType": "adaptable",
    "detail": "",
    "example": "Show me the project notes and context.",
    "optional": {
      "feature": "Projects"
    },
    "say": "As you continue working on the Project, it keeps track of your requests to agents.\nYou can review tasks in project notes and shared files in context."
  },
  {
    "id": "checkout-fixes-branch",
    "title": "Start a new agent.",
    "promptType": "adaptable",
    "detail": "Open a new local agent.",
    "example": "Check out the branch for the keyboard fixes PR.",
    "say": "With many lines of accessibility fixes in this PR, I want to identify the most important files to review."
  },
  {
    "id": "run-reviewer-subagent",
    "title": "Run the change reviewer subagent before you conduct manual review.",
    "promptType": "reusable",
    "detail": "",
    "example": "Use the change reviewer subagent to review the remediation PR. List each issue with its file, line, and severity.",
    "say": "With readonly: true, the change reviewer can read and report but can’t change files. The reviewer and the author stay separate."
  },
  {
    "id": "check-closer-inspection",
    "title": "Identify any changes requiring closer inspection.",
    "promptType": "none",
    "detail": "Check the change reviewer’s output for any issues requiring closer inspection."
  },
  {
    "id": "review-highest-risk",
    "title": "Review the high-risk changes.",
    "promptType": "reusable",
    "detail": "Open the highest-risk change and read it line by line.",
    "example": "/ask Which change in this PR has the highest risk? List the files and lines I need to review.",
    "say": "The change reviewer subagent clears the noise so your time goes where judgment matters."
  },
  {
    "id": "optional-bugbot",
    "title": "Run Bugbot.",
    "promptType": "reusable",
    "detail": "",
    "example": "/review-bugbot this remediation PR",
    "optional": {
      "feature": "Bugbot"
    },
    "say": "Run Bugbot to check for code quality. Review its suggestions for changes."
  },
  {
    "id": "open-ownership-agent",
    "title": "Start a new agent.",
    "promptType": "none",
    "detail": "Open a new local agent.",
    "say": "I want to turn some of the review findings in this PR into the most reliable fix: a rule, skill, subagent, test, or human check."
  },
  {
    "id": "shift-left-findings",
    "title": "Identify the most reliable fix for each review finding.",
    "promptType": "reusable",
    "detail": "",
    "example": "Turn repeat findings from this PR's review comments and change reviewer into reusable fixes so they stop recurring. Draft the most deterministic fix for each: a rule, skill, subagent, test, or human check.",
    "say": "You choose which ones to turn into a rule, skill, subagent, test, or human check for your coworkers to reuse."
  },
  {
    "id": "optional-reviewer-automation",
    "title": "Create an Automation.",
    "promptType": "none",
    "detail": "Go to the Automations tab.\nClick New Automation.\nName it Reviewer.\nSelect the demo repository.\nClick Triggers > PR opened, then select the demo repository and set the author to Anyone.\nAdd “Use the change reviewer subagent to review this PR and comment with each issue's file, line, and severity.” to agent instructions.\nAdd “Comment on Pull Request” to tools.\nClick Save.",
    "optional": {
      "feature": "Automations"
    }
  },
  {
    "id": "optional-trigger-automation",
    "title": "Trigger the PR Automation.",
    "promptType": "adaptable",
    "detail": "Start a new local agent.\nOpen the PR for the accessibility test suite fixes and review the status check for Automation: Reviewer.",
    "example": "Run the accessibility test suite and fix its failures on a separate worktree. Open a PR when done.",
    "optional": {
      "feature": "Automations"
    },
    "say": "Opening any PR triggers the Reviewer Automation, so I'll create one and watch the check run."
  },
  {
    "id": "return-to-plan",
    "title": "Return to the collections command center plan.",
    "promptType": "none",
    "detail": "Open the command center planning agent in the Agent Window. Don’t start a new plan.",
    "say": "Now I’m going back to the collections command center plan. Before I start the work, I’ll check the keyboard fixes PR for conflicts."
  },
  {
    "id": "list-conflict-files",
    "title": "Check other PRs for files and comments that conflict with the next project.",
    "promptType": "adaptable",
    "detail": "",
    "example": "Review the open PRs in this repository and flag any that have file conflicts or comments that may affect the collections command center feature.",
    "say": "Use the context in other PRs to identify possible conflicts before you start work."
  }
]);

    expect(beats301).toHaveLength(34);
    expect(beats301.every((entry) => entry.promptType !== undefined)).toBe(true);
    expect(
      beats301.filter((entry) => entry.promptType === "none").every((entry) => entry.example === undefined),
    ).toBe(true);
    expect(beats301.filter((entry) => entry.example?.startsWith("/")).every((entry) => /^\/[a-z-]+/.test(entry.example ?? ""))).toBe(true);
  });

  it("tags 301 optional beats with the Outline feature and filters them from the track checklist", () => {
    const optionalFeatures = {
      "optional-cloud-agent": "Cloud Agents",
      "optional-start-project": "Projects",
      "optional-stage-project": "Projects",
      "optional-assign-project": "Projects",
      "optional-build-cloud": "Cloud Agents",
      "optional-project-notes": "Projects",
      "optional-bugbot": "Bugbot",
      "optional-reviewer-automation": "Automations",
      "optional-trigger-automation": "Automations",
    } as const;
    expect(beats301.filter((entry) => entry.optional).map((entry) => entry.id)).toEqual(
      Object.keys(optionalFeatures),
    );
    expect(beats101.some((entry) => entry.optional)).toBe(false);
    expect(beats201.some((entry) => entry.optional)).toBe(false);
    for (const [id, feature] of Object.entries(optionalFeatures)) {
      expect(beats301.find((entry) => entry.id === id)?.optional).toEqual({ feature });
    }
    expect(trackOptionalFeatures(RUNBOOK_TRACKS[0])).toEqual([]);
    expect(trackOptionalFeatures(RUNBOOK_TRACKS[1])).toEqual([]);
    expect(trackOptionalFeatures(RUNBOOK_TRACKS[2])).toEqual([
      "Cloud Agents",
      "Projects",
      "Bugbot",
      "Automations",
    ]);

    const tagged = stripOptionalTags("[Optional - Cloud Agents] /plan the work");
    expect(tagged.features).toEqual(["Cloud Agents"]);
    expect(tagged.text).toBe("/plan the work");
    expect(stripOptionalTags("Keep this prompt.").text).toBe("Keep this prompt.");
    const taggedCard = renderBeatHtml({
      id: "tagged",
      title: "Tagged",
      detail: "",
      promptType: "adaptable",
      example: "[Optional - Projects] Show me the project notes and context.",
    });
    expect(taggedCard).toContain("Show me the project notes and context.");
    expect(taggedCard).not.toContain("[Optional -");
    expect(taggedCard).toContain('data-feature="Projects"');
    expect(
      beatFeature({
        id: "tagged",
        title: "Tagged",
        detail: "",
        example: "[Optional - Projects] Show me the project notes and context.",
      }),
    ).toBe("Projects");

    const html = renderRunbooksHtml();
    expect(html).toContain("ledgerly-runbooks-optional-features");
    expect(html).toContain("Optional features");
    expect(html).not.toContain("Include optional cards");
    expect(html).not.toContain("include-optional");
    for (const feature of ["Cloud Agents", "Projects", "Bugbot", "Automations"]) {
      expect(html).toContain(
        `.track[data-track="301"]:has(.feature-toggle[data-feature="${feature}"]:not(:checked)) .beat[data-feature="${feature}"] { display: none; }`,
      );
      expect(html).toContain(`data-feature="${feature}" checked`);
    }
    expect(html.match(/class="feature-toggle"/g)).toHaveLength(4);

    const trackMarkup = (id: string, nextId?: string) => {
      const marker = `<div class="track" data-track="${id}"`;
      const start = html.indexOf(marker);
      const end = nextId
        ? html.indexOf(`<div class="track" data-track="${nextId}"`, start + marker.length)
        : html.length;
      return html.slice(start, end);
    };
    const track101 = trackMarkup("101", "201");
    const track201 = trackMarkup("201", "301");
    const track301 = trackMarkup("301");
    expect(track101).toContain('data-beat="ask"');
    expect(track201).toContain('data-beat="rename-agent-1-all"');
    expect(track301).toContain('data-beat="plan-command-center"');
    expect(track101).not.toContain("feature-toggle");
    expect(track201).not.toContain("feature-toggle");
    expect(track301).toContain('class="feature-checklist"');
    for (const [id, feature] of Object.entries(optionalFeatures)) {
      expect(track301).toContain(`<article class="beat" data-beat="${id}" data-feature="${feature}">`);
      expect(beatFeature(beats301.find((entry) => entry.id === id)!)).toBe(feature);
    }
    expect(track301).toContain('<article class="beat" data-beat="open-local-agent">');
    expect(track301).toContain('<article class="beat" data-beat="linear-issue-fallback">');
    expect(track301).not.toContain('data-beat="linear-issue-fallback" data-feature=');
    expect(html).not.toContain("[Optional -");
  });

  it("renders say, then the do box, then the prompt, and keeps a do step between prompts", () => {
    const html = renderRunbooksHtml();
    const card = (id: string) => {
      const marker = `data-beat="${id}"`;
      const start = html.lastIndexOf("<article", html.indexOf(marker));
      const end = html.indexOf("</article>", start);
      return html.slice(start, end);
    };
    const before = (text: string, earlier: string, later: string) => {
      const earlierAt = text.indexOf(earlier);
      const laterAt = text.indexOf(later);
      expect(earlierAt, earlier).toBeGreaterThan(-1);
      expect(laterAt, later).toBeGreaterThan(-1);
      expect(earlierAt).toBeLessThan(laterAt);
    };

    expect(html).toContain(".do-box, pre {");
    expect(html).toContain("--indigo-soft: #eef2ff;");
    expect(html).toContain(".tabs a, label.feature-option {");
    expect(html).not.toContain("steps-label");
    expect(html).not.toContain(">Steps<");

    const ask = card("ask");
    before(ask, 'class="do-box"', "/ask Tell me what this application does in 3 sentences");
    expect(ask).toContain("<ul>");
    expect(ask).not.toContain("<ol>");
    expect(ask).not.toContain('class="say"');
    expect(ask.slice(ask.indexOf('class="do-box"'), ask.indexOf("</div>", ask.indexOf('class="do-box"')))).not.toContain("Copy");

    const hand = card("show-problem-by-hand");
    before(hand, "Focus is the control", 'class="do-box"');
    before(hand, 'class="do-box"', "Open Browser to http://localhost:43173/invoices.");
    before(hand, "Open Browser to http://localhost:43173/invoices.", "Press Tab a few times on the invoices page.");
    expect(hand.indexOf('class="say"')).toBeLessThan(hand.indexOf("<ol>"));
    const handList = hand.slice(hand.indexOf("<ol>"), hand.indexOf("</ol>"));
    expect(handList).not.toContain("Focus is the control");
    expect(handList).not.toContain("Watch the page");

    const cloud = card("optional-cloud-agent");
    expect(cloud).toContain('class="do-box"');
    expect(cloud).toContain("<ol>");
    before(cloud, "Click Continue on Cloud", "Click Include Changes");
    expect(cloud).not.toContain('class="paste"');
    expect(cloud).not.toContain(">Copy<");

    const trigger = card("optional-trigger-automation");
    before(trigger, "Opening any PR triggers", "Start a new local agent.");
    before(trigger, "Start a new local agent.", "Open the PR for the accessibility test suite fixes");
    before(trigger, "Open the PR for the accessibility test suite fixes", "Run the accessibility test suite");

    const consolidate = card("consolidate-pr");
    before(consolidate, "Move finished worktrees back deliberately.", "Open the PR. Show the summary");
    before(consolidate, "Open the PR. Show the summary", "Consolidate the completed tasks");

    const risk = card("review-highest-risk");
    before(risk, "The change reviewer subagent clears the noise", "Open the highest-risk change");
    before(risk, "Open the highest-risk change", "/ask Which change");

    const between = renderBeatHtml({
      id: "between",
      title: "Between",
      detail: "First do step.",
      promptType: "reusable",
      example: "/ask first prompt",
      after: [
        { kind: "do", text: "Middle one." },
        { kind: "do", text: "Middle two." },
        { kind: "prompt", promptType: "adaptable", text: "Second prompt." },
      ],
    });
    before(between, "First do step.", "/ask first prompt");
    before(between, "/ask first prompt", "Middle one.");
    before(between, "Middle one.", "Middle two.");
    before(between, "Middle two.", "Second prompt.");
    const firstPrompt = between.indexOf("/ask first prompt");
    const secondPrompt = between.indexOf("Second prompt.");
    const middle = between.slice(firstPrompt, secondPrompt);
    expect(middle).toContain("<ol>");
    expect(middle).toContain("Middle one.");
    expect(middle).toContain("Middle two.");
    expect(between.slice(0, firstPrompt)).not.toContain("Middle one.");
  });

  it("keeps the static runbooks page in sync with the beats", () => {
    const committed = readFileSync(join(root, STATIC_RUNBOOKS_PATH), "utf8");
    expect(committed, "run `npm run runbooks:export` to regenerate runbooks.html").toBe(
      renderRunbooksHtml(),
    );
    for (const track of RUNBOOK_TRACKS) {
      expect(committed).toContain(`data-track="${track.id}"`);
    }
    expect(committed).not.toMatch(/<(link|script)[^>]+(href|src)=/);
    expect(committed).toContain(
      'window.parent.postMessage({ type: "runbooks:track", track: id }, "*")',
    );
    expect(committed).toContain('data.type === "runbooks:set-track"');
    expect(committed).toContain("ids.indexOf(data.track) !== -1");
    expect(committed).toContain("show(data.track, false)");
    expect(committed).toContain("Canvas srcdoc pages cannot update their about:srcdoc URL.");
  });

  it("does not resolve the retired advanced track", () => {
    expect(RUNBOOK_TRACKS).toHaveLength(3);
    for (const retired of ["advanced", "Advanced"]) {
      expect(RUNBOOK_TRACKS.find((track) => track.id === retired)).toBeUndefined();
    }
  });

  it("gives each section a unique id and no Demo N labels", () => {
    for (const track of RUNBOOK_TRACKS) {
      const sectionIds = track.sections.map((section) => section.id);
      expect(sectionIds).toEqual([...new Set(sectionIds)]);
      for (const section of track.sections) {
        expect(section.title).not.toMatch(/^Demo \d+$/);
      }
    }
  });

  it("points docs, skills, and rules at runbooks.html and documents the 101, 201, and 301 tracks", () => {
    const files = {
      readme: readFileSync(join(root, "README.md"), "utf8"),
      howto: readFileSync(join(root, "demo-howto.md"), "utf8"),
      agents: readFileSync(join(root, "AGENTS.md"), "utf8"),
      rule: readFileSync(join(root, ".cursor/rules/ledgerly.mdc"), "utf8"),
      skill: readFileSync(join(root, ".cursor/skills/choose-cursor-workflow/SKILL.md"), "utf8"),
      cloud: readFileSync(join(root, ".cursor/skills/hand-to-cloud-agent/SKILL.md"), "utf8"),
      reset: readFileSync(join(root, ".cursor/skills/reset-demo-state/SKILL.md"), "utf8"),
    };

    for (const [name, contents] of Object.entries(files)) {
      expect(contents, `${name} still cites lib/workflows/meta.ts`).not.toContain(
        "lib/workflows/meta.ts",
      );
      expect(contents, `${name} still references a retired Advanced track`).not.toMatch(
        /Advanced track/,
      );
    }

    expect(files.readme).toContain("runbooks.html?track=201");
    expect(files.howto).toContain("runbooks.html?track=201");
    expect(files.readme).toContain("runbooks.html?track=301");
    expect(files.howto).toContain("runbooks.html?track=301");
    expect(files.skill).toContain("runbooks.html?track=301");
    expect(files.agents).toContain("runbooks.html?track=301");
    expect(files.rule).toContain("runbooks.html?track=301");
    expect(files.skill).toContain("runbooks.html");
    for (const [name, contents] of Object.entries(files)) {
      expect(contents, `${name} still sends readers to an in-app /runbooks route`).not.toMatch(
        /\/runbooks\//,
      );
    }
    expect(files.agents).toContain("runbooks/meta.ts");
    expect(files.rule).toContain("runbooks/meta.ts");
    expect(files.skill).toContain("runbooks/meta.ts");
    expect(files.cloud).toContain("Cloud Agent");

    const start = readFileSync(join(root, ".cursor/skills/start-ledgerly/SKILL.md"), "utf8");
    expect(start).toContain("http://localhost:43173");
    expect(start).toContain("runbooks.html");
    expect(start).toContain("WriteCanvas");
    expect(start).toContain("srcDoc");
    expect(start).toContain("useCanvasState");
    expect(start).toContain("runbooks:set-track");
    expect(start).toContain("canvas_id");
    expect(start).toContain("event.source === iframe.contentWindow");
    expect(start).toContain(
      'iframe.contentWindow.postMessage({ type: "runbooks:set-track", track }, "*")',
    );
    expect(start).toContain("On the iframe `load` event only");
    expect(start).toContain('a srcdoc frame reports `"null"`');
    expect(start).not.toContain("whenever the persisted track changes");
    expect(start).not.toContain("file://");
    expect(start).not.toContain("http://localhost:43173/runbooks");

    // Shipped-suite count must stay consistent across the docs that cite it
    // (see the sync rule in .cursor/rules/ledgerly.mdc). Assert the
    // "1 failed / <n> passed" format is present in each and that every file
    // agrees, so changing the count only means updating the docs — not this
    // assertion.
    const countPattern = /1 failed \/ (\d+) passed/g;
    const countSources: Record<string, string> = {
      readme: files.readme,
      howto: files.howto,
      agents: files.agents,
      reset: files.reset,
      plan: readFileSync(join(root, ".cursor/plans/resolve-dispute.md"), "utf8"),
    };
    const passedCounts = new Set<string>();
    for (const [name, contents] of Object.entries(countSources)) {
      const matches = [...contents.matchAll(countPattern)].map((match) => match[1]);
      expect(matches.length, `${name} is missing a "1 failed / <n> passed" count`).toBeGreaterThan(
        0,
      );
      for (const passed of matches) passedCounts.add(passed);
    }
    expect(
      passedCounts.size,
      `shipped-suite count disagrees across docs: ${[...passedCounts].join(", ")}`,
    ).toBe(1);

    expect(files.reset).toContain("stage-linear");
    expect(files.reset).not.toContain("stage-linear-201");
    expect(files.reset).toContain("FIELD_DEMO_ISSUES");
    expect(files.reset).toContain("Canceled");
    expect(files.agents).toContain("stage-linear");
    expect(files.agents).not.toContain("stage-linear-201");
    expect(files.rule).toContain("stage-linear");
    expect(files.rule).not.toContain("stage-linear-201");
    expect(files.skill).toContain("stage-linear");
    expect(files.skill).not.toContain("stage-linear-201");
    expect(files.howto).toContain("stage-linear");
    expect(files.howto).not.toContain("stage-linear-201");
    expect(files.readme).toContain("Settings → Teams → New team");
    expect(files.readme).toContain("Make team private");
    expect(files.howto).toContain("Settings → Teams → New team");
    expect(files.howto).toContain("Make team private");
    expect(files.agents).toContain("Settings → Teams → New team");
    expect(files.agents).toContain("Make team private");
    expect(files.rule).toContain("Make team private");
    expect(files.readme).toContain("settings/teams/LY");
    expect(files.howto).toContain("settings/teams/LY");
    expect(files.agents).toContain("settings/teams/LY");
  });

  it("stage-linear and reset-demo-state confirm the team before writing", () => {
    const stage = readFileSync(join(root, ".cursor/skills/stage-linear/SKILL.md"), "utf8");
    const reset = readFileSync(join(root, ".cursor/skills/reset-demo-state/SKILL.md"), "utf8");

    expect(stage, "stage accepts a public team").toContain("Public and private teams are both valid");
    expect(stage, "stage must not ban public teams").not.toContain("Never stage onto a public");
    expect(reset, "reset accepts a public team").toContain("Public and private teams are both valid");
    expect(reset, "reset must not ban public-team teardown").not.toContain("Never cancel Linear issues on a public");

    for (const [name, contents] of Object.entries({ stage, reset })) {
      expect(contents, `${name} is missing a confirm-team step`).toMatch(/confirm/i);
      expect(contents, `${name} is missing the team settings URL`).toContain("settings/teams");
      expect(contents, `${name} should refuse to guess the team`).toMatch(/assume|guess/i);
    }

    // reset cancels the board but no longer unlinks issues from the project
    expect(reset).toContain("Canceled");
    expect(reset, "reset should no longer unlink issues").not.toContain("unlink from the board");
    expect(reset, "reset should leave issues linked").toContain("Leave the issue linked");
    expect(reset, "reset description should not gate Linear on this session staging").not.toMatch(
      /cancel Linear issues if this demo staged them/,
    );
    expect(reset, "reset should offer Linear teardown when MCP is connected").toMatch(
      /whenever the Linear MCP is connected/,
    );
    expect(reset, "reset must delete git branches from the 201 standard-bug-fix beat").toContain(
      "Demo-beat git branches",
    );
    expect(reset, "reset must switch off the demo branch").toContain("git checkout main");
    expect(reset, "reset must delete the local demo-beat branch").toContain("git branch -D");
    expect(reset, "reset must delete a pushed demo-beat branch").toContain(
      "git push origin --delete",
    );
    expect(reset, "reset must restore invoice and dispute pages that read state=").toContain(
      "app/invoices/page.tsx",
    );
    expect(reset).toContain(".cursor/agents/accessibility-auditor.md");
    expect(reset).toContain("301 Reviewer automation");
    const resetScript = readFileSync(join(root, "scripts/demo-reset.ts"), "utf8");
    expect(resetScript).toContain('".cursor/agents/accessibility-auditor.md"');
    expect(readFileSync(join(root, "demo-howto.md"), "utf8")).toContain(
      "npm run demo:session -- record project-path .cursor/agents/accessibility-auditor.md",
    );
    expect(reset, "reset must restore dispute queue pages").toContain("app/disputes/page.tsx");

    expect(stage, "stage must say the WCAG audit is a manual keyboard walkthrough").toContain(
      "manual keyboard walkthrough",
    );
    expect(stage).toContain("UI changes need a WCAG 2.2 AA accessibility audit");
    expect(stage, "stage must not cancel the WCAG walkthrough as an extra").toContain(
      "Never cancel the WCAG keyboard-walkthrough issue as an extra",
    );
    expect(stage, "stage must not create the WCAG issue on a clean board").toContain(
      "Do not create this title when it is missing",
    );

    // stage-linear reactivates a torn-down board on the next run
    expect(stage).toMatch(/reactivate|reopen|reopens/i);
    expect(stage, "stage must create a new issue instead of unarchiving").toMatch(
      /Never unarchive an issue/,
    );
    // confirm counts only active issues so canceled linked extras do not fail the check
    expect(stage, "stage confirm must count only active issues").toMatch(
      /active.*non-`?Canceled`?|non-`?Canceled`?.*active/i,
    );
    expect(stage, "stage confirm must not require every linked issue to be catalog").not.toContain(
      "list_issues` on the project returns exactly the three catalog titles",
    );
  });
});
