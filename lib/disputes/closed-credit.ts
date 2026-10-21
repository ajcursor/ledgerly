import { isDemoBugEnabled } from "@/lib/demo/bugs";
import { captureDemoBug } from "@/lib/demo/capture-bug";
import { ClosedDisputeResolveError } from "@/lib/demo/error-scenarios";
import type { SyntheticCustomer } from "@/lib/synthetic-customers";

const CLOSED = new Set(["ACCEPTED", "DECLINED"]);

/**
 * Additional credit posted when a dispute is resolved.
 * An open dispute returns the catalog credit already on the row.
 * An accepted or declined dispute posts nothing — unless the closed-dispute
 * bug is selected, in which case the original credit is posted again and
 * the failure is sent to Sentry with the customer attached.
 */
export function repostClosedDisputeCredit(
  dispute: { id: string; status: string; suggestedCreditCents: number },
  customer: SyntheticCustomer,
): number {
  if (!CLOSED.has(dispute.status)) return dispute.suggestedCreditCents;
  if (!isDemoBugEnabled("closed_dispute_credit")) return 0;

  const repostedCreditCents = dispute.suggestedCreditCents * 2;
  const error = new ClosedDisputeResolveError(repostedCreditCents);
  captureDemoBug(error, {
    scenario: "closed-dispute-resolve",
    feature: "disputes",
    customer,
  });
  throw error;
}
