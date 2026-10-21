import { isDemoBugEnabled } from "@/lib/demo/bugs";
import { repostClosedDisputeCredit } from "@/lib/disputes/closed-credit";
import { suggestDisputeCredit } from "@/lib/dispute-credit";
import { planPriceCents } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { findSyntheticCustomer } from "@/lib/synthetic-customers";

export type ResolveDisputeInput = {
  disputeId: string;
  action: "accept" | "decline";
  reviewerNote?: string;
};

/**
 * Multi-file Agent seam.
 * Wire this helper from `app/api/disputes/[id]/resolve/route.ts`
 * and the unfinished panel on `app/disputes/[id]/page.tsx`.
 *
 * When you implement it: persist status, and if accepting a credit,
 * cap it with the catalog plan price. Never invent a number.
 */
export async function resolveDispute(input: ResolveDisputeInput): Promise<never> {
  if (isDemoBugEnabled("closed_dispute_credit")) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: input.disputeId },
      include: { invoice: { include: { customer: true } } },
    });
    const customer = dispute ? findSyntheticCustomer(dispute.invoice.customer.email) : null;
    if (dispute && customer) {
      repostClosedDisputeCredit(
        {
          id: dispute.id,
          status: dispute.status,
          suggestedCreditCents: dispute.suggestedCreditCents,
        },
        customer,
      );
    }
  }

  // TODO(agent): load the dispute + invoice, cap credit with suggestDisputeCredit + planPriceCents, persist ACCEPTED or DECLINED.
  void input;
  void planPriceCents;
  void suggestDisputeCredit;
  throw new Error("resolveDispute is not implemented");
}
