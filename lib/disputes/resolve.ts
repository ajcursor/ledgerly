import { isDemoBugEnabled } from "@/lib/demo/bugs";
import { suggestDisputeCredit } from "@/lib/dispute-credit";
import { repostClosedDisputeCredit } from "@/lib/disputes/closed-credit";
import { isPlanId, planPriceCents } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { findSyntheticCustomer } from "@/lib/synthetic-customers";

export type ResolveDisputeInput = {
  disputeId: string;
  action: "accept" | "decline";
  reviewerNote?: string;
};

export type ResolveDisputeResult = {
  disputeId: string;
  status: "ACCEPTED" | "DECLINED";
  suggestedCreditCents: number;
};

const CLOSED = new Set(["ACCEPTED", "DECLINED"]);

export class DisputeNotFoundError extends Error {
  constructor(disputeId: string) {
    super(`Dispute ${disputeId} was not found.`);
    this.name = "DisputeNotFoundError";
  }
}

export class DisputeAlreadyResolvedError extends Error {
  constructor(disputeId: string, status: string) {
    super(`Dispute ${disputeId} is already ${status}.`);
    this.name = "DisputeAlreadyResolvedError";
  }
}

/**
 * Accept posts the catalog-capped credit once and marks the dispute ACCEPTED.
 * Decline marks it DECLINED and does not raise the credit.
 * An accepted or declined dispute is refused. The closed_dispute_credit bug
 * posts that credit again and reports it to Sentry instead of refusing.
 */
export async function resolveDispute(input: ResolveDisputeInput): Promise<ResolveDisputeResult> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: input.disputeId },
    include: { invoice: { include: { customer: true } } },
  });
  if (!dispute) throw new DisputeNotFoundError(input.disputeId);
  if (!isPlanId(dispute.invoice.plan)) {
    throw new Error(`Dispute ${dispute.id} is on an invoice with an unknown plan.`);
  }

  if (CLOSED.has(dispute.status)) {
    if (isDemoBugEnabled("closed_dispute_credit")) {
      const customer = findSyntheticCustomer(dispute.invoice.customer.email);
      if (customer) {
        const originalCreditCents = dispute.suggestedCreditCents;
        await prisma.dispute.update({
          where: { id: dispute.id },
          data: { suggestedCreditCents: originalCreditCents * 2 },
        });
        repostClosedDisputeCredit(
          {
            id: dispute.id,
            status: dispute.status,
            suggestedCreditCents: originalCreditCents,
          },
          customer,
        );
      }
    }
    throw new DisputeAlreadyResolvedError(dispute.id, dispute.status);
  }

  const suggestedCreditCents =
    input.action === "accept"
      ? suggestDisputeCredit({
          disputedAmountCents: dispute.disputedAmountCents,
          planPriceCents: planPriceCents(dispute.invoice.plan),
        })
      : dispute.suggestedCreditCents;
  const status = input.action === "accept" ? "ACCEPTED" : "DECLINED";

  await prisma.dispute.update({
    where: { id: dispute.id },
    data: {
      status,
      reviewerNote: input.reviewerNote?.trim() ? input.reviewerNote.trim() : dispute.reviewerNote,
      ...(input.action === "accept" ? { suggestedCreditCents } : {}),
    },
  });

  return { disputeId: dispute.id, status, suggestedCreditCents };
}
