import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/invoices",
}));

import DisputesPage from "@/app/disputes/page";
import InvoicesPage from "@/app/invoices/page";
import { formatUsd } from "@/lib/money";

describe("billing pages", () => {
  it("filters the invoice queue by status and shows an empty slice for a search miss", async () => {
    const overdue = renderToStaticMarkup(
      await InvoicesPage({
        searchParams: Promise.resolve({ status: "OVERDUE" }),
      }),
    );
    expect(overdue).toContain("INV-1043");
    expect(overdue).toContain(formatUsd(24900));
    expect(overdue).not.toContain("INV-1042");
    expect(overdue).not.toContain("INV-1048");
    expect(overdue).not.toContain("INV-1051");

    const missed = renderToStaticMarkup(
      await InvoicesPage({
        searchParams: Promise.resolve({ status: "ALL", q: "zzzz-not-in-book" }),
      }),
    );
    expect(missed).toContain("No invoices in this slice");
    expect(missed).not.toContain("INV-1043");
  });

  it("filters the dispute queue by status and shows an empty queue for declined", async () => {
    const review = renderToStaticMarkup(
      await DisputesPage({
        searchParams: Promise.resolve({ status: "NEEDS_REVIEW" }),
      }),
    );
    expect(review).toContain("dsp_1043");
    expect(review).toContain("dsp_1049");
    expect(review).toContain(formatUsd(40000));
    expect(review).not.toContain("dsp_1047");
    expect(review).not.toContain("dsp_1050");

    const declined = renderToStaticMarkup(
      await DisputesPage({
        searchParams: Promise.resolve({ status: "DECLINED" }),
      }),
    );
    expect(declined).toContain("Nothing in this queue");
    expect(declined).not.toContain("dsp_1043");
  });
});
