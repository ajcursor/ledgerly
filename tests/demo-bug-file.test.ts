import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { bugProcessEnv, demoBug, loadDemoBugFile } from "@/lib/demo/bugs";

describe("demo bug file", () => {
  it("returns null for an unknown bug id", () => {
    expect(demoBug("enterprise_price")).toBeNull();
  });

  it("refuses a bug file outside the project", () => {
    expect(() => loadDemoBugFile("../package.json")).toThrow(
      /Demo bug file must stay inside the project/,
    );
    expect(() => loadDemoBugFile("/etc/passwd")).toThrow(
      /Demo bug file must stay inside the project/,
    );
  });

  it("rejects a bug file that has neither a bugs array nor a scenario", () => {
    const dir = mkdtempSync(join(process.cwd(), "test-results", "demo-bugs-"));
    const file = join(dir, "empty.json");
    writeFileSync(file, "{}\n");

    expect(() => loadDemoBugFile(file)).toThrow(/needs a bugs array or a scenario name/);
  });

  it("reports a read failure for a missing file inside the project", () => {
    const file = join("test-results", "missing-demo-bugs.json");

    expect(() => loadDemoBugFile(file)).toThrow(/Could not read demo bug file/);
  });

  it("copies the selected bug ids into server and browser env and clears scenario overrides", () => {
    const env = bugProcessEnv(["credit_v1", "filter_state"], {
      DEMO_BUGS: "line_rounding",
      DEMO_SCENARIO: "all",
      DEMO_BUGS_FILE: "demo/bugs.json",
      NEXT_PUBLIC_DEMO_SCENARIO: "known",
      PATH: "/usr/bin",
    });

    expect(env.DEMO_BUGS).toBe("credit_v1,filter_state");
    expect(env.NEXT_PUBLIC_DEMO_BUGS).toBe("credit_v1,filter_state");
    expect(env.DEMO_SCENARIO).toBeUndefined();
    expect(env.DEMO_BUGS_FILE).toBeUndefined();
    expect(env.NEXT_PUBLIC_DEMO_SCENARIO).toBeUndefined();
    expect(env.PATH).toBe("/usr/bin");
  });
});
