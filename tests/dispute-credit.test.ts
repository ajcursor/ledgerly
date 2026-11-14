import { describe, expect, it } from "vitest";
import { suggestDisputeCredit } from "@/lib/dispute-credit";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

describe("suggestDisputeCredit", () => {
  it("never suggests more credit than the invoice plan price", () => {
    const suggested = suggestDisputeCredit({
      disputedAmountCents: 40_000,
      planPriceCents: PLAN_PRICE_CENTS.SCALE,
    });

    expect(suggested).toBe(PLAN_PRICE_CENTS.SCALE);
  });

  it("suggests the disputed amount when it is below the plan price", () => {
    expect(
      suggestDisputeCredit({
        disputedAmountCents: PLAN_PRICE_CENTS.STARTER,
        planPriceCents: PLAN_PRICE_CENTS.GROWTH,
      }),
    ).toBe(PLAN_PRICE_CENTS.STARTER);
  });

  it("refuses negative cents on either input", () => {
    expect(() =>
      suggestDisputeCredit({ disputedAmountCents: -1, planPriceCents: PLAN_PRICE_CENTS.GROWTH }),
    ).toThrow("Credit inputs must be non-negative cents.");
    expect(() =>
      suggestDisputeCredit({ disputedAmountCents: 4900, planPriceCents: -1 }),
    ).toThrow("Credit inputs must be non-negative cents.");
  });
});
