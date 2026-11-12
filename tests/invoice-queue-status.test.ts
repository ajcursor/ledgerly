import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InvoiceTable, displayInvoiceStatus } from "@/components/invoice-table";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

function invoice(input: {
  id: string;
  number: string;
  status: string;
  plan: string;
  totalCents: number;
  customer: string;
  disputes: { id: string; status: string }[];
}) {
  return {
    id: input.id,
    number: input.number,
    plan: input.plan,
    status: input.status,
    issuedOn: new Date("2026-08-13T12:00:00.000Z"),
    dueOn: new Date("2026-09-12T12:00:00.000Z"),
    totalCents: input.totalCents,
    customer: { name: input.customer },
    disputes: input.disputes,
  };
}

function badgeText(html: string): string {
  const match = html.match(/data-slot="badge"[^>]*>([^<]*)</);
  expect(match, html).not.toBeNull();
  return match?.[1] ?? "";
}

function rowHtml(html: string, number: string): string {
  const start = html.indexOf(number);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = html.indexOf("INV-", start + number.length);
  return html.slice(start, next === -1 ? undefined : next);
}

describe("invoice queue status", () => {
  it("marks a collectible invoice Disputed only while a dispute is still open", () => {
    const cases: { status: string; disputes: string[]; expected: string }[] = [
      { status: "OVERDUE", disputes: ["NEEDS_REVIEW"], expected: "DISPUTED" },
      { status: "OPEN", disputes: ["OPEN"], expected: "DISPUTED" },
      { status: "DRAFT", disputes: ["OPEN"], expected: "DISPUTED" },
      { status: "OPEN", disputes: ["ACCEPTED", "OPEN"], expected: "DISPUTED" },
      { status: "PAID", disputes: ["OPEN"], expected: "PAID" },
      { status: "VOID", disputes: ["NEEDS_REVIEW"], expected: "VOID" },
      { status: "OPEN", disputes: ["ACCEPTED"], expected: "OPEN" },
      { status: "OVERDUE", disputes: ["DECLINED"], expected: "OVERDUE" },
      { status: "OPEN", disputes: [], expected: "OPEN" },
    ];

    for (const entry of cases) {
      expect(
        displayInvoiceStatus({
          status: entry.status,
          disputes: entry.disputes.map((status, index) => ({ id: `dsp_${index}`, status })),
        }),
      ).toBe(entry.expected);
    }
  });

  it("renders Disputed on the queue and keeps Paid or Void when the invoice is closed", () => {
    const rows = [
      invoice({
        id: "inv_1043",
        number: "INV-1043",
        status: "OVERDUE",
        plan: "SCALE",
        totalCents: PLAN_PRICE_CENTS.SCALE,
        customer: "Cobalt Goods",
        disputes: [{ id: "dsp_1043", status: "NEEDS_REVIEW" }],
      }),
      invoice({
        id: "inv_1050",
        number: "INV-1050",
        status: "PAID",
        plan: "GROWTH",
        totalCents: PLAN_PRICE_CENTS.GROWTH,
        customer: "Copperleaf Atelier",
        disputes: [{ id: "dsp_open", status: "OPEN" }],
      }),
      invoice({
        id: "inv_1051",
        number: "INV-1051",
        status: "VOID",
        plan: "STARTER",
        totalCents: PLAN_PRICE_CENTS.STARTER,
        customer: "Acme North",
        disputes: [{ id: "dsp_void", status: "NEEDS_REVIEW" }],
      }),
      invoice({
        id: "inv_1048",
        number: "INV-1048",
        status: "DRAFT",
        plan: "STARTER",
        totalCents: PLAN_PRICE_CENTS.STARTER,
        customer: "Maple & Ember Co",
        disputes: [{ id: "dsp_draft", status: "OPEN" }],
      }),
    ];

    const html = renderToStaticMarkup(createElement(InvoiceTable, { invoices: rows }));
    const disputed = rowHtml(html, "INV-1043");
    expect(badgeText(disputed)).toBe("Disputed");
    expect(disputed).toContain("Cobalt Goods");
    expect(disputed).toContain(formatUsd(PLAN_PRICE_CENTS.SCALE));
    expect(disputed).toContain(formatDate("2026-08-13T12:00:00.000Z"));
    expect(disputed).not.toContain("Overdue");

    expect(badgeText(rowHtml(html, "INV-1050"))).toBe("Paid");
    expect(rowHtml(html, "INV-1050")).toContain(formatUsd(PLAN_PRICE_CENTS.GROWTH));
    expect(badgeText(rowHtml(html, "INV-1051"))).toBe("Void");
    expect(badgeText(rowHtml(html, "INV-1048"))).toBe("Disputed");
  });
});
