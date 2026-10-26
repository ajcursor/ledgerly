import * as Sentry from "@sentry/nextjs";
import { getDispute } from "@/lib/data";
import { isDemoBugEnabled } from "@/lib/demo/bugs";
import { captureDemoBug } from "@/lib/demo/capture-bug";
import { DEMO_ERROR_SCENARIOS } from "@/lib/demo/error-scenarios";
import { isDemoModeEnabled } from "@/lib/demo/mode";
import {
  claimSuggestedCreditView,
  displayedSuggestedCreditCents,
  shouldReportSuggestedCreditOverRefund,
} from "@/lib/demo/suggested-credit-over-refund";
import { isPlanId, planPriceCents } from "@/lib/plans";
import type { SyntheticCustomer } from "@/lib/synthetic-customers";

export type SuggestedCreditReportResult = "reported" | "skipped" | "not_found";

/**
 * Send suggested-credit-over-refund when the figure on the dispute page is above
 * the catalog price. DEMO_MODE and credit_v1 are both required. One capture per view id.
 */
export async function reportDisplayedSuggestedCreditOverRefund(input: {
  disputeId: string;
  viewId: string;
  customer: SyntheticCustomer;
}): Promise<SuggestedCreditReportResult> {
  const disputeId = input.disputeId.trim();
  const viewId = input.viewId.trim();
  if (!disputeId || !viewId || viewId.length > 200) return "skipped";

  const dispute = await getDispute(disputeId);
  if (!dispute) return "not_found";
  if (!isPlanId(dispute.invoice.plan)) return "skipped";

  const catalogPriceCents = planPriceCents(dispute.invoice.plan);
  const creditV1Enabled = isDemoBugEnabled("credit_v1");
  const suggestedCreditCents = displayedSuggestedCreditCents({
    creditV1Enabled,
    disputedAmountCents: dispute.disputedAmountCents,
    catalogPriceCents,
  });

  if (
    !shouldReportSuggestedCreditOverRefund({
      demoMode: isDemoModeEnabled(),
      creditV1Enabled,
      suggestedCreditCents,
      catalogPriceCents,
    })
  ) {
    return "skipped";
  }

  if (!claimSuggestedCreditView(viewId)) return "skipped";

  const scenario = DEMO_ERROR_SCENARIOS["suggested-credit-over-refund"];
  captureDemoBug(scenario.createError(), {
    scenario: "suggested-credit-over-refund",
    feature: scenario.feature,
    customer: input.customer,
  });

  try {
    await Sentry.flush(2000);
  } catch {
    // The dispute page still shows the credit. A failed send must not change that.
  }

  return "reported";
}
