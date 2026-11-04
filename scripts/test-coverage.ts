import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const resultsDir = path.join(root, "test-results");
const resultsPath = path.join(resultsDir, "vitest.json");
const summaryPath = path.join(root, "coverage", "coverage-summary.json");

const plantedFailures = [
  {
    file: "tests/suggested-credit-api.test.ts",
    title: "uses the current API version",
  },
  {
    file: "tests/filter-pills.test.ts",
    title: "writes the status query the invoice and dispute pages read",
  },
];

type AssertionResult = {
  status: string;
  title: string;
};

type FileResult = {
  name: string;
  assertionResults: AssertionResult[];
};

type VitestJson = {
  numFailedTests: number;
  numPassedTests: number;
  testResults: FileResult[];
};

type CoverageSummary = {
  total?: {
    lines?: { pct?: number };
  };
};

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function relativeFile(file: string) {
  return path.relative(root, file).split(path.sep).join("/");
}

function failureKey(file: string, title: string) {
  return `${file}::${title}`;
}

mkdirSync(resultsDir, { recursive: true });

const vitestBin = path.join(root, "node_modules", ".bin", "vitest");
const child = spawnSync(
  vitestBin,
  [
    "run",
    "--coverage",
    "--reporter=default",
    "--reporter=json",
    `--outputFile.json=${resultsPath}`,
  ],
  { cwd: root, env: process.env, stdio: "inherit" },
);

if (!existsSync(summaryPath)) {
  fail("Coverage summary was not written at coverage/coverage-summary.json.");
}

const summary = JSON.parse(readFileSync(summaryPath, "utf8")) as CoverageSummary;
const linesPct = summary.total?.lines?.pct;
if (typeof linesPct !== "number") {
  fail("Coverage summary is missing total.lines.pct.");
}

console.log(`Application line coverage: ${linesPct}%`);

const demoOverride = ["DEMO_BUGS", "DEMO_SCENARIO", "DEMO_BUGS_FILE"].some(
  (key) => process.env[key] !== undefined,
);
if (demoOverride) {
  process.exit(child.status ?? 1);
}

if (!existsSync(resultsPath)) {
  fail("Vitest results were not written at test-results/vitest.json.");
}

const results = JSON.parse(readFileSync(resultsPath, "utf8")) as VitestJson;
const failed = results.testResults.flatMap((file) =>
  file.assertionResults
    .filter((assertion) => assertion.status === "failed")
    .map((assertion) => ({
      file: relativeFile(file.name),
      title: assertion.title,
    })),
);

console.log(`Suite: ${results.numFailedTests} failed / ${results.numPassedTests} passed`);

const actual = new Set(failed.map((item) => failureKey(item.file, item.title)));
const expected = new Set(plantedFailures.map((item) => failureKey(item.file, item.title)));
const plantedOnly =
  actual.size === expected.size && [...expected].every((key) => actual.has(key));

if (!plantedOnly) {
  console.error("Coverage run failed. The failures were not the two planted tests.");
  if (failed.length === 0) {
    console.error("- no failing tests");
  }
  for (const item of failed) {
    console.error(`- ${item.file} — ${item.title}`);
  }
  process.exit(child.status && child.status !== 0 ? child.status : 1);
}

console.log("Planted failures only:");
for (const item of plantedFailures) {
  console.log(`- ${item.file} — ${item.title}`);
}
process.exit(0);
