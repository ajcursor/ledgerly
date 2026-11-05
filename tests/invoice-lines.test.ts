import { describe, expect, it } from "vitest";
import { invoiceLinesTotalCents, lineAmountCents } from "@/lib/invoice-lines";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

describe("invoice line amounts", () => {
  it("rejects a quantity or price that is not a whole non-negative number", () => {
    const line = { quantity: 1, unitPriceCents: PLAN_PRICE_CENTS.GROWTH };
    expect(() => lineAmountCents({ ...line, quantity: -1 })).toThrow(/Quantity/);
    expect(() => lineAmountCents({ ...line, quantity: 1.5 })).toThrow(/Quantity/);
    expect(() => lineAmountCents({ ...line, unitPriceCents: -1 })).toThrow(/Unit price/);
    expect(() => lineAmountCents({ ...line, unitPriceCents: 10.5 })).toThrow(/Unit price/);
  });

  it("rejects occupied days that fall outside the billing period", () => {
    const price = { quantity: 1, unitPriceCents: PLAN_PRICE_CENTS.GROWTH };
    expect(() => lineAmountCents({ ...price, occupiedDays: 10 })).toThrow(/Occupied days/);
    expect(() => lineAmountCents({ ...price, occupiedDays: 32, daysInPeriod: 31 })).toThrow(/Occupied days/);
    expect(() => lineAmountCents({ ...price, occupiedDays: -1, daysInPeriod: 31 })).toThrow(/Occupied days/);
    expect(() => lineAmountCents({ ...price, occupiedDays: 1.5, daysInPeriod: 31 })).toThrow(/Occupied days/);
  });

  it("bills a full period as quantity times the catalog price", () => {
    const lines = [
      { quantity: 2, unitPriceCents: PLAN_PRICE_CENTS.GROWTH },
      { quantity: 1, unitPriceCents: PLAN_PRICE_CENTS.STARTER },
    ];
    expect(lineAmountCents(lines[0])).toBe(PLAN_PRICE_CENTS.GROWTH * 2);
    expect(
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.SCALE,
        occupiedDays: 30,
        daysInPeriod: 30,
      }),
    ).toBe(PLAN_PRICE_CENTS.SCALE);
    expect(
      lineAmountCents({
        quantity: 1,
        unitPriceCents: PLAN_PRICE_CENTS.GROWTH,
        occupiedDays: 0,
        daysInPeriod: 31,
      }),
    ).toBe(0);
    expect(invoiceLinesTotalCents(lines)).toBe(PLAN_PRICE_CENTS.GROWTH * 2 + PLAN_PRICE_CENTS.STARTER);
  });
});
