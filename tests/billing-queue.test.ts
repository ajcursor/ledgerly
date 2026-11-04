import { describe, expect, it } from "vitest";
import { DASHBOARD_WINDOWS, percentChange } from "@/lib/dashboard";
import {
  getDashboard,
  getDispute,
  getDisputes,
  getInvoice,
  getInvoices,
  getOpenDisputeCount,
  getOpenDisputeNotices,
  getWorkspace,
} from "@/lib/data";
import { planPriceCents } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

const NOT_COLLECTIBLE = new Set(["PAID", "VOID", "DRAFT"]);

type InvoiceRow = {
  id: string;
  status: string;
  issuedOn: Date;
  dueOn: Date;
  paidOn: Date | null;
  totalCents: number;
};

type DisputeRow = {
  status: string;
  openedOn: Date;
  disputedAmountCents: number;
};

function paidInWindow(invoices: InvoiceRow[], start: Date, end: Date) {
  return invoices.filter(
    (invoice) =>
      invoice.status === "PAID" &&
      invoice.paidOn != null &&
      invoice.paidOn >= start &&
      invoice.paidOn <= end,
  );
}

function openAt(invoices: InvoiceRow[], asOf: Date) {
  return invoices.filter((invoice) => {
    if (invoice.status === "VOID" || invoice.status === "DRAFT") return false;
    if (invoice.issuedOn > asOf) return false;
    if (invoice.paidOn && invoice.paidOn <= asOf) return false;
    return invoice.status === "OPEN" || invoice.status === "OVERDUE" || invoice.status === "PAID";
  });
}

function overdueAt(invoices: InvoiceRow[], asOf: Date) {
  return invoices.filter(
    (invoice) => !NOT_COLLECTIBLE.has(invoice.status) && invoice.dueOn.getTime() < asOf.getTime(),
  );
}

function activeDisputes(disputes: DisputeRow[], asOf: Date) {
  return disputes.filter(
    (dispute) =>
      dispute.openedOn <= asOf && (dispute.status === "OPEN" || dispute.status === "NEEDS_REVIEW"),
  );
}

