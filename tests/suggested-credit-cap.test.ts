/**
 * The dispute page fetches whichever route `suggestedCreditPath` selects.
 * dsp_1043 claims $400 against a $249 Scale invoice, so the figure it shows
 * must stay at or under the invoice total.
 */
import { describe, expect, it } from "vitest";
import { GET as getLegacySuggestedCredit } from "@/app/api/v1/disputes/[id]/suggested-credit/route";
import { GET as getCurrentSuggestedCredit } from "@/app/api/v2/disputes/[id]/suggested-credit/route";
import { getDispute } from "@/lib/data";
import { suggestedCreditPath } from "@/lib/disputes/suggested-credit-api";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

const handlers = {
  "/api/v1/disputes/dsp_1043/suggested-credit": getLegacySuggestedCredit,
  "/api/v2/disputes/dsp_1043/suggested-credit": getCurrentSuggestedCredit,
} as const;

describe("dispute page suggested credit", () => {
  it("does not exceed the invoice total for dsp_1043", async () => {
    const dispute = await getDispute("dsp_1043");
    expect(dispute?.invoice.totalCents).toBe(PLAN_PRICE_CENTS.SCALE);

    const path = suggestedCreditPath("dsp_1043") as keyof typeof handlers;
    const response = await handlers[path](new Request(`http://localhost${path}`), {
      params: Promise.resolve({ id: "dsp_1043" }),
    });
    const body = await response.json();

    expect(body.suggestedCreditCents).toBeLessThanOrEqual(dispute!.invoice.totalCents);
  });
});
