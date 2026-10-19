import type { DemoSection } from "@/runbooks/types";

export const RUNBOOK_SECTIONS_301 = [
  {
    id: "break-down-tasks",
    title: "How do you orchestrate tasks across agents?",
    beats: [
      {
        id: "plan-command-center",
        title: "Plan the command center in a separate agent",
        promptType: "adaptable",
        detail: "Start a new agent for the command center plan.",
        example:
          "/plan the collections command center from its Linear issues. List the tasks, the files each touches, and the open questions.",
      },
      {
        id: "open-local-agent",
        title: "Start the keyboard walkthrough agent",
        promptType: "none",
        detail: "Start a new agent for the keyboard walkthrough.",
      },
      {
        id: "show-problem-by-hand",
        title: "Show the problem by hand.",
        promptType: "none",
        detail:
          "Open Browser to http://localhost:43173/invoices.\nFocus is the control the keyboard is on right now. When you press Tab, focus moves to the next button, link, or field. A visible outline usually shows where it is, so a keyboard user always knows what Enter will do.\nPress Tab a few times on the invoices page.\nWatch the page. After a couple of presses the outline disappears. Focus is still on something, but I can't tell what, so a keyboard user is now lost.",
      },
      {
        id: "create-accessibility-manual-reviewer",
        title:
          "Checking every page like this by hand takes a lot of time and judgment, so let's build a subagent that does it for us.",
        promptType: "adaptable",
        detail: "",
        example:
          "/create-subagent accessibility-manual-reviewer that walks pages by keyboard in the Browser, since CI runs automated tests. Report tab order, focus, trap, Escape, and navigation failures with screenshots. Set model: fast.",
      },
      {
        id: "optional-cloud-agent",
        title: "Optional: Move to a Cloud Agent",
        optional: true,
        promptType: "none",
        detail: "Click Continue on Cloud to move this to a Cloud Agent. Click Include Changes.",
      },
      {
        id: "multitask-walkthroughs",
        title: "Show /multitask for small coordinated jobs.",
        promptType: "adaptable",
        detail: "",
        example:
          "/multitask Run these in parallel to find what I need to fix: the accessibility-manual-reviewer subagent on the invoices page, the accessibility test suite, and the application test suite.",
      },
      {
        id: "review-subagents",
        title: "Review the subagents",
        promptType: "none",
        detail: "Watch the Working tab.",
      },
      {
        id: "summarize-subagents",
        title: "Check the subagent output",
        promptType: "adaptable",
        detail: "",
        example: "Give me a one-sentence summary for each subagent.",
      },
      {
        id: "linear-issue-fallback",
        title: "Fallback: reference repo issues",
        promptType: "adaptable",
        detail: "If an agent cannot access the Linear MCP server, use the issue descriptions in the repository.",
        example: "Reference issues from @linear-field-demo.ts instead of Linear",
      },
    ],
  },
  {
    id: "plan-to-pr",
    title: "How do multiple agents go from plan to reviewable code?",
    beats: [
      {
        id: "optional-start-project",
        title: "Optional: Start a new Project",
        optional: true,
        promptType: "none",
        detail: "Start a new Project. Name it {INSERT COMPANY HERE, default is Ledgerly}.",
      },
      {
        id: "optional-stage-project",
        title: "Optional: Stage the Project",
        optional: true,
        promptType: "adaptable",
        detail: "",
        example: "Run each agent in its own worktree to avoid conflicts, and parallelize where possible.",
      },
      {
        id: "open-plan-agent",
        title: "Open a new agent",
        promptType: "none",
        detail: "Open a new local agent. Optional: Run the following prompts from the Project.",
      },
      {
        id: "plan-remediation",
        title: "Start a plan to fix the walkthrough failures on a separate worktree",
        promptType: "adaptable",
        detail: "",
        example:
          "/plan fixes for the keyboard failures on invoices, collections, and settings in @.cursor/plans/keyboard-walkthrough-audit.md. One task per failure, mark parallel tasks, and use a separate worktree with auto-approved changes.",
      },
      {
        id: "review-plan",
        title: "Review the plan",
        promptType: "none",
        detail: "Review the plan.",
      },
      {
        id: "build-plan",
        title: "Build the plan",
        promptType: "none",
        detail: "Build locally.",
      },
      {
        id: "optional-build-cloud",
        title: "Optional: Build with Cloud Agents",
        optional: true,
        promptType: "none",
        detail: "Build the plan with Cloud Agents.",
      },
      {
        id: "side-chat",
        title: "Open a side chat",
        promptType: "reusable",
        detail: "",
        example: "/side",
      },
      {
        id: "ask-subagent-progress",
        title: "Ask what the first subagent is remediating",
        promptType: "reusable",
        detail:
          "If you want to know what a subagent is doing, you can open a side chat and ask without blocking the coordinator.",
        example: "/ask What is the first subagent remediating? Answer with the finding and the files it changes.",
      },
      {
        id: "consolidate-pr",
        title: "Consolidate and open a reviewable PR",
        promptType: "reusable",
        detail: "Open the PR. Show the summary a coworker would read first.",
        example:
          "Consolidate the completed tasks into one branch so reviewers get one PR. Open a PR with what each task changed and what a human should verify.",
      },
      {
        id: "optional-project-notes",
        title: "Optional: Show project notes",
        optional: true,
        promptType: "adaptable",
        detail: "",
        example: "Show me the project notes and context.",
      },
    ],
  },
  {
    id: "scale-reviews",
    title: "How do you scale AI code reviews?",
    beats: [
      {
        id: "checkout-fixes-branch",
        title: "Check out the keyboard fixes branch",
        promptType: "adaptable",
        detail: "Open a new local agent.",
        example: "Check out the branch for the keyboard fixes PR.",
      },
      {
        id: "run-reviewer-subagent",
        title: "Run the change reviewer subagent",
        promptType: "reusable",
        detail: "",
        example:
          "Use the change reviewer subagent to review the remediation PR. List each issue with its file, line, and severity.",
      },
      {
        id: "check-closer-inspection",
        title: "Identify changes for closer inspection",
        promptType: "none",
        detail: "Check the change reviewer’s output for any issues requiring closer inspection.",
      },
      {
        id: "review-highest-risk",
        title: "Review the high-risk changes",
        promptType: "reusable",
        detail: "Open the highest-risk change and read it line by line.",
        example: "/ask Which change in this PR has the highest risk? List the files and lines I need to review.",
      },
      {
        id: "optional-bugbot",
        title: "Optional: Run Bugbot",
        optional: true,
        promptType: "reusable",
        detail: "",
        example: "/review-bugbot this remediation PR",
      },
    ],
  },
  {
    id: "share-ownership",
    title: "How do coworkers share ownership safely?",
    beats: [
      {
        id: "open-ownership-agent",
        title: "Open a new agent",
        promptType: "none",
        detail: "Open a new local agent.",
      },
      {
        id: "shift-left-findings",
        title: "Identify the most reliable fix",
        promptType: "reusable",
        detail: "",
        example:
          "Turn repeat findings from this PR's review comments and change reviewer into reusable fixes so they stop recurring. Draft the most deterministic fix for each: a rule, skill, subagent, test, or human check.",
      },
      {
        id: "optional-reviewer-automation",
        title: "Optional: Create a Reviewer automation",
        optional: true,
        promptType: "none",
        detail:
          "Go to the Automations tab. Click New Automation. Name it Reviewer. Select the demo repository. Click Triggers > PR opened, then select the demo repository and set the author to Anyone. Add “Use the change reviewer subagent to review this PR and comment with each issue's file, line, and severity.” to agent instructions. Add “Comment on Pull Request” to tools. Click Save.",
      },
      {
        id: "optional-trigger-automation",
        title: "Optional: Trigger the PR Automation",
        optional: true,
        promptType: "adaptable",
        detail:
          "Start a new local agent. Opening any PR triggers the Reviewer Automation, so I'll create one and watch the check run. Open the PR for the accessibility test suite fixes and review the status check for Automation: Reviewer.",
        example:
          "Run the accessibility test suite and fix its failures on a separate worktree. Open a PR when done.",
      },
      {
        id: "return-to-plan",
        title: "Return to the command center plan",
        promptType: "none",
        detail: "Open the command center planning agent in the Agent Window. Don’t start a new plan.",
      },
      {
        id: "list-conflict-files",
        title: "Check other PRs for files and comments that conflict with the next project",
        promptType: "adaptable",
        detail: "",
        example:
          "Review the open PRs in this repository and flag any that have file conflicts or comments that may affect the collections command center feature.",
      },
    ],
  },
] as const satisfies readonly DemoSection[];
