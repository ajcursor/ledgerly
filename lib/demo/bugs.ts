import { readFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import type { DemoErrorScenarioId } from "@/lib/demo/error-scenarios";

export type BugKind = "known" | "ambiguous" | "new";

export type DemoBug = {
  id: string;
  kind: BugKind;
  feature: string;
  description: string;
  /** What a customer would say to support. */
  symptoms: string;
  sentryScenario: DemoErrorScenarioId | null;
  /** Sentry fingerprint. Shared fingerprints are why two bugs can look like one issue. */
  sentryFingerprint: string | null;
  linearTitle: string;
  /** Vitest files that fail while this bug is enabled and pass while it is not. One test each. */
  redTests: readonly string[];
  defaultEnabled: boolean;
};

/**
 * Planted and switchable demo bugs.
 * With no selection env set, only the default-enabled bugs run — today's tree.
 */
export const DEMO_BUG_LIST: readonly DemoBug[] = [
  {
    id: "credit_v1",
    kind: "known",
    feature: "disputes",
    description:
      "The suggested-credit client calls deprecated v1, so dsp_1043 shows the raw $400 claim instead of the $249 Scale cap.",
    symptoms: "Suggested credit on dispute dsp_1043 is $400.00. The Scale invoice is $249.00.",
    sentryScenario: "suggested-credit-over-refund",
    sentryFingerprint: "suggested-credit-over-refund",
    linearTitle: "Suggested credit on dsp_1043 shows $400 instead of the $249 Scale cap",
    redTests: ["tests/suggested-credit-api.test.ts"],
    defaultEnabled: true,
  },
  {
    id: "filter_state",
    kind: "known",
    feature: "invoices",
    description:
      "Status pills write state= while the invoice and dispute pages read status, so Overdue and Needs review do not change the queue.",
    symptoms: "Clicking Overdue or Needs review does not filter the list.",
    sentryScenario: "invoice-filter",
    sentryFingerprint: "invoice-filter",
    linearTitle: "Clicking Overdue or Needs review does not filter the queue",
    redTests: [],
    defaultEnabled: true,
  },
  {
    id: "overdue_count",
    kind: "ambiguous",
    feature: "dashboard",
    description:
      "Dashboard aging uses the issue date, so open invoices that are not due yet count as overdue. The count disagrees with the Overdue queue and shares the invoice-filter fingerprint.",
    symptoms: "The dashboard overdue count is higher than the Overdue queue.",
    sentryScenario: "invoice-filter",
    sentryFingerprint: "invoice-filter",
    linearTitle: "Dashboard overdue count includes invoices that are not due yet",
    redTests: ["tests/overdue-count.test.ts"],
    defaultEnabled: false,
  },
  {
    id: "closed_dispute_credit",
    kind: "new",
    feature: "disputes",
    description:
      "Resolving an accepted or declined dispute posts the catalog credit again and reports the failure to Sentry with the customer attached.",
    symptoms:
      "Dispute dsp_1050 was already accepted, and the $99.00 Growth credit posted a second time. The resolve call errors.",
    sentryScenario: "closed-dispute-resolve",
    sentryFingerprint: "closed-dispute-resolve",
    linearTitle: "Resolving accepted dispute dsp_1050 posts the Growth credit again",
    redTests: ["tests/closed-dispute-credit.test.ts"],
    defaultEnabled: false,
  },
  {
    id: "line_rounding",
    kind: "new",
    feature: "invoices",
    description: "Prorated invoice lines round to the nearest dollar instead of the nearest cent.",
    symptoms: "A Growth seat occupied for 10 of 31 days shows $32.00 instead of $31.94.",
    sentryScenario: null,
    sentryFingerprint: null,
    linearTitle: "Prorated invoice lines round to the nearest dollar",
    redTests: ["tests/line-rounding.test.ts"],
    defaultEnabled: false,
  },
];

export type DemoBugId = (typeof DEMO_BUG_LIST)[number]["id"];

export const DEMO_SCENARIO_NAMES = ["known", "ambiguous", "new", "all"] as const;
export type DemoScenarioName = (typeof DEMO_SCENARIO_NAMES)[number];

const BUG_BY_ID = new Map(DEMO_BUG_LIST.map((bug) => [bug.id, bug]));

export const DEFAULT_DEMO_BUG_IDS: readonly DemoBugId[] = DEMO_BUG_LIST.filter((bug) => bug.defaultEnabled).map(
  (bug) => bug.id,
);

/**
 * Vitest tests in `npm test` on this tree. Red tests are included.
 * Reset's health check uses this with the enabled bugs' redTests.
 * Update it, and the "1 failed / N passed" citations, when the suite changes.
 */
export const SHIPPED_TEST_TOTAL = 66;

export function demoBug(id: string): DemoBug | null {
  return BUG_BY_ID.get(id) ?? null;
}

export function bugsForScenario(name: string): DemoBugId[] {
  if (!DEMO_SCENARIO_NAMES.includes(name as DemoScenarioName)) {
    throw new Error(`Unknown demo scenario "${name}". Use ${DEMO_SCENARIO_NAMES.join(", ")}.`);
  }
  if (name === "all") return DEMO_BUG_LIST.map((bug) => bug.id);
  return DEMO_BUG_LIST.filter((bug) => bug.kind === name).map((bug) => bug.id);
}

export function parseBugList(value: string): DemoBugId[] {
  const seen = new Set<DemoBugId>();
  for (const part of value.split(",")) {
    const id = part.trim();
    if (!id) continue;
    if (!BUG_BY_ID.has(id)) {
      throw new Error(`Unknown demo bug "${id}". Known bugs: ${DEMO_BUG_LIST.map((bug) => bug.id).join(", ")}.`);
    }
    seen.add(id);
  }
  return [...seen];
}

type BugFileDocument = {
  bugs?: unknown;
  scenario?: unknown;
};

export function loadDemoBugFile(file: string): DemoBugId[] {
  const root = resolve(process.cwd());
  const absolute = resolve(root, file);
  const inside = relative(root, absolute);
  if (inside.startsWith("..") || isAbsolute(inside) || inside.split(sep).includes("..")) {
    throw new Error(`Demo bug file must stay inside the project: ${file}`);
  }
  let parsed: BugFileDocument;
  try {
    parsed = JSON.parse(readFileSync(absolute, "utf8")) as BugFileDocument;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read demo bug file ${file}: ${message}`);
  }
  if (Array.isArray(parsed.bugs)) {
    return parseBugList(parsed.bugs.map((id) => String(id)).join(","));
  }
  if (typeof parsed.scenario === "string" && parsed.scenario) {
    return bugsForScenario(parsed.scenario);
  }
  throw new Error(`Demo bug file ${file} needs a bugs array or a scenario name.`);
}

type EnvLike = Record<string, string | undefined>;

function read(env: EnvLike, name: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(env, name) ? env[name] : undefined;
}

/** Resolve a bug set from an env map. DEMO_BUGS wins, then scenario, then a JSON file. */
export function enabledDemoBugIdsFrom(env: EnvLike): DemoBugId[] {
  const bugs = read(env, "DEMO_BUGS");
  if (bugs !== undefined) return parseBugList(bugs);

  const scenario = read(env, "DEMO_SCENARIO");
  if (scenario !== undefined && scenario !== "") return bugsForScenario(scenario);

  const file = read(env, "DEMO_BUGS_FILE");
  if (file) return loadDemoBugFile(file);

  const publicBugs = read(env, "NEXT_PUBLIC_DEMO_BUGS");
  if (publicBugs !== undefined) return parseBugList(publicBugs);

  const publicScenario = read(env, "NEXT_PUBLIC_DEMO_SCENARIO");
  if (publicScenario !== undefined && publicScenario !== "") return bugsForScenario(publicScenario);

  return [...DEFAULT_DEMO_BUG_IDS];
}

let cachedKey: string | null = null;
let cachedIds: DemoBugId[] | null = null;

function selectionKey(): string {
  return ["DEMO_BUGS", "DEMO_SCENARIO", "DEMO_BUGS_FILE", "NEXT_PUBLIC_DEMO_BUGS", "NEXT_PUBLIC_DEMO_SCENARIO"]
    .map((name) => (process.env[name] === undefined ? "\u0000" : process.env[name]))
    .join("\u0001");
}

export function enabledDemoBugIds(): DemoBugId[] {
  const key = selectionKey();
  if (cachedIds && cachedKey === key) return cachedIds;
  const ids = enabledDemoBugIdsFrom(process.env);
  cachedKey = key;
  cachedIds = ids;
  return ids;
}

export function isDemoBugEnabled(id: DemoBugId): boolean {
  return enabledDemoBugIds().includes(id);
}

export function expectedSuiteResult(enabledIds: readonly string[] = enabledDemoBugIds()): {
  failed: number;
  passed: number;
} {
  const enabled = new Set(enabledIds);
  const failed = DEMO_BUG_LIST.filter((bug) => enabled.has(bug.id)).reduce((total, bug) => total + bug.redTests.length, 0);
  return { failed, passed: SHIPPED_TEST_TOTAL - failed };
}

/** Match the `Tests` summary line from `vitest run`. */
export function suiteOutputMatches(output: string, expected: { failed: number; passed: number }): boolean {
  const line = output
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find((entry) => /^Tests\b/.test(entry));
  if (!line) return false;
  const passed = new RegExp(`\\b${expected.passed} passed\\b`).test(line);
  if (expected.failed === 0) {
    return passed && !/\d+ failed\b/.test(line);
  }
  return passed && new RegExp(`\\b${expected.failed} failed\\b`).test(line);
}

export function demoBugManifest() {
  return {
    defaultBugs: DEFAULT_DEMO_BUG_IDS,
    scenarios: Object.fromEntries(DEMO_SCENARIO_NAMES.map((name) => [name, bugsForScenario(name)])),
    bugs: DEMO_BUG_LIST.map((bug) => ({
      id: bug.id,
      kind: bug.kind,
      feature: bug.feature,
      description: bug.description,
      symptoms: bug.symptoms,
      sentryScenario: bug.sentryScenario,
      sentryFingerprint: bug.sentryFingerprint,
      linearTitle: bug.linearTitle,
      redTests: [...bug.redTests],
      defaultEnabled: bug.defaultEnabled,
    })),
  };
}

/** Env for a child `npm test` or `npm run dev` so server and browser see the same set. */
export function bugProcessEnv(enabledIds: readonly string[], base: EnvLike = process.env): NodeJS.ProcessEnv {
  const env = { ...base } as NodeJS.ProcessEnv;
  const list = enabledIds.join(",");
  env.DEMO_BUGS = list;
  env.NEXT_PUBLIC_DEMO_BUGS = list;
  delete env.DEMO_SCENARIO;
  delete env.DEMO_BUGS_FILE;
  delete env.NEXT_PUBLIC_DEMO_SCENARIO;
  return env;
}
