import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DashboardPage from "@/app/page";
import { formatUsd } from "@/lib/money";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

function recentSection(html: string): string {
  const start = html.indexOf("Recent invoices");
  expect(start).toBeGreaterThanOrEqual(0);
  return html.slice(start);
}

function rowHtml(html: string, number: string): string {
  const start = html.indexOf(number);
  expect(start, number).toBeGreaterThanOrEqual(0);
  const next = html.indexOf("INV-", start + number.length);
  return html.slice(start, next === -1 ? undefined : next);
}

function badgeText(html: string): string {
  const match = html.match(/data-slot="badge"[^>]*>([^<]*)</);
  expect(match, html).not.toBeNull();
  return match?.[1] ?? "";
}

describe("dashboard recent invoices", () => {
  it("drops draft and void invoices and marks an open dispute on a collectible invoice", async () => {
    const html = renderToStaticMarkup(await DashboardPage());
    const recent = recentSection(html);

    expect(recent).not.toContain("INV-1048");
    expect(recent).not.toContain("INV-1051");

    const tidewatch = rowHtml(recent, "INV-1049");
    expect(tidewatch).toContain("Tidewatch Logistics");
    expect(tidewatch).toContain(formatUsd(PLAN_PRICE_CENTS.SCALE));
    expect(badgeText(tidewatch)).toBe("Disputed");

    const brightwell = rowHtml(recent, "INV-1057");
    expect(brightwell).toContain("Brightwell Labs");
    expect(brightwell).toContain(formatUsd(PLAN_PRICE_CENTS.GROWTH));
    expect(badgeText(brightwell)).toBe("Paid");

    expect(badgeText(rowHtml(recent, "INV-1041"))).toBe("Disputed");
    expect(rowHtml(recent, "INV-1041")).toContain("Acme North");
    expect(badgeText(rowHtml(recent, "INV-1045"))).toBe("Open");
    expect(rowHtml(recent, "INV-1045")).toContain(formatUsd(PLAN_PRICE_CENTS.STARTER));
  });
});
