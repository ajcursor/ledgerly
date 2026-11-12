import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FileText } from "lucide-react";
import { describe, expect, it } from "vitest";
import { KpiCard } from "@/components/kpi-card";
import { formatUsd } from "@/lib/money";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

function card(change?: number | null) {
  return renderToStaticMarkup(
    createElement(KpiCard, {
      label: "Open Invoices",
      value: formatUsd(PLAN_PRICE_CENTS.SCALE),
      hint: "vs prior window",
      change,
      icon: FileText,
    }),
  );
}

describe("kpi period change", () => {
  it("hides a missing or outsized change and shows a modest one", () => {
    const value = formatUsd(PLAN_PRICE_CENTS.SCALE);

    const plain = card(undefined);
    expect(plain).toContain(value);
    expect(plain).toContain("vs prior window");
    expect(plain).not.toContain("%");

    const missing = card(null);
    expect(missing).toContain("vs prior window");
    expect(missing).not.toContain("%");

    expect(card(12.54)).toContain("↗ +12.5%");
    expect(card(-4.24)).toContain("↘ \u22124.2%");
    expect(card(80)).toContain("+80%");

    const wild = card(80.1);
    expect(wild).toContain("vs prior window");
    expect(wild).not.toContain("%");
    expect(card(-351)).not.toContain("%");
  });
});
