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

  it("returns the claim when it is within the catalog price", () => {
    expect(
      suggestDisputeCredit({
        disputedAmountCents: PLAN_PRICE_CENTS.STARTER,
        planPriceCents: PLAN_PRICE_CENTS.SCALE,
      }),
    ).toBe(PLAN_PRICE_CENTS.STARTER);
    expect(
      suggestDisputeCredit({
        disputedAmountCents: PLAN_PRICE_CENTS.GROWTH,
        planPriceCents: PLAN_PRICE_CENTS.GROWTH,
      }),
    ).toBe(PLAN_PRICE_CENTS.GROWTH);
    expect(
      suggestDisputeCredit({
        disputedAmountCents: 0,
        planPriceCents: PLAN_PRICE_CENTS.SCALE,
      }),
    ).toBe(0);
  });

  it("rejects a negative amount", () => {
    expect(() =>
      suggestDisputeCredit({
        disputedAmountCents: -1,
        planPriceCents: PLAN_PRICE_CENTS.GROWTH,
      }),
    ).toThrow(/non-negative/);
    expect(() =>
      suggestDisputeCredit({
        disputedAmountCents: PLAN_PRICE_CENTS.GROWTH,
        planPriceCents: -1,
      }),
    ).toThrow(/non-negative/);
  });
});
