import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NoticeBell } from "@/components/notice-bell";

const cobalt = {
  id: "dsp_1043",
  customerName: "Cobalt Goods",
  invoiceNumber: "INV-1043",
  status: "NEEDS_REVIEW",
};

describe("exception bell", () => {
  it("links an open exception to the dispute and omits the menu until it is opened", () => {
    const closed = renderToStaticMarkup(
      createElement(NoticeBell, { openDisputeCount: 1, openDisputes: [cobalt] }),
    );
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain("bg-danger");
    expect(closed).not.toContain("/disputes/dsp_1043");
    expect(closed).not.toContain("Cobalt Goods");

    const open = renderToStaticMarkup(
      createElement(NoticeBell, {
        openDisputeCount: 1,
        openDisputes: [cobalt],
        defaultOpen: true,
      }),
    );
    expect(open).toContain('aria-expanded="true"');
    expect(open).toContain('href="/disputes/dsp_1043"');
    expect(open).toContain("Cobalt Goods");
    expect(open).toContain("INV-1043");
    expect(open).toContain("dsp_1043");
    expect(open).toContain("Needs review");
    expect(open).toContain('href="/disputes"');
    expect(open).toContain("Dispute queue");
  });

  it("says the book has no open disputes and hides the count", () => {
    const html = renderToStaticMarkup(
      createElement(NoticeBell, { openDisputeCount: 0, openDisputes: [], defaultOpen: true }),
    );
    expect(html).toContain("No open disputes in this book.");
    expect(html).not.toContain("bg-danger");
    expect(html).not.toContain("/disputes/dsp_");
  });
});
