import { describe, expect, it } from "vitest";
import { invoiceLinesTotalCents, lineAmountCents } from "@/lib/invoice-lines";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

describe("invoice line totals", () => {
  it("sums whole-seat lines across an invoice in integer cents", () => {
    expect(
      invoiceLinesTotalCents([
        { quantity: 3, unitPriceCents: PLAN_PRICE_CENTS.GROWTH },
        { quantity: 1, unitPriceCents: PLAN_PRICE_CENTS.STARTER },
      ]),
    ).toBe(3 * 9900 + 4900);
  });

  it("charges a seat that was occupied the whole period at the full catalog price", () => {
    expect(
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.SCALE,
        occupiedDays: 31,
        daysInPeriod: 31,
      }),
    ).toBe(PLAN_PRICE_CENTS.SCALE);
  });

  it("refuses a fractional seat count", () => {
    expect(() => lineAmountCents({ quantity: 1.5, unitPriceCents: PLAN_PRICE_CENTS.GROWTH })).toThrow(
      "Quantity must be a non-negative whole number of seats.",
    );
  });

  it("refuses a negative unit price", () => {
    expect(() => lineAmountCents({ quantity: 1, unitPriceCents: -1 })).toThrow(
      "Unit price must be non-negative integer cents.",
    );
  });

  it("refuses a mid-cycle seat that occupies more days than the billing period", () => {
    expect(() =>
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.GROWTH,
        occupiedDays: 32,
        daysInPeriod: 31,
      }),
    ).toThrow("Occupied days must fall inside the billing period.");
  });
});
