import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FilterPills, filterPillHref, statusFilterQueryKey } from "@/components/filter-pills";

describe("status filter pills", () => {
  it("writes the status query the invoice and dispute pages read", () => {
    expect(filterPillHref("/invoices", "OVERDUE")).toBe("/invoices?status=OVERDUE");
    expect(filterPillHref("/disputes", "NEEDS_REVIEW")).toBe("/disputes?status=NEEDS_REVIEW");
  });

  it("keeps the invoice search on every pill and drops a blank search", () => {
    const items = [
      { id: "ALL", label: "All" },
      { id: "OVERDUE", label: "Overdue" },
    ];
    const key = statusFilterQueryKey();
    const html = renderToStaticMarkup(
      createElement(FilterPills, {
        pathname: "/invoices",
        value: "OVERDUE",
        extra: { q: "Riverstone" },
        items,
      }),
    );

    expect(html).toContain(`href="/invoices?${key}=OVERDUE&amp;q=Riverstone"`);
    expect(html).toContain('href="/invoices?q=Riverstone"');
    expect(html).toContain("border-indigo bg-indigo");
    expect(html).toContain(">Overdue</a>");

    const blank = renderToStaticMarkup(
      createElement(FilterPills, {
        pathname: "/invoices",
        value: "ALL",
        extra: { q: "" },
        items,
      }),
    );
    expect(blank).toContain('href="/invoices"');
    expect(blank).not.toContain("q=");
  });
});
