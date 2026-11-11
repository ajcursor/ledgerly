import { describe, expect, it } from "vitest";
import { DEMO_AS_OF, demoDay } from "@/lib/clock";

describe("demo clock", () => {
  it("anchors seed calendar days at UTC noon", () => {
    expect(demoDay("2026-08-23").toISOString()).toBe(DEMO_AS_OF.toISOString());
    expect(demoDay("2026-08-09").toISOString()).toBe("2026-08-09T12:00:00.000Z");
    expect(demoDay("2026-02-02").toISOString()).toBe("2026-02-02T12:00:00.000Z");
  });
});
