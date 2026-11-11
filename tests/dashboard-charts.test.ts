import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children?: ReactNode;
    className?: string;
  }) => createElement("a", { href, className }, children),
}));

import { DisputeDonut } from "@/components/charts/dispute-donut";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { formatUsd } from "@/lib/money";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

const scale = PLAN_PRICE_CENTS.SCALE;

describe("collected revenue chart", () => {
  it("formats collected revenue in UTC and hides a null or outsized change", () => {
    const series = [
      { date: "2026-08-22", cents: scale },
      { date: "2026-08-23", cents: scale * 2 },
    ];
    const shown = renderToStaticMarkup(
      createElement(RevenueChart, {
        series,
        totalCents: scale * 2,
        change: 12.5,
      }),
    );

    expect(shown).toContain(formatUsd(scale * 2));
    expect(shown).toContain("+12.5%");
    expect(shown).toContain("Aug 22");
    expect(shown).toContain("Aug 23");
    expect(shown).toContain("$0");
    expect(shown).toContain("$600");
    expect(shown).toContain("C");

    const hidden = renderToStaticMarkup(
      createElement(RevenueChart, { series, totalCents: scale * 2, change: null }),
    );
    expect(hidden).not.toContain("↗");
    expect(hidden).not.toContain("↘");

    const outsized = renderToStaticMarkup(
      createElement(RevenueChart, { series, totalCents: scale * 2, change: 80.1 }),
    );
    expect(outsized).not.toContain("80.1%");
    expect(outsized).not.toContain("↗");
  });

  it("draws no curve for one day and still renders an empty series", () => {
    const oneDay = renderToStaticMarkup(
      createElement(RevenueChart, {
        series: [{ date: "2026-08-23", cents: PLAN_PRICE_CENTS.STARTER }],
        totalCents: PLAN_PRICE_CENTS.STARTER,
        change: -4.24,
      }),
    );
    expect(oneDay).toContain(formatUsd(PLAN_PRICE_CENTS.STARTER));
    expect(oneDay).toContain("−4.2%");
    expect(oneDay).toContain('d=""');

    const empty = renderToStaticMarkup(
      createElement(RevenueChart, { series: [], totalCents: 0, change: 0 }),
    );
    expect(empty).toContain(formatUsd(0));
    expect(empty).toContain("+0%");
    expect(empty).not.toContain("NaN");
  });
});

describe("dispute mix chart", () => {
  it("shows each dispute share and treats an empty mix as zero", () => {
    const html = renderToStaticMarkup(
      createElement(DisputeDonut, {
        slices: [
          { id: "needs", label: "Needs response", count: 1, color: "#dc2626" },
          { id: "review", label: "In review", count: 1, color: "#d97706" },
          { id: "resolved", label: "Resolved", count: 2, color: "#4f46e5" },
        ],
      }),
    );

    expect(html).toContain("Needs response");
    expect(html).toContain("(25%)");
    expect(html).toContain("(50%)");
    expect(html).toContain('href="/disputes"');
    expect(html).not.toContain("NaN");

    const empty = renderToStaticMarkup(
      createElement(DisputeDonut, {
        slices: [
          { id: "needs", label: "Needs response", count: 0, color: "#dc2626" },
          { id: "review", label: "In review", count: 0, color: "#d97706" },
          { id: "resolved", label: "Resolved", count: 0, color: "#4f46e5" },
        ],
      }),
    );
    expect(empty).toContain(">0<");
    expect(empty).toContain("(0%)");
    expect(empty).not.toContain("NaN");
  });
});
