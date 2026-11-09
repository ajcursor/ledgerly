import { describe, expect, it } from "vitest";
import { invoiceLinesTotalCents, lineAmountCents } from "@/lib/invoice-lines";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

describe("invoice line amounts", () => {
  it("rejects a quantity, price, or occupied-day span that is not billable", () => {
    const period = { occupiedDays: 10, daysInPeriod: 31 };

    expect(() =>
      lineAmountCents({ quantity: -1, unitPriceCents: PLAN_PRICE_CENTS.GROWTH, ...period }),
    ).toThrow(/non-negative whole number/);
    expect(() =>
      lineAmountCents({ quantity: 1.5, unitPriceCents: PLAN_PRICE_CENTS.GROWTH, ...period }),
    ).toThrow(/non-negative whole number/);
    expect(() =>
      lineAmountCents({ quantity: 1, unitPriceCents: -1, ...period }),
    ).toThrow(/non-negative integer cents/);
    expect(() =>
      lineAmountCents({ quantity: 1, unitPriceCents: 99.5, ...period }),
    ).toThrow(/non-negative integer cents/);
    expect(() =>
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.GROWTH,
        occupiedDays: 32,
        daysInPeriod: 31,
      }),
    ).toThrow(/inside the billing period/);
    expect(() =>
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.GROWTH,
        occupiedDays: -1,
        daysInPeriod: 31,
      }),
    ).toThrow(/inside the billing period/);
    expect(() =>
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.GROWTH,
        occupiedDays: 1,
        daysInPeriod: 0,
      }),
    ).toThrow(/inside the billing period/);
    expect(() =>
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.GROWTH,
        occupiedDays: 10,
      }),
    ).toThrow(/inside the billing period/);
  });

  it("totals whole-period catalog seats, including a seat occupied for none of the period", () => {
    expect(
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.GROWTH,
      }),
    ).toBe(PLAN_PRICE_CENTS.GROWTH);
    expect(
      lineAmountCents({
        quantity: 2,
        unitPriceCents: PLAN_PRICE_CENTS.STARTER,
        occupiedDays: 31,
        daysInPeriod: 31,
      }),
    ).toBe(PLAN_PRICE_CENTS.STARTER * 2);
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
        { quantity: 1, unitPriceCents: PLAN_PRICE_CENTS.STARTER },
        { quantity: 1, unitPriceCents: PLAN_PRICE_CENTS.GROWTH },
        {
          quantity: 1,
          unitPriceCents: PLAN_PRICE_CENTS.SCALE,
          occupiedDays: 0,
          daysInPeriod: 31,
        },
      ]),
    ).toBe(PLAN_PRICE_CENTS.STARTER + PLAN_PRICE_CENTS.GROWTH);
  });
});
