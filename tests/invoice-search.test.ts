import { describe, expect, it } from "vitest";
import { invoiceSearchHref } from "@/components/search-field";

describe("invoice search href", () => {
  it("keeps a status other than ALL and trims the query", () => {
    expect(invoiceSearchHref("OVERDUE", "  Cobalt  ")).toBe("/invoices?status=OVERDUE&q=Cobalt");
    expect(invoiceSearchHref("OVERDUE", "   ")).toBe("/invoices?status=OVERDUE");
  });

  it("omits ALL, an empty status, and a blank query", () => {
    expect(invoiceSearchHref("ALL", "   ")).toBe("/invoices");
    expect(invoiceSearchHref(undefined, "")).toBe("/invoices");
    expect(invoiceSearchHref("", "  Riverstone  ")).toBe("/invoices?q=Riverstone");
  });
});
