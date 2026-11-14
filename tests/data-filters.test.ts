import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDisputes, getInvoices, isDisputeStatus, isInvoiceStatus } from "@/lib/data";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    invoice: { findMany: vi.fn() },
    dispute: { findMany: vi.fn() },
  },
}));

const invoiceRows = [
  { number: "INV-1043", status: "OVERDUE", plan: "GROWTH", customer: { name: "Maple & Ember Co" } },
  { number: "INV-1044", status: "OPEN", plan: "SCALE", customer: { name: "Acme North" } },
  { number: "INV-1045", status: "PAID", plan: "STARTER", customer: { name: "Cobalt Goods" } },
];

const disputeRows = [
  { id: "dsp_1043", status: "NEEDS_REVIEW" },
  { id: "dsp_1044", status: "OPEN" },
  { id: "dsp_1050", status: "ACCEPTED" },
];

describe("getInvoices filters", () => {
  beforeEach(() => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue(invoiceRows as never);
  });

  it("returns only the requested invoice status and treats ALL as no filter", async () => {
    expect((await getInvoices({ status: "OVERDUE" })).map((row) => row.number)).toEqual(["INV-1043"]);
    expect(await getInvoices({ status: "ALL" })).toHaveLength(3);
    expect(await getInvoices()).toHaveLength(3);
  });

  it("matches the search text against invoice number, customer name, or plan, ignoring case and outer spaces", async () => {
    expect((await getInvoices({ q: "growth" })).map((row) => row.number)).toEqual(["INV-1043"]);
    expect((await getInvoices({ q: "  maple " })).map((row) => row.number)).toEqual(["INV-1043"]);
    expect((await getInvoices({ q: "inv-1044" })).map((row) => row.number)).toEqual(["INV-1044"]);
    expect(await getInvoices({ q: "no such customer" })).toEqual([]);
  });
});

describe("getDisputes filters", () => {
  it("returns only disputes in the requested status and all disputes for ALL or no filter", async () => {
    vi.mocked(prisma.dispute.findMany).mockResolvedValue(disputeRows as never);

    expect((await getDisputes({ status: "NEEDS_REVIEW" })).map((row) => row.id)).toEqual(["dsp_1043"]);
    expect(await getDisputes({ status: "ALL" })).toHaveLength(3);
    expect(await getDisputes()).toHaveLength(3);
  });
});

describe("status validators", () => {
  it("accepts only catalog invoice statuses", () => {
    expect(isInvoiceStatus("OVERDUE")).toBe(true);
    expect(isInvoiceStatus("overdue")).toBe(false);
    expect(isInvoiceStatus("NEEDS_REVIEW")).toBe(false);
  });

  it("accepts only catalog dispute statuses", () => {
    expect(isDisputeStatus("NEEDS_REVIEW")).toBe(true);
    expect(isDisputeStatus("PAID")).toBe(false);
    expect(isDisputeStatus("")).toBe(false);
  });
});
