import { describe, expect, it } from "vitest";
import { DEMO_AS_OF, demoDay } from "@/lib/clock";
import {
  disputeBreakdown,
  isActiveDisputeAt,
  isOpenAt,
  isOverdueInvoice,
  isPaidInWindow,
  percentChange,
  revenueSeries,
} from "@/lib/dashboard";
import { daysBetween, invoiceAgingDate } from "@/lib/dates";

function invoice(overrides: Partial<{ status: string; issuedOn: Date; dueOn: Date; paidOn: Date | null; totalCents: number }>) {
  return {
    status: "OPEN",
    issuedOn: demoDay("2026-08-01"),
    dueOn: demoDay("2026-08-31"),
    paidOn: null,
    totalCents: 9900,
    ...overrides,
  };
}

describe("paid-in-window bounds", () => {
  const start = demoDay("2026-07-24");
  const end = DEMO_AS_OF;

  it("includes payments on the first and last day of the window", () => {
    expect(isPaidInWindow(invoice({ status: "PAID", paidOn: start }), start, end)).toBe(true);
    expect(isPaidInWindow(invoice({ status: "PAID", paidOn: end }), start, end)).toBe(true);
  });

  it("excludes payments just outside the window and non-PAID invoices", () => {
    expect(isPaidInWindow(invoice({ status: "PAID", paidOn: demoDay("2026-07-23") }), start, end)).toBe(false);
    expect(isPaidInWindow(invoice({ status: "OPEN", paidOn: demoDay("2026-08-01") }), start, end)).toBe(false);
  });
});

describe("open invoice and active dispute at the demo clock", () => {
  it("never counts drafts or voids as open", () => {
    expect(isOpenAt(invoice({ status: "DRAFT" }), DEMO_AS_OF)).toBe(false);
    expect(isOpenAt(invoice({ status: "VOID" }), DEMO_AS_OF)).toBe(false);
  });

  it("does not count an invoice issued after the clock", () => {
    expect(isOpenAt(invoice({ status: "OPEN", issuedOn: demoDay("2026-08-24") }), DEMO_AS_OF)).toBe(false);
  });

  it("treats a paid invoice as open until its payment date reaches the clock", () => {
    const paidLater = invoice({ status: "PAID", paidOn: demoDay("2026-08-30") });
    const paidOnClock = invoice({ status: "PAID", paidOn: DEMO_AS_OF });

    expect(isOpenAt(paidLater, DEMO_AS_OF)).toBe(true);
    expect(isOpenAt(paidOnClock, DEMO_AS_OF)).toBe(false);
  });

  it("counts only unresolved disputes opened on or before the clock", () => {
    expect(isActiveDisputeAt({ status: "NEEDS_REVIEW", openedOn: demoDay("2026-08-20"), disputedAmountCents: 1 }, DEMO_AS_OF)).toBe(true);
    expect(isActiveDisputeAt({ status: "ACCEPTED", openedOn: demoDay("2026-08-20"), disputedAmountCents: 1 }, DEMO_AS_OF)).toBe(false);
    expect(isActiveDisputeAt({ status: "OPEN", openedOn: demoDay("2026-08-24"), disputedAmountCents: 1 }, DEMO_AS_OF)).toBe(false);
  });
});

describe("dashboard deltas and series", () => {
  it("reports a decline as a negative percentage and a flat zero-to-zero change as zero", () => {
    expect(percentChange(4950, 9900)).toBe(-50);
    expect(percentChange(0, 0)).toBe(0);
  });

  it("builds a cumulative window series that includes payments on the end day only", () => {
    const start = demoDay("2026-07-24");
    const end = demoDay("2026-07-26");
    const series = revenueSeries(
      [
        invoice({ status: "PAID", paidOn: demoDay("2026-07-01"), totalCents: 300 }),
        invoice({ status: "PAID", paidOn: demoDay("2026-07-25"), totalCents: 1000 }),
        invoice({ status: "PAID", paidOn: demoDay("2026-07-26"), totalCents: 500 }),
        invoice({ status: "PAID", paidOn: demoDay("2026-07-27"), totalCents: 700 }),
      ],
      start,
      end,
    );

    expect(series).toEqual([
      { date: "2026-07-24", cents: 0 },
      { date: "2026-07-25", cents: 1000 },
      { date: "2026-07-26", cents: 1500 },
    ]);
  });

  it("groups disputes into needs response, in review, and resolved", () => {
    const counts = disputeBreakdown([
      { status: "NEEDS_REVIEW", openedOn: DEMO_AS_OF, disputedAmountCents: 0 },
      { status: "OPEN", openedOn: DEMO_AS_OF, disputedAmountCents: 0 },
      { status: "ACCEPTED", openedOn: DEMO_AS_OF, disputedAmountCents: 0 },
      { status: "DECLINED", openedOn: DEMO_AS_OF, disputedAmountCents: 0 },
    ]).map((row) => [row.id, row.count]);

    expect(counts).toEqual([
      ["needs", 1],
      ["review", 1],
      ["resolved", 2],
    ]);
  });
});

describe("overdue aging basis", () => {
  const issuedBeforeClockNotDue = invoice({
    status: "OPEN",
    issuedOn: demoDay("2026-08-10"),
    dueOn: demoDay("2026-09-09"),
  });

  it("ages by due date by default and by issue date when asked", () => {
    expect(isOverdueInvoice(issuedBeforeClockNotDue, DEMO_AS_OF, "due")).toBe(false);
    expect(isOverdueInvoice(issuedBeforeClockNotDue, DEMO_AS_OF, "issued")).toBe(true);
  });

  it("never marks collected, void, or draft invoices as overdue", () => {
    const pastDue = { issuedOn: demoDay("2026-06-01"), dueOn: demoDay("2026-07-01") };

    for (const status of ["PAID", "VOID", "DRAFT"]) {
      expect(isOverdueInvoice({ status, ...pastDue }, DEMO_AS_OF, "due")).toBe(false);
      expect(isOverdueInvoice({ status, ...pastDue }, DEMO_AS_OF, "issued")).toBe(false);
    }
    expect(isOverdueInvoice({ status: "OVERDUE", ...pastDue }, DEMO_AS_OF, "due")).toBe(true);
  });

  it("returns the due or issue date for the chosen basis", () => {
    const row = { dueOn: demoDay("2026-09-09"), issuedOn: demoDay("2026-08-10") };

    expect(invoiceAgingDate(row, "due")).toEqual(row.dueOn);
    expect(invoiceAgingDate(row, "issued")).toEqual(row.issuedOn);
  });

  it("counts whole days between two demo dates", () => {
    expect(daysBetween(demoDay("2026-08-23"), demoDay("2026-07-24"))).toBe(30);
  });
});
