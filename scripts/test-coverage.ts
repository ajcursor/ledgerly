import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  demoOverrideActive,
  failedAssertions,
  isPlantedOnly,
  plantedFailures,
  type VitestJson,
} from "./coverage-gate";

const root = process.cwd();
const resultsDir = path.join(root, "test-results");
const resultsPath = path.join(resultsDir, "vitest.json");
const summaryPath = path.join(root, "coverage", "coverage-summary.json");

type CoverageSummary = {
  total?: {
    lines?: { pct?: number };
  };
};

function fail(message: string): never {
  console.error(message);
  process.exit(1);
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

if (demoOverrideActive(process.env)) {
  process.exit(child.status ?? 1);
}

if (!existsSync(resultsPath)) {
  fail("Vitest results were not written at test-results/vitest.json.");
}

const results = JSON.parse(readFileSync(resultsPath, "utf8")) as VitestJson;
const failed = failedAssertions(results, root);

console.log(`Suite: ${results.numFailedTests} failed / ${results.numPassedTests} passed`);

if (!isPlantedOnly(failed)) {
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
