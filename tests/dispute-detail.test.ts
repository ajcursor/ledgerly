import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/disputes/dsp_1043",
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));

import DisputeDetailPage from "@/app/disputes/[id]/page";
import { formatUsd } from "@/lib/money";
import { PLAN_PRICE_CENTS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

describe("dispute detail", () => {
  it("shows the raw claim beside the catalog cap and the stored credit", async () => {
    const html = renderToStaticMarkup(
      await DisputeDetailPage({ params: Promise.resolve({ id: "dsp_1043" }) }),
    );

    expect(html).toContain("Cobalt Goods");
    expect(html).toContain("INV-1043");
    expect(html).toContain(
      `Disputed ${formatUsd(40000)} against a Scale invoice priced at ${formatUsd(PLAN_PRICE_CENTS.SCALE)}.`,
    );
    expect(html).toContain(
      `Recorded when this dispute was opened: ${formatUsd(PLAN_PRICE_CENTS.SCALE)}.`,
    );
    expect(html).toContain("Do not invent a credit above $249.00");
    expect(html).not.toContain("Recorded when this dispute was opened: $400.00");
    expect(html).toContain("Loading suggested credit…");
  });

  it("shows an accepted credit and hides a missing dispute", async () => {
    const id = "dsp_cov_accept";
    await prisma.dispute.deleteMany({ where: { id } });
    await prisma.dispute.create({
      data: {
        id,
        invoiceId: "inv_1046",
        workspaceId: "ws_fieldnote",
        status: "ACCEPTED",
        reason: "Coverage fixture for an accepted catalog credit.",
        openedOn: new Date("2026-07-20T12:00:00.000Z"),
        disputedAmountCents: PLAN_PRICE_CENTS.SCALE,
        suggestedCreditCents: PLAN_PRICE_CENTS.SCALE,
        reviewerNote: "Accepted at the Scale catalog price.",
      },
    });

    try {
      const html = renderToStaticMarkup(
        await DisputeDetailPage({ params: Promise.resolve({ id }) }),
      );
      expect(html).toContain("Accepted");
      expect(html).toContain("Accepted at the Scale catalog price.");
      expect(html).toContain(
        `Disputed ${formatUsd(PLAN_PRICE_CENTS.SCALE)} against a Scale invoice priced at ${formatUsd(PLAN_PRICE_CENTS.SCALE)}.`,
      );
      expect(html).toContain(
        `Recorded when this dispute was opened: ${formatUsd(PLAN_PRICE_CENTS.SCALE)}.`,
      );
    } finally {
      await prisma.dispute.deleteMany({ where: { id } });
    }

    await expect(
      DisputeDetailPage({ params: Promise.resolve({ id: "dsp_missing" }) }),
    ).rejects.toThrow(/404/);
  });
});
