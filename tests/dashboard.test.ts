import { describe, expect, it } from "vitest";
import { DEMO_AS_OF, DEMO_WINDOW_START, demoDay } from "@/lib/clock";
import {
  catalogMrrCents,
  collectedCents,
  disputeBreakdown,
  disputeCentsAt,
  openCentsAt,
  percentChange,
  revenueSeries,
} from "@/lib/dashboard";

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

  it("returns zero when both periods are empty", () => {
    expect(percentChange(0, 0)).toBe(0);
  });

  it("reports a decline as a negative change", () => {
    expect(percentChange(4900, 9800)).toBe(-50);
  });
});

describe("collected cash KPI", () => {
  it("counts only PAID invoices paid inside the window, inclusive at both ends", () => {
    const invoices = [
      { status: "PAID", issuedOn: demoDay("2026-07-20"), paidOn: DEMO_WINDOW_START, dueOn: demoDay("2026-08-01"), totalCents: 4900 },
      { status: "PAID", issuedOn: demoDay("2026-07-20"), paidOn: DEMO_AS_OF, dueOn: demoDay("2026-08-01"), totalCents: 9900 },
      { status: "PAID", issuedOn: demoDay("2026-07-01"), paidOn: demoDay("2026-07-23"), dueOn: demoDay("2026-07-15"), totalCents: 24900 },
      { status: "OPEN", issuedOn: demoDay("2026-08-01"), paidOn: null, dueOn: demoDay("2026-08-31"), totalCents: 9900 },
      { status: "PAID", issuedOn: demoDay("2026-08-01"), paidOn: demoDay("2026-08-24"), dueOn: demoDay("2026-08-31"), totalCents: 4900 },
    ];

    expect(collectedCents(invoices, DEMO_WINDOW_START, DEMO_AS_OF)).toBe(4900 + 9900);
  });
});

describe("open receivables KPI", () => {
  it("keeps an invoice open at the as-of date until it was paid, and skips void and draft", () => {
    const base = { issuedOn: demoDay("2026-08-01"), dueOn: demoDay("2026-08-31") };
    const invoices = [
      { ...base, status: "OPEN", paidOn: null, totalCents: 4900 },
      { ...base, status: "PAID", paidOn: demoDay("2026-08-24"), totalCents: 9900 },
      { ...base, status: "PAID", paidOn: demoDay("2026-08-20"), totalCents: 24900 },
      { ...base, status: "VOID", paidOn: null, totalCents: 4900 },
      { ...base, status: "DRAFT", paidOn: null, totalCents: 4900 },
      { ...base, issuedOn: demoDay("2026-08-30"), status: "OPEN", paidOn: null, totalCents: 9900 },
    ];

    expect(openCentsAt(invoices, DEMO_AS_OF)).toBe(4900 + 9900);
  });
});

describe("dispute exposure KPI", () => {
  it("counts only open and needs-review disputes opened by the as-of date", () => {
    const disputes = [
      { status: "OPEN", openedOn: demoDay("2026-08-10"), disputedAmountCents: 4900 },
      { status: "NEEDS_REVIEW", openedOn: demoDay("2026-08-15"), disputedAmountCents: 9900 },
      { status: "ACCEPTED", openedOn: demoDay("2026-08-12"), disputedAmountCents: 24900 },
      { status: "DECLINED", openedOn: demoDay("2026-08-12"), disputedAmountCents: 24900 },
      { status: "OPEN", openedOn: demoDay("2026-08-30"), disputedAmountCents: 24900 },
    ];

    expect(disputeCentsAt(disputes, DEMO_AS_OF)).toBe(4900 + 9900);
  });
});

describe("revenueSeries", () => {
  it("accumulates in-window payments day by day through the window end", () => {
    const invoices = [
      { status: "PAID", issuedOn: demoDay("2026-08-01"), paidOn: demoDay("2026-08-20"), dueOn: demoDay("2026-08-31"), totalCents: 9900 },
      { status: "PAID", issuedOn: demoDay("2026-08-01"), paidOn: demoDay("2026-08-21"), dueOn: demoDay("2026-08-31"), totalCents: 4900 },
      { status: "PAID", issuedOn: demoDay("2026-08-01"), paidOn: demoDay("2026-08-24"), dueOn: demoDay("2026-08-31"), totalCents: 24900 },
      { status: "PAID", issuedOn: demoDay("2026-07-01"), paidOn: demoDay("2026-07-10"), dueOn: demoDay("2026-07-31"), totalCents: 4900 },
    ];

    expect(revenueSeries(invoices, demoDay("2026-08-20"), demoDay("2026-08-23"))).toEqual([
      { date: "2026-08-20", cents: 9900 },
      { date: "2026-08-21", cents: 14800 },
      { date: "2026-08-22", cents: 14800 },
      { date: "2026-08-23", cents: 14800 },
    ]);
  });
});

describe("disputeBreakdown", () => {
  it("groups statuses into needs response, in review, and resolved", () => {
    const disputes = [
      { status: "NEEDS_REVIEW", openedOn: demoDay("2026-08-10"), disputedAmountCents: 0 },
      { status: "NEEDS_REVIEW", openedOn: demoDay("2026-08-11"), disputedAmountCents: 0 },
      { status: "OPEN", openedOn: demoDay("2026-08-12"), disputedAmountCents: 0 },
      { status: "ACCEPTED", openedOn: demoDay("2026-08-13"), disputedAmountCents: 0 },
      { status: "DECLINED", openedOn: demoDay("2026-08-14"), disputedAmountCents: 0 },
    ];

    expect(disputeBreakdown(disputes).map((slice) => [slice.id, slice.count])).toEqual([
      ["needs", 2],
      ["review", 1],
      ["resolved", 2],
    ]);
  });
});
