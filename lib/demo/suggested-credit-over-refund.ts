import { suggestDisputeCredit } from "@/lib/dispute-credit";

/** POST target for a page view that is showing an over-catalog suggested credit. */
export const SUGGESTED_CREDIT_OVER_REFUND_REPORT_PATH = "/api/demo/suggested-credit-over-refund";

const claimedViews = new Set<string>();
const MAX_CLAIMED_VIEWS = 200;

/**
 * True the first time this runtime sees the view id.
 * The dispute page's effect runs twice under React strict mode; the id does not change.
 * A later page view gets a new id from the server render.
 */
export function claimSuggestedCreditView(viewId: string): boolean {
  if (claimedViews.has(viewId)) return false;
  claimedViews.add(viewId);
  if (claimedViews.size > MAX_CLAIMED_VIEWS) {
    const oldest = claimedViews.values().next().value;
    if (oldest !== undefined) claimedViews.delete(oldest);
  }
  return true;
}

export function suggestedCreditExceedsCatalog(
  suggestedCreditCents: number,
  catalogPriceCents: number,
): boolean {
  return suggestedCreditCents > catalogPriceCents;
}

/** Amount the dispute page shows: the raw claim while credit_v1 is on, otherwise the catalog cap. */
export function displayedSuggestedCreditCents(input: {
  creditV1Enabled: boolean;
  disputedAmountCents: number;
  catalogPriceCents: number;
}): number {
  if (input.creditV1Enabled) return input.disputedAmountCents;
  return suggestDisputeCredit({
    disputedAmountCents: input.disputedAmountCents,
    planPriceCents: input.catalogPriceCents,
  });
}

export function shouldReportSuggestedCreditOverRefund(input: {
  demoMode: boolean;
  creditV1Enabled: boolean;
  suggestedCreditCents: number;
  catalogPriceCents: number;
}): boolean {
  return (
    input.demoMode &&
    input.creditV1Enabled &&
    suggestedCreditExceedsCatalog(input.suggestedCreditCents, input.catalogPriceCents)
  );
}
