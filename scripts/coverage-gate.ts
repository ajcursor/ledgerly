import path from "node:path";

export const plantedFailures = [
  {
    file: "tests/suggested-credit-api.test.ts",
    title: "uses the current API version",
  },
  {
    file: "tests/filter-pills.test.ts",
    title: "writes the status query the invoice and dispute pages read",
  },
];

export type AssertionResult = {
  status: string;
  title: string;
};

export type FileResult = {
  name: string;
  assertionResults: AssertionResult[];
};

export type VitestJson = {
  numFailedTests: number;
  numPassedTests: number;
  testResults: FileResult[];
};

export type FailedTest = {
  file: string;
  title: string;
};

export function demoOverrideActive(env: Record<string, string | undefined>): boolean {
  return ["DEMO_BUGS", "DEMO_SCENARIO", "DEMO_BUGS_FILE"].some((key) => env[key] !== undefined);
}

export function failedAssertions(results: VitestJson, root: string): FailedTest[] {
  return results.testResults.flatMap((file) =>
    file.assertionResults
      .filter((assertion) => assertion.status === "failed")
      .map((assertion) => ({
        file: relativeFile(file.name, root),
        title: assertion.title,
      })),
  );
}

export function isPlantedOnly(failed: readonly FailedTest[]): boolean {
  const actual = new Set(failed.map(failureKey));
  const expected = new Set(plantedFailures.map(failureKey));
  return actual.size === expected.size && [...expected].every((key) => actual.has(key));
}

function failureKey(item: FailedTest) {
  return `${item.file}::${item.title}`;
}

function relativeFile(file: string, root: string) {
  return path.relative(root, file).split(path.sep).join("/");
}