function sumCents(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function windowDates(start: Date, end: Date) {
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

describe("billing queue", () => {
  it("returns only the requested invoice status and the full queue for ALL or an omitted status", async () => {
    const all = await getInvoices();
    const explicitAll = await getInvoices({ status: "ALL" });
    const overdue = await getInvoices({ status: "OVERDUE" });

    expect(all.length).toBeGreaterThan(overdue.length);
    expect(explicitAll.map((invoice) => invoice.id)).toEqual(all.map((invoice) => invoice.id));
    expect(overdue.length).toBeGreaterThan(0);
    expect(overdue.every((invoice) => invoice.status === "OVERDUE")).toBe(true);
    expect(overdue.map((invoice) => invoice.id)).toEqual(
      all.filter((invoice) => invoice.status === "OVERDUE").map((invoice) => invoice.id),
    );
    expect(overdue.some((invoice) => invoice.id === "inv_1041")).toBe(false);
    expect(await getInvoices({ status: "overdue" })).toEqual([]);
  });

  it("matches invoice search on number, customer, and plan after trimming and ignoring case", async () => {
    const byNumber = await getInvoices({ q: "  inv-1043  " });
    expect(byNumber.map((invoice) => invoice.id)).toEqual(["inv_1043"]);

    const byCustomer = await getInvoices({ q: "ACME NORTH" });
    expect(byCustomer.length).toBeGreaterThan(0);
    expect(byCustomer.every((invoice) => invoice.customer.name.toLowerCase().includes("acme north"))).toBe(
      true,
    );
    expect(byCustomer.some((invoice) => invoice.id === "inv_1041")).toBe(true);
    expect(byCustomer.some((invoice) => invoice.id === "inv_1043")).toBe(false);

    const byPlan = await getInvoices({ q: "scale" });
    expect(byPlan.length).toBeGreaterThan(0);
    expect(
      byPlan.every((invoice) =>
        `${invoice.number} ${invoice.customer.name} ${invoice.plan}`.toLowerCase().includes("scale"),
      ),
    ).toBe(true);
    expect(byPlan.some((invoice) => invoice.id === "inv_1043")).toBe(true);
    expect(byPlan.some((invoice) => invoice.id === "inv_1042")).toBe(false);
  });

  it("returns no invoices for an unknown status or a search that misses", async () => {
    expect(await getInvoices({ status: "PAST_DUE" })).toEqual([]);
    expect(await getInvoices({ q: "not-a-real-account" })).toEqual([]);
  });

  it("returns only the requested dispute status and the full queue for ALL or an omitted status", async () => {
    const all = await getDisputes();
    const explicitAll = await getDisputes({ status: "ALL" });
    const needsReview = await getDisputes({ status: "NEEDS_REVIEW" });

    expect(explicitAll.map((dispute) => dispute.id)).toEqual(all.map((dispute) => dispute.id));
    expect(needsReview.length).toBeGreaterThan(0);
    expect(needsReview.every((dispute) => dispute.status === "NEEDS_REVIEW")).toBe(true);
    expect(needsReview.some((dispute) => dispute.id === "dsp_1049")).toBe(true);
    expect(needsReview.some((dispute) => dispute.id === "dsp_1050")).toBe(false);
    expect(await getDisputes({ status: "needs_review" })).toEqual([]);
  });

  it("loads an invoice, a dispute, and the workspace, and returns null for an unknown id", async () => {
    const invoice = await getInvoice("inv_1043");
    expect(invoice?.number).toBe("INV-1043");
    expect(invoice?.customer.name).toBe("Cobalt Goods");
    expect(invoice?.plan).toBe("SCALE");
    expect(await getInvoice("inv_missing")).toBeNull();

    const dispute = await getDispute("dsp_1049");
    expect(dispute?.status).toBe("NEEDS_REVIEW");
    expect(dispute?.invoice.number).toBe("INV-1049");
    expect(dispute?.invoice.customer.name).toBe("Tidewatch Logistics");
    expect(await getDispute("dsp_missing")).toBeNull();

    const workspace = await getWorkspace();
    expect(workspace).toMatchObject({ id: "ws_fieldnote", name: "Fieldnote Workspace" });
  });

  it("keeps dispute notices to the newest open rows, capped at eight", async () => {
    const notices = await getOpenDisputeNotices();
    const count = await getOpenDisputeCount();
    const rows = await prisma.dispute.findMany({
      where: { id: { in: notices.map((notice) => notice.id) } },
    });
    const openedOn = new Map(rows.map((row) => [row.id, row.openedOn.getTime()]));
    const times = notices.map((notice) => openedOn.get(notice.id));

    expect(notices.length).toBeGreaterThan(0);
    expect(notices.length).toBeLessThanOrEqual(8);
    expect(notices.every((notice) => notice.status === "OPEN" || notice.status === "NEEDS_REVIEW")).toBe(
      true,
    );
    expect(notices.map((notice) => notice.id)).toEqual(
      expect.arrayContaining(["dsp_1049", "dsp_1041"]),
    );
    expect(notices.find((notice) => notice.id === "dsp_1049")).toMatchObject({
      customerName: "Tidewatch Logistics",
      invoiceNumber: "INV-1049",
      status: "NEEDS_REVIEW",
    });
    expect(times.every((time) => time != null)).toBe(true);
    expect(times).toEqual([...times].sort((left, right) => (right ?? 0) - (left ?? 0)));
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("assembles dashboard cash, overdue, and dispute totals from the same book", async () => {
    const dashboard = await getDashboard();
    const customers = await prisma.customer.findMany();
    const { invoices, disputes, kpis, series, breakdown } = dashboard;
    const { currentStart, currentEnd, priorStart, priorEnd } = DASHBOARD_WINDOWS;
    const collectedCurrent = paidInWindow(invoices, currentStart, currentEnd);
    const collectedPrior = paidInWindow(invoices, priorStart, priorEnd);
    const openCurrent = openAt(invoices, currentEnd);
    const openPrior = openAt(invoices, priorEnd);
    const disputeCurrent = activeDisputes(disputes, currentEnd);
    const disputePrior = activeDisputes(disputes, priorEnd);
    const overdue = overdueAt(invoices, currentEnd);

    expect(customers.length).toBeGreaterThan(0);
    expect(invoices.some((invoice) => invoice.id === "inv_1043")).toBe(true);
    expect(kpis.accountCount).toBe(customers.length);
    expect(kpis.mrrCents).toBe(sumCents(customers.map((customer) => planPriceCents(customer.plan))));
    expect(kpis.openCount).toBe(
      invoices.filter((invoice) => invoice.status === "OPEN" || invoice.status === "OVERDUE").length,
    );
    expect(overdue.map((invoice) => invoice.id)).toEqual(expect.arrayContaining(["inv_1043"]));
    expect(overdue.some((invoice) => invoice.id === "inv_1042" || invoice.id === "inv_1051")).toBe(false);
    expect(kpis.overdueCount).toBe(overdue.length);
    expect(kpis.openCents).toBe(sumCents(openCurrent.map((invoice) => invoice.totalCents)));
    expect(kpis.openChange).toBe(
      percentChange(
        sumCents(openCurrent.map((invoice) => invoice.totalCents)),
        sumCents(openPrior.map((invoice) => invoice.totalCents)),
      ),
    );
    expect(kpis.collectedAugustCount).toBe(collectedCurrent.length);
    expect(kpis.collectedAugustCents).toBe(sumCents(collectedCurrent.map((invoice) => invoice.totalCents)));
    expect(collectedCurrent.some((invoice) => invoice.id === "inv_1050")).toBe(false);
    expect(kpis.collectedChange).toBe(
      percentChange(
        sumCents(collectedCurrent.map((invoice) => invoice.totalCents)),
        sumCents(collectedPrior.map((invoice) => invoice.totalCents)),
      ),
    );
    expect(kpis.disputeCents).toBe(sumCents(disputeCurrent.map((dispute) => dispute.disputedAmountCents)));
    expect(kpis.disputeChange).toBe(
      percentChange(
        sumCents(disputeCurrent.map((dispute) => dispute.disputedAmountCents)),
        sumCents(disputePrior.map((dispute) => dispute.disputedAmountCents)),
      ),
    );
    expect(kpis.reviewCount).toBe(disputes.filter((dispute) => dispute.status === "NEEDS_REVIEW").length);
    expect(kpis.openDisputeCount).toBe(
      disputes.filter((dispute) => dispute.status === "OPEN" || dispute.status === "NEEDS_REVIEW").length,
    );
    expect(series.map((point) => point.date)).toEqual(windowDates(currentStart, currentEnd));
    expect(series.at(-1)?.cents).toBe(kpis.collectedAugustCents);
    for (let index = 1; index < series.length; index += 1) {
      expect(series[index].cents).toBeGreaterThanOrEqual(series[index - 1].cents);
    }
    expect(breakdown.map((entry) => entry.label)).toEqual(["Needs response", "In review", "Resolved"]);
    expect(breakdown.map((entry) => entry.count)).toEqual([
      disputes.filter((dispute) => dispute.status === "NEEDS_REVIEW").length,
      disputes.filter((dispute) => dispute.status === "OPEN").length,
      disputes.filter((dispute) => dispute.status === "ACCEPTED" || dispute.status === "DECLINED").length,
    ]);
  });
});
