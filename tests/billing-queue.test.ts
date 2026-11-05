import { describe, expect, it } from "vitest";
import {
  DASHBOARD_WINDOWS,
  catalogMrrCents,
  collectedCents,
  disputeCentsAt,
  openCentsAt,
  percentChange,
} from "@/lib/dashboard";
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
import { prisma } from "@/lib/prisma";

const ENV_KEYS = [
  "DEMO_BUGS",
  "DEMO_SCENARIO",
  "DEMO_BUGS_FILE",
  "NEXT_PUBLIC_DEMO_BUGS",
  "NEXT_PUBLIC_DEMO_SCENARIO",
] as const;

async function withDefaultBugs(fn: () => Promise<void>) {
  const previous = new Map<string, string | undefined>();
  for (const key of ENV_KEYS) previous.set(key, process.env[key]);
  for (const key of ENV_KEYS) delete process.env[key];
  try {
    await fn();
  } finally {
    for (const key of ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("billing queue", () => {
  it("returns the full invoice queue for ALL and an empty queue for an unknown status", async () => {
    const all = await getInvoices();
    const explicitAll = await getInvoices({ status: "ALL" });
    const overdue = await getInvoices({ status: "OVERDUE" });

    expect(explicitAll.map((invoice) => invoice.id)).toEqual(all.map((invoice) => invoice.id));
    expect(overdue.map((invoice) => invoice.id)).toEqual(
      all.filter((invoice) => invoice.status === "OVERDUE").map((invoice) => invoice.id),
    );
    expect(overdue.some((invoice) => invoice.id === "inv_1041")).toBe(false);
    expect(await getInvoices({ status: "overdue" })).toEqual([]);
    expect(await getInvoices({ status: "PAST_DUE" })).toEqual([]);
  });

  it("matches invoice search on customer and plan, and combines it with status", async () => {
    const byCustomer = await getInvoices({ q: "ACME NORTH" });
    expect(byCustomer.length).toBeGreaterThan(0);
    expect(byCustomer.every((invoice) => invoice.customer.name === "Acme North")).toBe(true);
    expect(byCustomer.some((invoice) => invoice.id === "inv_1041")).toBe(true);
    expect(byCustomer.some((invoice) => invoice.id === "inv_1043")).toBe(false);

    const byPlan = await getInvoices({ q: "scale" });
    expect(byPlan.every((invoice) => invoice.plan === "SCALE")).toBe(true);
    expect(byPlan.some((invoice) => invoice.id === "inv_1043")).toBe(true);
    expect(byPlan.some((invoice) => invoice.id === "inv_1042")).toBe(false);

    const combined = await getInvoices({ status: "OVERDUE", q: "  cobalt  " });
    expect(combined.map((invoice) => invoice.id)).toEqual(["inv_1043"]);
    expect(await getInvoices({ q: "not-a-real-account" })).toEqual([]);
  });

  it("returns the full dispute queue for ALL and an empty queue for an unknown status", async () => {
    const all = await getDisputes();
    const explicitAll = await getDisputes({ status: "ALL" });
    const needsReview = await getDisputes({ status: "NEEDS_REVIEW" });

    expect(explicitAll.map((dispute) => dispute.id)).toEqual(all.map((dispute) => dispute.id));
    expect(needsReview.map((dispute) => dispute.id).sort()).toEqual(["dsp_1043", "dsp_1049"]);
    expect(await getDisputes({ status: "needs_review" })).toEqual([]);
  });

  it("loads an invoice, a dispute, and the workspace, and returns null for an unknown id", async () => {
    const invoice = await getInvoice("inv_1043");
    expect(invoice).toMatchObject({
      number: "INV-1043",
      plan: "SCALE",
      customer: { name: "Cobalt Goods" },
    });
    expect(await getInvoice("inv_missing")).toBeNull();

    const dispute = await getDispute("dsp_1049");
    expect(dispute).toMatchObject({
      status: "NEEDS_REVIEW",
      invoice: { number: "INV-1049", customer: { name: "Tidewatch Logistics" } },
    });
    expect(await getDispute("dsp_missing")).toBeNull();

    await expect(getWorkspace()).resolves.toMatchObject({
      id: "ws_fieldnote",
      name: "Fieldnote Workspace",
    });
  });

  it("lists open dispute notices newest first and leaves closed disputes out", async () => {
    const notices = await getOpenDisputeNotices();
    const count = await getOpenDisputeCount();

    expect(notices.map((notice) => notice.id)).toEqual(["dsp_1041", "dsp_1049", "dsp_1047", "dsp_1043"]);
    expect(notices.find((notice) => notice.id === "dsp_1049")).toEqual({
      id: "dsp_1049",
      customerName: "Tidewatch Logistics",
      invoiceNumber: "INV-1049",
      status: "NEEDS_REVIEW",
    });
    expect(count).toBe(notices.length);
  });

  it("assembles dashboard cash, overdue, and dispute totals from the seeded book", async () => {
    await withDefaultBugs(async () => {
      const dashboard = await getDashboard();
      const customers = await prisma.customer.findMany();
      const { invoices, disputes, kpis, series, breakdown } = dashboard;
      const { currentStart, currentEnd, priorStart, priorEnd } = DASHBOARD_WINDOWS;
      const overdue = invoices.filter(
        (invoice) =>
          invoice.status !== "PAID" &&
          invoice.status !== "VOID" &&
          invoice.status !== "DRAFT" &&
          invoice.dueOn.getTime() < currentEnd.getTime(),
      );

      expect(kpis.accountCount).toBe(customers.length);
      expect(kpis.mrrCents).toBe(catalogMrrCents(customers));
      expect(kpis.openCount).toBe(
        invoices.filter((invoice) => invoice.status === "OPEN" || invoice.status === "OVERDUE").length,
      );
      expect(kpis.overdueCount).toBe(overdue.length);
      expect(overdue.map((invoice) => invoice.id)).toEqual(expect.arrayContaining(["inv_1043", "inv_1047"]));
      expect(
        overdue.some(
          (invoice) => invoice.id === "inv_1041" || invoice.id === "inv_1048" || invoice.id === "inv_1051",
        ),
      ).toBe(false);
      expect(kpis.openCents).toBe(openCentsAt(invoices, currentEnd));
      expect(kpis.openChange).toBe(percentChange(kpis.openCents, openCentsAt(invoices, priorEnd)));
      expect(kpis.collectedAugustCents).toBe(collectedCents(invoices, currentStart, currentEnd));
      expect(kpis.collectedAugustCount).toBe(
        invoices.filter(
          (invoice) =>
            invoice.status === "PAID" &&
            invoice.paidOn != null &&
            invoice.paidOn >= currentStart &&
            invoice.paidOn <= currentEnd,
        ).length,
      );
      expect(kpis.collectedChange).toBe(
        percentChange(kpis.collectedAugustCents, collectedCents(invoices, priorStart, priorEnd)),
      );
      // Open-dispute dollars use the claim, including dsp_1043's $400, not the capped credit.
      expect(kpis.disputeCents).toBe(40_000 + 9_900 + 24_900 + 9_900);
      expect(kpis.disputeCents).toBe(disputeCentsAt(disputes, currentEnd));
      expect(kpis.disputeChange).toBe(percentChange(kpis.disputeCents, disputeCentsAt(disputes, priorEnd)));
      expect(kpis.reviewCount).toBe(2);
      expect(kpis.openDisputeCount).toBe(4);
      expect(series).toHaveLength(31);
      expect(series[0]?.date).toBe("2026-07-24");
      expect(series.at(-1)).toEqual({ date: "2026-08-23", cents: kpis.collectedAugustCents });
      for (let index = 1; index < series.length; index += 1) {
        expect(series[index].cents).toBeGreaterThanOrEqual(series[index - 1].cents);
      }
      expect(breakdown).toEqual([
        expect.objectContaining({ id: "needs", label: "Needs response", count: 2 }),
        expect.objectContaining({ id: "review", label: "In review", count: 2 }),
        expect.objectContaining({ id: "resolved", label: "Resolved", count: 1 }),
      ]);
    });
  });
});
