import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import { POST } from "@/app/api/disputes/[id]/resolve/route";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

const ENV_KEYS = ["DEMO_BUGS", "DEMO_SCENARIO", "DEMO_BUGS_FILE", "NEXT_PUBLIC_DEMO_BUGS", "NEXT_PUBLIC_DEMO_SCENARIO"] as const;

function post(id: string, body: unknown) {
  return POST(
    new Request(`http://localhost/api/disputes/${id}/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

async function snapshot(id: string) {
  const dispute = await prisma.dispute.findUniqueOrThrow({ where: { id } });
  return {
    status: dispute.status,
    suggestedCreditCents: dispute.suggestedCreditCents,
    reviewerNote: dispute.reviewerNote,
  };
}

async function restore(id: string, row: { status: string; suggestedCreditCents: number; reviewerNote: string | null }) {
  await prisma.dispute.update({ where: { id }, data: row });
}

async function withBugSelection(bugs: string | undefined, fn: () => Promise<void>) {
  const previous = new Map<string, string | undefined>();
  for (const key of ENV_KEYS) previous.set(key, process.env[key]);
  for (const key of ENV_KEYS) delete process.env[key];
  if (bugs !== undefined) process.env.DEMO_BUGS = bugs;
  try {
    await fn();
  } finally {
    for (const key of ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("dispute resolve", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("accepts an open dispute once, caps the credit, and refuses a second resolve", async () => {
    const before = await snapshot("dsp_1043");
    try {
      await withBugSelection(undefined, async () => {
      const response = await post("dsp_1043", { action: "accept", reviewerNote: "Cap at Scale." });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        ok: true,
        disputeId: "dsp_1043",
        status: "ACCEPTED",
        suggestedCreditCents: PLAN_PRICE_CENTS.SCALE,
      });
      const stored = await prisma.dispute.findUniqueOrThrow({ where: { id: "dsp_1043" } });
      expect(stored.status).toBe("ACCEPTED");
      expect(stored.suggestedCreditCents).toBe(24900);
      expect(stored.reviewerNote).toBe("Cap at Scale.");

      const again = await post("dsp_1043", { action: "accept", reviewerNote: "Again." });
      expect(again.status).toBe(409);
      await expect(again.json()).resolves.toEqual({ error: "Dispute dsp_1043 is already ACCEPTED." });
      const still = await prisma.dispute.findUniqueOrThrow({ where: { id: "dsp_1043" } });
      expect(still.suggestedCreditCents).toBe(24900);
      expect(still.reviewerNote).toBe("Cap at Scale.");
      });
    } finally {
      await restore("dsp_1043", before);
    }
  });

  it("declines an open dispute without raising the credit", async () => {
    const before = await snapshot("dsp_1047");
    try {
      const response = await post("dsp_1047", { action: "decline", reviewerNote: "Charge stands." });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        ok: true,
        status: "DECLINED",
        suggestedCreditCents: before.suggestedCreditCents,
      });
      const stored = await prisma.dispute.findUniqueOrThrow({ where: { id: "dsp_1047" } });
      expect(stored.status).toBe("DECLINED");
      expect(stored.suggestedCreditCents).toBe(before.suggestedCreditCents);
    } finally {
      await restore("dsp_1047", before);
    }
  });

  it("rejects an already accepted dispute without posting the credit again", async () => {
    const before = await snapshot("dsp_1050");
    try {
      await withBugSelection(undefined, async () => {
      const response = await post("dsp_1050", { action: "accept" });
      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toEqual({ error: "Dispute dsp_1050 is already ACCEPTED." });
      const stored = await prisma.dispute.findUniqueOrThrow({ where: { id: "dsp_1050" } });
      expect(stored.suggestedCreditCents).toBe(before.suggestedCreditCents);
      expect(stored.status).toBe(before.status);
      });
    } finally {
      await restore("dsp_1050", before);
    }
  });

  it("posts the credit again when closed_dispute_credit is selected", async () => {
    const before = await snapshot("dsp_1050");
    try {
      await withBugSelection("closed_dispute_credit", async () => {
      const response = await post("dsp_1050", { action: "accept" });
      expect(response.status).toBe(500);
      const body = (await response.json()) as { error: string };
      expect(body.error).toMatch(/A second credit of \$99\.00 was posted/);
      const stored = await prisma.dispute.findUniqueOrThrow({ where: { id: "dsp_1050" } });
      expect(stored.suggestedCreditCents).toBe(before.suggestedCreditCents * 2);
      expect(stored.status).toBe("ACCEPTED");
      });
    } finally {
      await restore("dsp_1050", before);
    }
  });

  it("returns 400 for an unknown action and 404 for a missing dispute", async () => {
    const bad = await post("dsp_1043", { action: "ACCEPTED" });
    expect(bad.status).toBe(400);
    const missing = await post("dsp_missing", { action: "accept" });
    expect(missing.status).toBe(404);
  });
});
