import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    invoice: { findMany: vi.fn() },
    dispute: { findMany: vi.fn() },
  },
}));

import { getDisputes, getInvoices, isDisputeStatus, isInvoiceStatus } from "@/lib/data";
import { prisma } from "@/lib/prisma";

const invoices = [
  { number: "INV-1043", plan: "SCALE", status: "OVERDUE", customer: { name: "Cobalt Goods" } },
  { number: "INV-1044", plan: "GROWTH", status: "PAID", customer: { name: "Acme North" } },
  { number: "INV-1045", plan: "STARTER", status: "OPEN", customer: { name: "Riverstone Labs" } },
];

const disputes = [
  { id: "dsp_1043", status: "NEEDS_REVIEW" },
  { id: "dsp_1044", status: "OPEN" },
  { id: "dsp_1050", status: "ACCEPTED" },
];

function invoiceNumbers(rows: { number: string }[]) {
  return rows.map((row) => row.number);
}

describe("getInvoices filters", () => {
  beforeEach(() => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue(invoices as never);
  });

  it("returns every invoice when no filter is given", async () => {
    expect(invoiceNumbers(await getInvoices())).toEqual(["INV-1043", "INV-1044", "INV-1045"]);
  });

  it("treats ALL and an empty status as no status filter", async () => {
    expect(invoiceNumbers(await getInvoices({ status: "ALL" }))).toHaveLength(3);
    expect(invoiceNumbers(await getInvoices({ status: "" }))).toHaveLength(3);
  });

  it("narrows to one status and returns nothing for an unknown status", async () => {
    expect(invoiceNumbers(await getInvoices({ status: "OVERDUE" }))).toEqual(["INV-1043"]);
    expect(await getInvoices({ status: "overdue" })).toEqual([]);
  });

  it("searches number, customer name, and plan case-insensitively with trimmed input", async () => {
    expect(invoiceNumbers(await getInvoices({ q: "  acme  " }))).toEqual(["INV-1044"]);
    expect(invoiceNumbers(await getInvoices({ q: "inv-1045" }))).toEqual(["INV-1045"]);
    expect(invoiceNumbers(await getInvoices({ q: "scale" }))).toEqual(["INV-1043"]);
  });

  it("applies the status and text filters together", async () => {
    expect(await getInvoices({ status: "PAID", q: "scale" })).toEqual([]);
    expect(invoiceNumbers(await getInvoices({ status: "OPEN", q: "riverstone" }))).toEqual(["INV-1045"]);
  });

  it("queries newest-issued first with the customer and lines included", async () => {
    await getInvoices();

    expect(prisma.invoice.findMany).toHaveBeenCalledWith({
      include: expect.objectContaining({ customer: true, lines: true, disputes: true }),
      orderBy: { issuedOn: "desc" },
    });
  });
});

describe("getDisputes filters", () => {
  beforeEach(() => {
    vi.mocked(prisma.dispute.findMany).mockResolvedValue(disputes as never);
  });

  it("returns every dispute for no filter or ALL", async () => {
    expect(await getDisputes()).toHaveLength(3);
    expect(await getDisputes({ status: "ALL" })).toHaveLength(3);
  });

  it("narrows to one dispute status", async () => {
    expect(await getDisputes({ status: "NEEDS_REVIEW" })).toEqual([disputes[0]]);
    expect(await getDisputes({ status: "DECLINED" })).toEqual([]);
  });
});

describe("status validators", () => {
  it("accepts only catalog invoice statuses", () => {
    expect(isInvoiceStatus("OVERDUE")).toBe(true);
    expect(isInvoiceStatus("VOID")).toBe(true);
    expect(isInvoiceStatus("overdue")).toBe(false);
    expect(isInvoiceStatus("ALL")).toBe(false);
  });

  it("accepts only catalog dispute statuses", () => {
    expect(isDisputeStatus("NEEDS_REVIEW")).toBe(true);
    expect(isDisputeStatus("DECLINED")).toBe(true);
    expect(isDisputeStatus("VOID")).toBe(false);
    expect(isDisputeStatus("")).toBe(false);
  });
});
