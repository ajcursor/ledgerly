import { describe, expect, it } from "vitest";
import { DEMO_AS_OF, DEMO_PRIOR_END, DEMO_PRIOR_START, DEMO_WINDOW_START } from "@/lib/clock";
import {
  catalogMrrCents,
  collectedCents,
  countOverdueInvoices,
  disputeBreakdown,
  disputeCentsAt,
  isOpenAt,
  isPaidInWindow,
  openCentsAt,
  percentChange,
  revenueSeries,
} from "@/lib/dashboard";
import { getDashboard } from "@/lib/data";
import { PLAN_PRICE_CENTS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

const asOf = new Date("2026-08-23T12:00:00.000Z");
const windowStart = new Date("2026-07-24T12:00:00.000Z");
const windowEnd = new Date("2026-08-23T12:00:00.000Z");

describe("dashboard collection windows", () => {
  it("counts collected cents only for invoices paid inside the window", () => {
    const invoices = [
      {
        status: "PAID",
        issuedOn: new Date("2026-07-08T12:00:00.000Z"),
        paidOn: windowStart,
        totalCents: PLAN_PRICE_CENTS.STARTER,
      },
      {
        status: "PAID",
        issuedOn: new Date("2026-07-12T12:00:00.000Z"),
        paidOn: windowEnd,
        totalCents: PLAN_PRICE_CENTS.GROWTH,
      },
      {
        status: "PAID",
        issuedOn: new Date("2026-06-16T12:00:00.000Z"),
        paidOn: new Date("2026-07-23T12:00:00.000Z"),
        totalCents: PLAN_PRICE_CENTS.SCALE,
      },
      {
        status: "PAID",
        issuedOn: new Date("2026-08-01T12:00:00.000Z"),
        paidOn: null,
        totalCents: PLAN_PRICE_CENTS.STARTER,
      },
      {
        status: "OPEN",
        issuedOn: new Date("2026-08-01T12:00:00.000Z"),
        paidOn: windowStart,
        totalCents: PLAN_PRICE_CENTS.GROWTH,
      },
    ];

    expect(isPaidInWindow(invoices[0], windowStart, windowEnd)).toBe(true);
    expect(isPaidInWindow(invoices[2], windowStart, windowEnd)).toBe(false);
    expect(isPaidInWindow(invoices[3], windowStart, windowEnd)).toBe(false);
    expect(isPaidInWindow(invoices[4], windowStart, windowEnd)).toBe(false);
    expect(collectedCents(invoices, windowStart, windowEnd)).toBe(
      PLAN_PRICE_CENTS.STARTER + PLAN_PRICE_CENTS.GROWTH,
    );
  });

  it("treats issued unpaid invoices as open and ignores void, draft, and already paid ones", () => {
    const invoices = [
      {
        status: "VOID",
        issuedOn: new Date("2026-07-01T12:00:00.000Z"),
        paidOn: null,
        totalCents: PLAN_PRICE_CENTS.STARTER,
      },
      {
        status: "DRAFT",
        issuedOn: new Date("2026-07-01T12:00:00.000Z"),
        paidOn: null,
        totalCents: PLAN_PRICE_CENTS.STARTER,
      },
      {
        status: "OPEN",
        issuedOn: new Date("2026-08-24T12:00:00.000Z"),
        paidOn: null,
        totalCents: PLAN_PRICE_CENTS.GROWTH,
      },
      {
        status: "OPEN",
        issuedOn: new Date("2026-08-01T12:00:00.000Z"),
        paidOn: new Date("2026-08-20T12:00:00.000Z"),
        totalCents: PLAN_PRICE_CENTS.GROWTH,
      },
      {
        status: "OVERDUE",
        issuedOn: new Date("2026-07-10T12:00:00.000Z"),
        paidOn: null,
        totalCents: PLAN_PRICE_CENTS.SCALE,
      },
      {
        status: "PAID",
        issuedOn: new Date("2026-07-01T12:00:00.000Z"),
        paidOn: new Date("2026-08-28T12:00:00.000Z"),
        totalCents: PLAN_PRICE_CENTS.GROWTH,
      },
    ];

    expect(invoices.slice(0, 4).map((invoice) => isOpenAt(invoice, asOf))).toEqual([
      false,
      false,
      false,
      false,
    ]);
    expect(isOpenAt(invoices[4], asOf)).toBe(true);
    expect(isOpenAt(invoices[5], asOf)).toBe(true);
    expect(openCentsAt(invoices, asOf)).toBe(PLAN_PRICE_CENTS.SCALE + PLAN_PRICE_CENTS.GROWTH);
  });

  it("sums disputes that are open as of the clock and ignores resolved or future ones", () => {
    const disputes = [
      {
        status: "OPEN",
        openedOn: new Date("2026-08-01T12:00:00.000Z"),
        disputedAmountCents: PLAN_PRICE_CENTS.GROWTH,
      },
      {
        status: "NEEDS_REVIEW",
        openedOn: asOf,
        disputedAmountCents: PLAN_PRICE_CENTS.SCALE,
      },
      {
        status: "NEEDS_REVIEW",
        openedOn: new Date("2026-08-24T12:00:00.000Z"),
        disputedAmountCents: PLAN_PRICE_CENTS.STARTER,
      },
      {
        status: "ACCEPTED",
        openedOn: new Date("2026-07-01T12:00:00.000Z"),
        disputedAmountCents: PLAN_PRICE_CENTS.GROWTH,
      },
      {
        status: "DECLINED",
        openedOn: new Date("2026-07-01T12:00:00.000Z"),
        disputedAmountCents: PLAN_PRICE_CENTS.STARTER,
      },
    ];

    expect(disputeCentsAt(disputes, asOf)).toBe(PLAN_PRICE_CENTS.GROWTH + PLAN_PRICE_CENTS.SCALE);
    expect(disputeBreakdown(disputes)).toEqual([
      expect.objectContaining({ id: "needs", count: 2 }),
      expect.objectContaining({ id: "review", count: 1 }),
      expect.objectContaining({ id: "resolved", count: 2 }),
    ]);
  });

  it("accumulates collected revenue by UTC day, holding a later same-day payment for the next point", () => {
    const start = new Date("2026-08-10T12:00:00.000Z");
    const end = new Date("2026-08-11T12:00:00.000Z");
    const invoices = [
      {
        status: "PAID",
        issuedOn: new Date("2026-08-01T12:00:00.000Z"),
        paidOn: new Date("2026-08-10T18:00:00.000Z"),
        totalCents: PLAN_PRICE_CENTS.STARTER,
      },
      {
        status: "PAID",
        issuedOn: new Date("2026-08-01T12:00:00.000Z"),
        paidOn: end,
        totalCents: PLAN_PRICE_CENTS.GROWTH,
      },
    ];

    expect(revenueSeries(invoices, start, end)).toEqual([
      { date: "2026-08-10", cents: 0 },
      { date: "2026-08-11", cents: PLAN_PRICE_CENTS.STARTER + PLAN_PRICE_CENTS.GROWTH },
    ]);
  });

  it("returns zero when both periods collected nothing", () => {
    expect(percentChange(0, 0)).toBe(0);
  });

  it("wires dashboard KPIs to the invoice and dispute snapshot it loaded", async () => {
    const [dashboard, customers] = await Promise.all([getDashboard(), prisma.customer.findMany()]);

    expect(customers.length).toBeGreaterThan(0);
    expect(dashboard.invoices.length).toBeGreaterThan(0);
    expect(dashboard.disputes.some((dispute) => dispute.id === "dsp_1049")).toBe(true);
    expect(dashboard.kpis.mrrCents).toBe(catalogMrrCents(customers));
    expect(dashboard.kpis.accountCount).toBe(customers.length);
    expect(dashboard.kpis.overdueCount).toBe(countOverdueInvoices(dashboard.invoices, DEMO_AS_OF));
    expect(dashboard.kpis.openCents).toBe(openCentsAt(dashboard.invoices, DEMO_AS_OF));
    expect(dashboard.kpis.collectedAugustCents).toBe(
      collectedCents(dashboard.invoices, DEMO_WINDOW_START, DEMO_AS_OF),
    );
    expect(dashboard.kpis.disputeCents).toBe(disputeCentsAt(dashboard.disputes, DEMO_AS_OF));
    expect(dashboard.kpis.openCount).toBe(
      dashboard.invoices.filter((invoice) => invoice.status === "OPEN" || invoice.status === "OVERDUE")
        .length,
    );
    expect(dashboard.kpis.reviewCount).toBe(
      dashboard.disputes.filter((dispute) => dispute.status === "NEEDS_REVIEW").length,
    );
    expect(dashboard.kpis.openDisputeCount).toBe(
      dashboard.disputes.filter(
        (dispute) => dispute.status === "OPEN" || dispute.status === "NEEDS_REVIEW",
      ).length,
    );
    expect(dashboard.kpis.collectedAugustCount).toBe(
      dashboard.invoices.filter(
        (invoice) =>
          invoice.status === "PAID" &&
          invoice.paidOn &&
          invoice.paidOn >= DEMO_WINDOW_START &&
          invoice.paidOn <= DEMO_AS_OF,
      ).length,
    );
    expect(dashboard.kpis.collectedChange).toBe(
      percentChange(
        collectedCents(dashboard.invoices, DEMO_WINDOW_START, DEMO_AS_OF),
        collectedCents(dashboard.invoices, DEMO_PRIOR_START, DEMO_PRIOR_END),
      ),
    );
    expect(dashboard.kpis.openChange).toBe(
      percentChange(
        openCentsAt(dashboard.invoices, DEMO_AS_OF),
        openCentsAt(dashboard.invoices, DEMO_PRIOR_END),
      ),
    );
    expect(dashboard.kpis.disputeChange).toBe(
      percentChange(
        disputeCentsAt(dashboard.disputes, DEMO_AS_OF),
        disputeCentsAt(dashboard.disputes, DEMO_PRIOR_END),
      ),
    );
    expect(dashboard.series).toEqual(revenueSeries(dashboard.invoices, DEMO_WINDOW_START, DEMO_AS_OF));
    expect(dashboard.breakdown).toEqual(disputeBreakdown(dashboard.disputes));
  });
});
