import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import InvoiceDetailPage from "@/app/invoices/[id]/page";
import { formatUsd } from "@/lib/money";
import { PLAN_PRICE_CENTS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

function noteSection(html: string) {
  const start = html.indexOf("Collection note");
  const end = html.indexOf("Save note");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return html.slice(start, end);
}

describe("invoice detail", () => {
  it("shows the catalog line, zero tax, and a collection note without a price", async () => {
    const html = renderToStaticMarkup(
      await InvoiceDetailPage({ params: Promise.resolve({ id: "inv_1043" }) }),
    );

    expect(html).toContain("Cobalt Goods");
    expect(html).toContain("INV-1043");
    expect(html).toContain("Scale plan · monthly");
    expect(html).toContain(formatUsd(PLAN_PRICE_CENTS.SCALE));
    expect(html).toContain(`Tax</dt><dd>${formatUsd(0)}</dd>`);
    expect(html).toContain(`Total</dt><dd>${formatUsd(PLAN_PRICE_CENTS.SCALE)}</dd>`);
    expect(html).toContain("dsp_1043");
    expect(html).not.toContain("$400.00");

    const note = noteSection(html);
    expect(note).toContain("Hi Cobalt Goods, your Scale invoice is");
    expect(note).toContain("Note to Ellis Marlow");
    expect(note).not.toContain("$");
    expect(note).not.toContain("249");
    expect(note).not.toContain("400");
  });

  it("adds stored tax to the line total and hides a missing or unknown plan", async () => {
    const priced = await prisma.invoice.findUniqueOrThrow({ where: { id: "inv_1042" } });
    const guarded = await prisma.invoice.findUniqueOrThrow({ where: { id: "inv_1045" } });
    const taxCents = 125;

    await prisma.invoice.update({ where: { id: priced.id }, data: { taxCents } });
    try {
      const html = renderToStaticMarkup(
        await InvoiceDetailPage({ params: Promise.resolve({ id: priced.id }) }),
      );
      expect(html).toContain(formatUsd(PLAN_PRICE_CENTS.STARTER));
      expect(html).toContain(`Tax</dt><dd>${formatUsd(taxCents)}</dd>`);
      expect(html).toContain(`Total</dt><dd>${formatUsd(PLAN_PRICE_CENTS.STARTER + taxCents)}</dd>`);
      expect(html).not.toContain(`Total</dt><dd>${formatUsd(priced.totalCents)}</dd>`);
    } finally {
      await prisma.invoice.update({
        where: { id: priced.id },
        data: { taxCents: priced.taxCents },
      });
    }

    await expect(
      InvoiceDetailPage({ params: Promise.resolve({ id: "inv_missing" }) }),
    ).rejects.toThrow(/404/);

    await prisma.invoice.update({ where: { id: guarded.id }, data: { plan: "CUSTOM" } });
    try {
      await expect(
        InvoiceDetailPage({ params: Promise.resolve({ id: guarded.id }) }),
      ).rejects.toThrow(/404/);
    } finally {
      await prisma.invoice.update({
        where: { id: guarded.id },
        data: { plan: guarded.plan },
      });
    }
  });
});
