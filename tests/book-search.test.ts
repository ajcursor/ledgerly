import { describe, expect, it } from "vitest";
import { bookSearchHref } from "@/components/app-chrome";

describe("book search", () => {
  it("opens a dispute or invoice id and searches an invoice number", () => {
    expect(bookSearchHref("  dsp_1043  ")).toBe("/disputes/dsp_1043");
    expect(bookSearchHref("Dsp_1043")).toBe("/disputes/Dsp_1043");
    expect(bookSearchHref("inv_1043")).toBe("/invoices/inv_1043");
    expect(bookSearchHref("INV_1051")).toBe("/invoices/INV_1051");

    expect(bookSearchHref("INV-1043")).toBe("/invoices?q=INV-1043");
    expect(bookSearchHref("inv-1043")).toBe("/invoices?q=inv-1043");
    expect(bookSearchHref("dsp1043")).toBe("/invoices?q=dsp1043");
    expect(bookSearchHref("cobalt goods")).toBe("/invoices?q=cobalt+goods");
  });

  it("keeps a status already on the invoice queue and drops a blank query", () => {
    expect(
      bookSearchHref("  cobalt  ", { pathname: "/invoices", invoiceStatus: "OVERDUE" }),
    ).toBe("/invoices?q=cobalt&status=OVERDUE");
    expect(bookSearchHref("   ", { pathname: "/invoices", invoiceStatus: "OVERDUE" })).toBe(
      "/invoices?status=OVERDUE",
    );
    expect(bookSearchHref("   ")).toBe("/invoices");
    expect(bookSearchHref("cobalt", { pathname: "/invoices", invoiceStatus: "" })).toBe(
      "/invoices?q=cobalt",
    );
    expect(bookSearchHref("cobalt", { pathname: "/invoices", invoiceStatus: null })).toBe(
      "/invoices?q=cobalt",
    );

    expect(bookSearchHref("cobalt", { pathname: "/disputes", invoiceStatus: "OVERDUE" })).toBe(
      "/invoices?q=cobalt",
    );
    expect(
      bookSearchHref("cobalt", { pathname: "/invoices/inv_1043", invoiceStatus: "PAID" }),
    ).toBe("/invoices?q=cobalt");
    expect(bookSearchHref("dsp_1043", { pathname: "/invoices", invoiceStatus: "OVERDUE" })).toBe(
      "/disputes/dsp_1043",
    );
  });
});
