import { describe, expect, it } from "vitest";
import { PLAN_PRICE_CENTS, planLabel, planPriceCents } from "@/lib/plans";

describe("plan catalog", () => {
  it("exposes only the three demo prices", () => {
    expect(PLAN_PRICE_CENTS).toEqual({
      STARTER: 4900,
      GROWTH: 9900,
      SCALE: 24900,
    });
  });

  it("labels plans without mentioning a made-up tier", () => {
    expect(planLabel("STARTER")).toBe("Starter");
    expect(planPriceCents("GROWTH")).toBe(9900);
  });

  it("refuses unknown plans instead of inventing a price", () => {
    expect(() => planPriceCents("ENTERPRISE")).toThrow(/Unknown plan/);
    expect(() => planLabel("ENTERPRISE")).toThrow(/Unknown plan/);
  });
});
