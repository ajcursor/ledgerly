import { describe, expect, it } from "vitest";
import {
  demoOverrideActive,
  failedAssertions,
  isPlantedOnly,
  plantedFailures,
} from "@/scripts/coverage-gate";

const planted = plantedFailures.map((item) => ({ file: item.file, title: item.title }));

describe("coverage gate", () => {
  it("accepts the two planted failures in any order", () => {
    expect(isPlantedOnly([...planted].reverse())).toBe(true);
  });

  it("rejects an unexpected failure alongside the planted pair", () => {
    expect(isPlantedOnly([...planted, { file: "tests/money.test.ts", title: "formats cents" }])).toBe(false);
  });

  it("rejects a run where a planted test passed or nothing failed", () => {
    expect(isPlantedOnly([planted[0]])).toBe(false);
    expect(isPlantedOnly([])).toBe(false);
  });

  it("matches planted failures by file and title, not title alone", () => {
    expect(isPlantedOnly([planted[0], { file: "tests/other.test.ts", title: planted[1].title }])).toBe(false);
  });

  it("treats any set DEMO_BUGS, DEMO_SCENARIO, or DEMO_BUGS_FILE as an override, even when empty", () => {
    expect(demoOverrideActive({})).toBe(false);
    expect(demoOverrideActive({ OTHER: "x" })).toBe(false);
    expect(demoOverrideActive({ DEMO_BUGS: "" })).toBe(true);
    expect(demoOverrideActive({ DEMO_SCENARIO: "x" })).toBe(true);
    expect(demoOverrideActive({ DEMO_BUGS_FILE: "x" })).toBe(true);
  });

  it("maps failed assertions to repo-relative files and skips passing ones", () => {
    const results = {
      numFailedTests: 1,
      numPassedTests: 2,
      testResults: [
        {
          name: "/repo/tests/a.test.ts",
          assertionResults: [
            { status: "failed", title: "breaks" },
            { status: "passed", title: "holds" },
          ],
        },
        {
          name: "/repo/tests/b.test.ts",
          assertionResults: [{ status: "passed", title: "also holds" }],
        },
      ],
    };
    expect(failedAssertions(results, "/repo")).toEqual([{ file: "tests/a.test.ts", title: "breaks" }]);
  });
});
