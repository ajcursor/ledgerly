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
} from "@/runbooks/meta";
import { STATIC_RUNBOOKS_PATH, renderRunbooksHtml } from "@/runbooks/static-page";

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
    expect(RUNBOOK_SECTIONS_301.map((section) => section.beats.length)).toEqual([9, 11, 5, 6]);
    expect(RUNBOOK_SECTIONS_301.flatMap((section) => section.beats.map((entry) => entry.id))).toEqual(
      beats301.map((entry) => entry.id),
    );
    expect(runbookBeatSequence("301")).toBe(
      "Plan the command center in a separate agent → Start the keyboard walkthrough agent → Show the problem by hand. → Checking every page like this by hand takes a lot of time and judgment, so let's build a subagent that does it for us. → Optional: Move to a Cloud Agent → Show /multitask for small coordinated jobs. → Review the subagents → Check the subagent output → Fallback: reference repo issues → Optional: Start a new Project → Optional: Stage the Project → Open a new agent → Start a plan to fix the walkthrough failures on a separate worktree → Review the plan → Build the plan → Optional: Build with Cloud Agents → Open a side chat → Ask what the first subagent is remediating → Consolidate and open a reviewable PR → Optional: Show project notes → Check out the keyboard fixes branch → Run the change reviewer subagent → Identify changes for closer inspection → Review the high-risk changes → Optional: Run Bugbot → Open a new agent → Identify the most reliable fix → Optional: Create a Reviewer automation → Optional: Trigger the PR Automation → Return to the command center plan → Check other PRs for files and comments that conflict with the next project",
    );

    // 201-style mapping: Do is verbatim in detail, Prompt in example, a Say before a prompt is copied into detail, and a Say after a prompt is omitted.
    expect(beats301.map(({ id, title, promptType, detail, example, optional }) => ({ id, title, promptType, detail, example, optional }))).toEqual([
      {
        "id": "plan-command-center",
        "title": "Plan the command center in a separate agent",
        "promptType": "adaptable",
        "detail": "Start a new agent for the command center plan.",
        "example": "/plan the collections command center from its Linear issues. List the tasks, the files each touches, and the open questions."
      },
      {
        "id": "open-local-agent",
        "title": "Start the keyboard walkthrough agent",
        "promptType": "none",
        "detail": "Start a new agent for the keyboard walkthrough."
      },
      {
        "id": "show-problem-by-hand",
        "title": "Show the problem by hand.",
        "promptType": "none",
        "detail": "Open Browser to http://localhost:43173/invoices.\nFocus is the control the keyboard is on right now. When you press Tab, focus moves to the next button, link, or field. A visible outline usually shows where it is, so a keyboard user always knows what Enter will do.\nPress Tab a few times on the invoices page.\nWatch the page. After a couple of presses the outline disappears. Focus is still on something, but I can't tell what, so a keyboard user is now lost."
      },
      {
        "id": "create-accessibility-manual-reviewer",
        "title": "Checking every page like this by hand takes a lot of time and judgment, so let's build a subagent that does it for us.",
        "promptType": "adaptable",
        "detail": "",
        "example": "/create-subagent accessibility-manual-reviewer that walks pages by keyboard in the Browser, since CI runs automated tests. Report tab order, focus, trap, Escape, and navigation failures with screenshots. Set model: fast."
      },
      {
        "id": "optional-cloud-agent",
        "title": "Optional: Move to a Cloud Agent",
        "promptType": "none",
        "detail": "Click Continue on Cloud to move this to a Cloud Agent. Click Include Changes.",
        "optional": true
      },
      {
        "id": "multitask-walkthroughs",
        "title": "Show /multitask for small coordinated jobs.",
        "promptType": "adaptable",
        "detail": "",
        "example": "/multitask Run these in parallel to find what I need to fix: the accessibility-manual-reviewer subagent on the invoices page, the accessibility test suite, and the application test suite."
      },
      {
        "id": "review-subagents",
        "title": "Review the subagents",
        "promptType": "none",
        "detail": "Watch the Working tab."
      },
      {
        "id": "summarize-subagents",
        "title": "Check the subagent output",
        "promptType": "adaptable",
        "detail": "",
        "example": "Give me a one-sentence summary for each subagent."
      },
      {
        "id": "linear-issue-fallback",
        "title": "Fallback: reference repo issues",
        "promptType": "adaptable",
        "detail": "If an agent cannot access the Linear MCP server, use the issue descriptions in the repository.",
        "example": "Reference issues from @linear-field-demo.ts instead of Linear"
      },
      {
        "id": "optional-start-project",
        "title": "Optional: Start a new Project",
        "promptType": "none",
        "detail": "Start a new Project. Name it {INSERT COMPANY HERE, default is Ledgerly}.",
        "optional": true
      },
      {
        "id": "optional-stage-project",
        "title": "Optional: Stage the Project",
        "promptType": "adaptable",
        "detail": "",
        "example": "Run each agent in its own worktree to avoid conflicts, and parallelize where possible.",
        "optional": true
      },
      {
        "id": "open-plan-agent",
        "title": "Open a new agent",
        "promptType": "none",
        "detail": "Open a new local agent. Optional: Run the following prompts from the Project."
      },
      {
        "id": "plan-remediation",
        "title": "Start a plan to fix the walkthrough failures on a separate worktree",
        "promptType": "adaptable",
        "detail": "",
        "example": "/plan fixes for the keyboard failures on invoices, collections, and settings in @.cursor/plans/keyboard-walkthrough-audit.md. One task per failure, mark parallel tasks, and use a separate worktree with auto-approved changes."
      },
      {
        "id": "review-plan",
        "title": "Review the plan",
        "promptType": "none",
        "detail": "Review the plan."
      },
      {
        "id": "build-plan",
        "title": "Build the plan",
        "promptType": "none",
        "detail": "Build locally."
      },
      {
        "id": "optional-build-cloud",
        "title": "Optional: Build with Cloud Agents",
        "promptType": "none",
        "detail": "Build the plan with Cloud Agents.",
        "optional": true
      },
      {
        "id": "side-chat",
        "title": "Open a side chat",
        "promptType": "reusable",
        "detail": "",
        "example": "/side"
      },
      {
        "id": "ask-subagent-progress",
        "title": "Ask what the first subagent is remediating",
        "promptType": "reusable",
        "detail": "If you want to know what a subagent is doing, you can open a side chat and ask without blocking the coordinator.",
        "example": "/ask What is the first subagent remediating? Answer with the finding and the files it changes."
      },
      {
        "id": "consolidate-pr",
        "title": "Consolidate and open a reviewable PR",
        "promptType": "reusable",
        "detail": "Open the PR. Show the summary a coworker would read first.",
        "example": "Consolidate the completed tasks into one branch so reviewers get one PR. Open a PR with what each task changed and what a human should verify."
      },
      {
        "id": "optional-project-notes",
        "title": "Optional: Show project notes",
        "promptType": "adaptable",
        "detail": "",
        "example": "Show me the project notes and context.",
        "optional": true
      },
      {
        "id": "checkout-fixes-branch",
        "title": "Check out the keyboard fixes branch",
        "promptType": "adaptable",
        "detail": "Open a new local agent.",
        "example": "Check out the branch for the keyboard fixes PR."
      },
      {
        "id": "run-reviewer-subagent",
        "title": "Run the change reviewer subagent",
        "promptType": "reusable",
        "detail": "",
        "example": "Use the change reviewer subagent to review the remediation PR. List each issue with its file, line, and severity."
      },
      {
        "id": "check-closer-inspection",
        "title": "Identify changes for closer inspection",
        "promptType": "none",
        "detail": "Check the change reviewer’s output for any issues requiring closer inspection."
      },
      {
        "id": "review-highest-risk",
        "title": "Review the high-risk changes",
        "promptType": "reusable",
        "detail": "Open the highest-risk change and read it line by line.",
        "example": "/ask Which change in this PR has the highest risk? List the files and lines I need to review."
      },
      {
        "id": "optional-bugbot",
        "title": "Optional: Run Bugbot",
        "promptType": "reusable",
        "detail": "",
        "example": "/review-bugbot this remediation PR",
        "optional": true
      },
      {
        "id": "open-ownership-agent",
        "title": "Open a new agent",
        "promptType": "none",
        "detail": "Open a new local agent."
      },
      {
        "id": "shift-left-findings",
        "title": "Identify the most reliable fix",
        "promptType": "reusable",
        "detail": "",
        "example": "Turn repeat findings from this PR's review comments and change reviewer into reusable fixes so they stop recurring. Draft the most deterministic fix for each: a rule, skill, subagent, test, or human check."
      },
      {
        "id": "optional-reviewer-automation",
        "title": "Optional: Create a Reviewer automation",
        "promptType": "none",
        "detail": "Go to the Automations tab. Click New Automation. Name it Reviewer. Select the demo repository. Click Triggers > PR opened, then select the demo repository and set the author to Anyone. Add “Use the change reviewer subagent to review this PR and comment with each issue's file, line, and severity.” to agent instructions. Add “Comment on Pull Request” to tools. Click Save.",
        "optional": true
      },
      {
        "id": "optional-trigger-automation",
        "title": "Optional: Trigger the PR Automation",
        "promptType": "adaptable",
        "detail": "Start a new local agent. Opening any PR triggers the Reviewer Automation, so I'll create one and watch the check run. Open the PR for the accessibility test suite fixes and review the status check for Automation: Reviewer.",
        "example": "Run the accessibility test suite and fix its failures on a separate worktree. Open a PR when done.",
        "optional": true
      },
      {
        "id": "return-to-plan",
        "title": "Return to the command center plan",
        "promptType": "none",
        "detail": "Open the command center planning agent in the Agent Window. Don’t start a new plan."
      },
      {
        "id": "list-conflict-files",
        "title": "Check other PRs for files and comments that conflict with the next project",
        "promptType": "adaptable",
        "detail": "",
        "example": "Review the open PRs in this repository and flag any that have file conflicts or comments that may affect the collections command center feature."
      }
    ]);

    expect(beats301).toHaveLength(31);
    expect(beats301.every((entry) => entry.promptType !== undefined)).toBe(true);
    expect(
      beats301.filter((entry) => entry.promptType === "none").every((entry) => entry.example === undefined),
    ).toBe(true);
    expect(beats301.filter((entry) => entry.example?.startsWith("/")).every((entry) => /^\/[a-z-]+/.test(entry.example ?? ""))).toBe(true);
  });

  it("hides 301 optional cards until Include optional cards is checked", () => {
    const optionalIds = [
      "optional-cloud-agent",
      "optional-start-project",
      "optional-stage-project",
      "optional-build-cloud",
      "optional-project-notes",
      "optional-bugbot",
      "optional-reviewer-automation",
      "optional-trigger-automation",
    ];
    expect(beats301.filter((entry) => entry.optional).map((entry) => entry.id)).toEqual(optionalIds);
    expect(beats101.some((entry) => entry.optional)).toBe(false);
    expect(beats201.some((entry) => entry.optional)).toBe(false);
    for (const id of optionalIds) {
      expect(beats301.find((entry) => entry.id === id)?.optional).toBe(true);
    }

    const html = renderRunbooksHtml();
    expect(html).toContain(
      ".track:not(:has(.include-optional:checked)) .beat.optional { display: none; }",
    );
    expect(html.match(/class="include-optional"/g)).toHaveLength(1);
    expect(html).toContain("Include optional cards");
    expect(html).toContain('params.get("optional") === "1"');
    expect(html).not.toMatch(/id="include-optional"[^>]*\bchecked\b/);

    const track101 = html.slice(html.indexOf('data-track="101"'), html.indexOf('data-track="201"'));
    const track201 = html.slice(html.indexOf('data-track="201"'), html.indexOf('data-track="301"'));
    const track301 = html.slice(html.indexOf('data-track="301"'));
    expect(track101).not.toContain("include-optional");
    expect(track201).not.toContain("include-optional");
    expect(track301).toContain('class="include-optional"');
    for (const id of optionalIds) {
      expect(track301).toContain(`<article class="beat optional" data-beat="${id}">`);
    }
    expect(track301).toContain('<article class="beat" data-beat="open-local-agent">');
    expect(track301).toContain('<article class="beat" data-beat="linear-issue-fallback">');
    expect(track301).not.toContain('<article class="beat optional" data-beat="linear-issue-fallback">');
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
