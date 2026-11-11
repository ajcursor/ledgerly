import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CollectionsPage from "@/app/collections/page";
import { pastDueLabel } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

describe("past due label", () => {
  it("uses the singular day label only for one day past due", () => {
    expect(pastDueLabel(1)).toBe("1 day past due");
    expect(pastDueLabel(0)).toBe("0 days past due");
    expect(pastDueLabel(14)).toBe("14 days past due");
    expect(pastDueLabel(-3)).toBe("0 days past due");
  });
});

describe("collections queue", () => {
  it("shows overdue catalog invoices with age, price, and open disputes", async () => {
    const html = renderToStaticMarkup(await CollectionsPage());

    expect(html).toContain("Cobalt Goods");
    expect(html).toContain("INV-1043");
    expect(html).toContain("Scale");
    expect(html).toContain("due Aug 9, 2026");
    expect(html).toContain("14 days past due · open dispute on file");
    expect(html).toContain(formatUsd(PLAN_PRICE_CENTS.SCALE));

    expect(html).toContain("Silverpine Outfitters");
    expect(html).toContain("INV-1047");
    expect(html).toContain("11 days past due · open dispute on file");
    expect(html).toContain(formatUsd(PLAN_PRICE_CENTS.GROWTH));

    const alder = html.slice(html.indexOf("Alder BioSystems"), html.indexOf("Blue Harbor Bank"));
    expect(alder).toContain("INV-2003");
    expect(alder).toContain("19 days past due");
    expect(alder).not.toContain("open dispute on file");

    expect(html).not.toContain("INV-1041");
    expect(html).not.toContain("INV-1042");
    expect(html).not.toContain("INV-1048");
  });
});
