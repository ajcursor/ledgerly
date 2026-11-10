import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { POST as reportOverRefund } from "@/app/api/demo/suggested-credit-over-refund/route";
import { POST as resolveDispute } from "@/app/api/disputes/[id]/resolve/route";
import { GET as getLegacySuggestedCredit } from "@/app/api/v1/disputes/[id]/suggested-credit/route";
import { GET as getCurrentSuggestedCredit } from "@/app/api/v2/disputes/[id]/suggested-credit/route";
import { prisma } from "@/lib/prisma";

const DISPUTE_ID = "dsp_1041";
const previousDemoMode = process.env.DEMO_MODE;

function report(viewId: string) {
  return reportOverRefund(
    new Request("http://localhost/api/demo/suggested-credit-over-refund", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ disputeId: DISPUTE_ID, viewId }),
    }),
  );
}

function suggestedCredit(handler: typeof getCurrentSuggestedCredit) {
  return handler(new Request("http://localhost/api/suggested-credit"), {
    params: Promise.resolve({ id: DISPUTE_ID }),
  });
}

function resolve(body: unknown, raw?: string) {
  return resolveDispute(
    new Request(`http://localhost/api/disputes/${DISPUTE_ID}/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: raw ?? JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: DISPUTE_ID }) },
  );
}

async function disputeRow() {
  return prisma.dispute.findUniqueOrThrow({
    where: { id: DISPUTE_ID },
    include: { invoice: true },
  });
}

describe("unknown invoice plan", () => {
  afterEach(() => {
    if (previousDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = previousDemoMode;
    vi.clearAllMocks();
  });

  it("refuses a v2 credit and skips the over-refund report when the invoice plan is outside the catalog", async () => {
    const before = await disputeRow();
    process.env.DEMO_MODE = "true";
    try {
      await prisma.invoice.update({
        where: { id: before.invoiceId },
        data: { plan: "LEGACY" },
      });

      const current = await suggestedCredit(getCurrentSuggestedCredit);
      expect(current.status).toBe(422);
      await expect(current.json()).resolves.toEqual({
        error: "Dispute invoice has an invalid plan",
      });

      const legacy = await suggestedCredit(getLegacySuggestedCredit);
      expect(legacy.status).toBe(200);
      await expect(legacy.json()).resolves.toMatchObject({
        disputeId: DISPUTE_ID,
        suggestedCreditCents: before.disputedAmountCents,
        apiVersion: "v1",
      });

      const reported = await report("view-legacy-plan");
      expect(reported.status).toBe(200);
      await expect(reported.json()).resolves.toEqual({ reported: false });
      expect(Sentry.captureException).not.toHaveBeenCalled();
    } finally {
      await prisma.invoice.update({
        where: { id: before.invoiceId },
        data: { plan: before.invoice.plan },
      });
    }
  });

  it("does not resolve a dispute whose invoice plan is outside the catalog", async () => {
    const before = await disputeRow();
    try {
      await prisma.invoice.update({
        where: { id: before.invoiceId },
        data: { plan: "LEGACY" },
      });

      const response = await resolve({ action: "accept", reviewerNote: "Post the credit." });
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Dispute dsp_1041 is on an invoice with an unknown plan.",
      });

      const stored = await disputeRow();
      expect(stored.status).toBe(before.status);
      expect(stored.suggestedCreditCents).toBe(before.suggestedCreditCents);
      expect(stored.reviewerNote).toBe(before.reviewerNote);
    } finally {
      await prisma.invoice.update({
        where: { id: before.invoiceId },
        data: { plan: before.invoice.plan },
      });
    }
  });

  it("keeps the stored reviewer note when the new note is blank", async () => {
    const before = await disputeRow();
    const kept = "Certificate is on file.";
    try {
      await prisma.dispute.update({
        where: { id: DISPUTE_ID },
        data: { reviewerNote: kept },
      });

      const response = await resolve({ action: "decline", reviewerNote: "   " });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        disputeId: DISPUTE_ID,
        status: "DECLINED",
        suggestedCreditCents: before.suggestedCreditCents,
      });

      const stored = await disputeRow();
      expect(stored.status).toBe("DECLINED");
      expect(stored.reviewerNote).toBe(kept);
      expect(stored.suggestedCreditCents).toBe(before.suggestedCreditCents);
    } finally {
      await prisma.dispute.update({
        where: { id: DISPUTE_ID },
        data: {
          status: before.status,
          suggestedCreditCents: before.suggestedCreditCents,
          reviewerNote: before.reviewerNote,
        },
      });
    }
  });

  it("treats invalid JSON as a missing action", async () => {
    const before = await disputeRow();

    const response = await resolve(undefined, "{");
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "action must be accept or decline",
    });

    const stored = await disputeRow();
    expect(stored.status).toBe(before.status);
    expect(stored.suggestedCreditCents).toBe(before.suggestedCreditCents);
    expect(stored.reviewerNote).toBe(before.reviewerNote);
  });
});
