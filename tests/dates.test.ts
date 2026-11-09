import { describe, expect, it } from "vitest";
import { DEMO_AS_OF, demoDay } from "@/lib/clock";
import { daysBetween, formatDate } from "@/lib/dates";

describe("invoice dates", () => {
  it("formats UTC calendar dates and rounds an aging span to the nearest day", () => {
    const nearUtcMidnight = "2026-08-23T00:30:00.000Z";

    expect(formatDate(nearUtcMidnight)).toBe("Aug 23, 2026");
    expect(formatDate(new Date(nearUtcMidnight))).toBe("Aug 23, 2026");
    expect(demoDay("2026-08-23").toISOString()).toBe(DEMO_AS_OF.toISOString());
    expect(
      daysBetween(new Date("2026-08-23T12:00:00.000Z"), new Date("2026-08-09T12:00:00.000Z")),
    ).toBe(14);
    expect(
      daysBetween(new Date("2026-08-23T18:00:00.000Z"), new Date("2026-08-23T00:00:00.000Z")),
    ).toBe(1);
    expect(
      daysBetween(new Date("2026-08-09T12:00:00.000Z"), new Date("2026-08-23T12:00:00.000Z")),
    ).toBe(-14);
  });
});
