import { describe, expect, it } from "vitest";
import { overCatalogReportDue } from "@/lib/demo/suggested-credit-over-refund";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

const DISPUTE_ID = "dsp_1043";

function gate(overrides: Partial<Parameters<typeof overCatalogReportDue>[0]> = {}) {
  return overCatalogReportDue({
    reportOverCatalog: true,
    credit: { disputeId: DISPUTE_ID, suggestedCreditCents: 40_000 },
    disputeId: DISPUTE_ID,
    catalogPriceCents: PLAN_PRICE_CENTS.SCALE,
    ...overrides,
  });
}

describe("over-catalog report gate on the dispute page", () => {
  it("sends the report only for a loaded credit above the catalog price", () => {
    expect(gate()).toBe(true);
    expect(gate({ credit: { disputeId: DISPUTE_ID, suggestedCreditCents: PLAN_PRICE_CENTS.SCALE } })).toBe(false);
    expect(gate({ credit: { disputeId: DISPUTE_ID, suggestedCreditCents: 9_900 } })).toBe(false);
  });

  it("waits until the credit has loaded", () => {
    expect(gate({ credit: null })).toBe(false);
  });

  it("ignores a credit response that belongs to another dispute", () => {
    expect(gate({ credit: { disputeId: "dsp_1047", suggestedCreditCents: 40_000 } })).toBe(false);
  });

  it("stays off unless demo reporting is on", () => {
    expect(gate({ reportOverCatalog: false })).toBe(false);
  });
});
