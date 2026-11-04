import { describe, expect, it } from "vitest";
import { invoiceLinesTotalCents, lineAmountCents } from "@/lib/invoice-lines";
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

  it("charges whole seats at the catalog price and totals those lines", () => {
    expect(lineAmountCents({ quantity: 2, unitPriceCents: PLAN_PRICE_CENTS.GROWTH })).toBe(19_800);
    expect(lineAmountCents({ quantity: 0, unitPriceCents: PLAN_PRICE_CENTS.STARTER })).toBe(0);
    expect(
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.SCALE,
        occupiedDays: 31,
        daysInPeriod: 31,
      }),
    ).toBe(PLAN_PRICE_CENTS.SCALE);
    expect(
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.SCALE,
        occupiedDays: 0,
        daysInPeriod: 31,
      }),
    ).toBe(0);
    expect(
      invoiceLinesTotalCents([
        { quantity: 1, unitPriceCents: PLAN_PRICE_CENTS.SCALE },
        { quantity: 2, unitPriceCents: PLAN_PRICE_CENTS.GROWTH },
      ]),
    ).toBe(PLAN_PRICE_CENTS.SCALE + 19_800);
    expect(invoiceLinesTotalCents([])).toBe(0);
  });

  it("rejects a seat count, price, or occupied span that is not a whole billing line", () => {
    expect(() => lineAmountCents({ quantity: 1.5, unitPriceCents: PLAN_PRICE_CENTS.SCALE })).toThrow(
      /whole number of seats/,
    );
    expect(() => lineAmountCents({ quantity: -1, unitPriceCents: PLAN_PRICE_CENTS.SCALE })).toThrow(
      /whole number of seats/,
    );
    expect(() => lineAmountCents({ quantity: 1, unitPriceCents: -1 })).toThrow(/non-negative integer cents/);
    expect(() =>
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.GROWTH,
        occupiedDays: 11,
        daysInPeriod: 10,
      }),
    ).toThrow(/Occupied days/);
    expect(() =>
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.GROWTH,
        occupiedDays: 10,
      }),
    ).toThrow(/Occupied days/);
    expect(() =>
      invoiceLinesTotalCents([
        { quantity: 1, unitPriceCents: PLAN_PRICE_CENTS.STARTER },
        { quantity: -1, unitPriceCents: PLAN_PRICE_CENTS.STARTER },
      ]),
    ).toThrow(/whole number of seats/);
  });
});
