import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NoticeBell, nextNoticeOpen } from "@/components/notice-bell";

const cobalt = {
  id: "dsp_1043",
  customerName: "Cobalt Goods",
  invoiceNumber: "INV-1043",
  status: "NEEDS_REVIEW",
};

describe("exception menu", () => {
  it("toggles from the button, closes on Escape or an outside pointer, and ignores other keys", () => {
    expect(nextNoticeOpen(false, { type: "toggle" })).toBe(true);
    expect(nextNoticeOpen(true, { type: "toggle" })).toBe(false);

    expect(nextNoticeOpen(true, { type: "key", key: "Escape" })).toBe(false);
    expect(nextNoticeOpen(false, { type: "key", key: "Escape" })).toBe(false);
    expect(nextNoticeOpen(true, { type: "key", key: "Tab" })).toBe(true);
    expect(nextNoticeOpen(true, { type: "key", key: "Enter" })).toBe(true);

    expect(nextNoticeOpen(true, { type: "pointer", inside: false })).toBe(false);
    expect(nextNoticeOpen(false, { type: "pointer", inside: false })).toBe(false);
    expect(nextNoticeOpen(true, { type: "pointer", inside: true })).toBe(true);
  });

  it("hides the menu until it is opened and shows a count only when disputes are open", () => {
    const openBook = renderToStaticMarkup(
      createElement(NoticeBell, { openDisputeCount: 2, openDisputes: [cobalt] }),
    );
    expect(openBook).toContain('aria-expanded="false"');
    expect(openBook).toContain("bg-danger");
    expect(openBook).not.toContain("/disputes/dsp_1043");
    expect(openBook).not.toContain("Cobalt Goods");
    expect(openBook).not.toContain("No open disputes in this book.");

    const clearBook = renderToStaticMarkup(
      createElement(NoticeBell, { openDisputeCount: 0, openDisputes: [] }),
    );
    expect(clearBook).toContain('aria-expanded="false"');
    expect(clearBook).not.toContain("bg-danger");
    expect(clearBook).not.toContain("/disputes/dsp_");
  });
});
