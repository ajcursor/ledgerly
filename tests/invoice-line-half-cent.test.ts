import { describe, expect, it } from "vitest";
import { lineAmountCents } from "@/lib/invoice-lines";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

describe("prorated invoice line rounding", () => {
  it("rounds a half cent up and a smaller fraction down", () => {
    // Starter $49 for 1 of 8 days is 612.5 cents. The next smaller slice is 306.25.
    expect(
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.STARTER,
        occupiedDays: 1,
        daysInPeriod: 8,
      }),
    ).toBe(613);
    expect(
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.STARTER,
        occupiedDays: 1,
        daysInPeriod: 16,
      }),
    ).toBe(306);
  });
});
