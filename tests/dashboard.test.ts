import { describe, expect, it } from "vitest";
import {
  DASHBOARD_WINDOWS,
  catalogMrrCents,
  collectedCents,
  disputeCentsAt,
  openCentsAt,
  percentChange,
  revenueSeries,
} from "@/lib/dashboard";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

describe("catalogMrrCents", () => {
  it("sums only catalog plan prices", () => {
    expect(
      catalogMrrCents([{ plan: "STARTER" }, { plan: "GROWTH" }, { plan: "SCALE" }]),
    ).toBe(4900 + 9900 + 24900);
  });
});

describe("percentChange", () => {
  it("returns null when the prior period is empty and current is not", () => {
    expect(percentChange(9900, 0)).toBeNull();
  });

  it("computes a real lift without inventing a baseline", () => {
    expect(percentChange(19800, 9900)).toBe(100);
  });

  it("treats two empty periods as no change", () => {
    expect(percentChange(0, 0)).toBe(0);
  });
});

describe("collected and open receivables", () => {
  const { currentStart, currentEnd } = DASHBOARD_WINDOWS;

  it("counts a payment on the window edges and ignores the rest", () => {
    expect(
      collectedCents(
        [
          {
            status: "PAID",
            issuedOn: currentStart,
            paidOn: currentStart,
            totalCents: PLAN_PRICE_CENTS.STARTER,
          },
          {
            status: "PAID",
            issuedOn: currentStart,
            paidOn: currentEnd,
            totalCents: PLAN_PRICE_CENTS.GROWTH,
          },
          {
            status: "PAID",
            issuedOn: currentStart,
            paidOn: new Date(currentStart.getTime() - 1),
            totalCents: PLAN_PRICE_CENTS.SCALE,
          },
          {
            status: "PAID",
            issuedOn: currentStart,
            paidOn: new Date(currentEnd.getTime() + 1),
            totalCents: PLAN_PRICE_CENTS.SCALE,
          },
          {
            status: "OPEN",
            issuedOn: currentStart,
            paidOn: currentEnd,
            totalCents: PLAN_PRICE_CENTS.GROWTH,
          },
          {
            status: "PAID",
            issuedOn: currentStart,
            paidOn: null,
            totalCents: PLAN_PRICE_CENTS.STARTER,
          },
        ],
        currentStart,
        currentEnd,
      ),
    ).toBe(PLAN_PRICE_CENTS.STARTER + PLAN_PRICE_CENTS.GROWTH);
  });

  it("keeps a later payment in the open balance and drops void, draft, and unissued invoices", () => {
    const before = new Date(currentEnd.getTime() - 86_400_000);
    const after = new Date(currentEnd.getTime() + 86_400_000);
    expect(
      openCentsAt(
        [
          { status: "OPEN", issuedOn: before, paidOn: null, totalCents: PLAN_PRICE_CENTS.SCALE },
          { status: "OVERDUE", issuedOn: before, paidOn: null, totalCents: PLAN_PRICE_CENTS.GROWTH },
          { status: "PAID", issuedOn: before, paidOn: after, totalCents: PLAN_PRICE_CENTS.STARTER },
          { status: "PAID", issuedOn: before, paidOn: currentEnd, totalCents: PLAN_PRICE_CENTS.SCALE },
          { status: "OPEN", issuedOn: before, paidOn: before, totalCents: PLAN_PRICE_CENTS.SCALE },
          { status: "VOID", issuedOn: before, paidOn: null, totalCents: PLAN_PRICE_CENTS.SCALE },
          { status: "DRAFT", issuedOn: before, paidOn: null, totalCents: PLAN_PRICE_CENTS.GROWTH },
          { status: "OPEN", issuedOn: after, paidOn: null, totalCents: PLAN_PRICE_CENTS.STARTER },
        ],
        currentEnd,
      ),
    ).toBe(PLAN_PRICE_CENTS.SCALE + PLAN_PRICE_CENTS.GROWTH + PLAN_PRICE_CENTS.STARTER);
  });
});

describe("dispute balance", () => {
  it("sums only disputes that are open at the snapshot", () => {
    const asOf = DASHBOARD_WINDOWS.currentEnd;
    expect(
      disputeCentsAt(
        [
          { status: "OPEN", openedOn: asOf, disputedAmountCents: 40_000 },
          {
            status: "NEEDS_REVIEW",
            openedOn: new Date(asOf.getTime() - 1),
            disputedAmountCents: PLAN_PRICE_CENTS.GROWTH,
          },
          {
            status: "ACCEPTED",
            openedOn: new Date(asOf.getTime() - 1),
            disputedAmountCents: PLAN_PRICE_CENTS.SCALE,
          },
          {
            status: "DECLINED",
            openedOn: new Date(asOf.getTime() - 1),
            disputedAmountCents: PLAN_PRICE_CENTS.STARTER,
          },
          {
            status: "OPEN",
            openedOn: new Date(asOf.getTime() + 1),
            disputedAmountCents: PLAN_PRICE_CENTS.SCALE,
          },
        ],
        asOf,
      ),
    ).toBe(40_000 + PLAN_PRICE_CENTS.GROWTH);
  });
});

describe("revenue series", () => {
  it("carries collected cents forward by UTC day and leaves the days before the first payment at zero", () => {
    const start = new Date("2026-08-21T12:00:00.000Z");
    const end = new Date("2026-08-23T12:00:00.000Z");
    expect(
      revenueSeries(
        [
          { status: "PAID", issuedOn: start, paidOn: end, totalCents: PLAN_PRICE_CENTS.STARTER },
          { status: "OPEN", issuedOn: start, paidOn: null, totalCents: PLAN_PRICE_CENTS.SCALE },
          {
            status: "PAID",
            issuedOn: start,
            paidOn: new Date("2026-08-24T12:00:00.000Z"),
            totalCents: PLAN_PRICE_CENTS.SCALE,
          },
          {
            status: "PAID",
            issuedOn: start,
            paidOn: new Date("2026-08-22T00:00:00.000Z"),
            totalCents: PLAN_PRICE_CENTS.GROWTH,
          },
        ],
        start,
        end,
      ),
    ).toEqual([
      { date: "2026-08-21", cents: 0 },
      { date: "2026-08-22", cents: PLAN_PRICE_CENTS.GROWTH },
      { date: "2026-08-23", cents: PLAN_PRICE_CENTS.GROWTH + PLAN_PRICE_CENTS.STARTER },
    ]);
  });
});
