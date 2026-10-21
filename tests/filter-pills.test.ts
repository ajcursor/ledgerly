import { describe, expect, it } from "vitest";
import { filterPillHref } from "@/components/filter-pills";

describe("status filter pills", () => {
  it("writes the status query the invoice and dispute pages read", () => {
    expect(filterPillHref("/invoices", "OVERDUE")).toBe("/invoices?status=OVERDUE");
    expect(filterPillHref("/disputes", "NEEDS_REVIEW")).toBe("/disputes?status=NEEDS_REVIEW");
  });
});
