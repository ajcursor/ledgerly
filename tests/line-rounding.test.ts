import { describe, expect, it } from "vitest";
import { lineAmountCents } from "@/lib/invoice-lines";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

describe("invoice line totals", () => {
  it("rounds a mid-cycle Growth seat to the nearest cent", () => {
    expect(
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.GROWTH,
        occupiedDays: 10,
        daysInPeriod: 31,
      }),
    ).toBe(3194);
  });
});
