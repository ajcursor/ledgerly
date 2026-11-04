import { describe, expect, it } from "vitest";
import { DEMO_AS_OF } from "@/lib/clock";
import { countOverdueInvoices, isOverdueInvoice } from "@/lib/dashboard";
import { daysBetween } from "@/lib/dates";

const invoices = [
  {
    status: "OVERDUE",
    issuedOn: new Date("2026-07-10T12:00:00.000Z"),
    dueOn: new Date("2026-08-09T12:00:00.000Z"),
  },
  {
    status: "OPEN",
    issuedOn: new Date("2026-08-07T12:00:00.000Z"),
    dueOn: new Date("2026-09-06T12:00:00.000Z"),
  },
  {
    status: "PAID",
    issuedOn: new Date("2026-07-08T12:00:00.000Z"),
    dueOn: new Date("2026-08-07T12:00:00.000Z"),
  },
];

describe("overdue invoice count", () => {
  it("counts invoices whose due date is before the demo clock", () => {
    expect(countOverdueInvoices(invoices, DEMO_AS_OF)).toBe(1);
  });

  it("does not count an invoice due on the clock, or one that is paid, void, or draft", () => {
    const issuedOn = new Date("2026-07-01T12:00:00.000Z");
    const justBefore = new Date(DEMO_AS_OF.getTime() - 1);
    expect(isOverdueInvoice({ status: "OPEN", dueOn: DEMO_AS_OF, issuedOn }, DEMO_AS_OF, "due")).toBe(false);
    expect(isOverdueInvoice({ status: "OPEN", dueOn: justBefore, issuedOn }, DEMO_AS_OF, "due")).toBe(true);
    expect(
      isOverdueInvoice(
        { status: "OPEN", dueOn: new Date(DEMO_AS_OF.getTime() + 1), issuedOn },
        DEMO_AS_OF,
        "due",
      ),
    ).toBe(false);
    for (const status of ["PAID", "VOID", "DRAFT"]) {
      expect(isOverdueInvoice({ status, dueOn: justBefore, issuedOn }, DEMO_AS_OF, "due")).toBe(false);
    }
    expect(
      isOverdueInvoice(
        { status: "OPEN", issuedOn: DEMO_AS_OF, dueOn: new Date(DEMO_AS_OF.getTime() + 86_400_000) },
        DEMO_AS_OF,
        "issued",
      ),
    ).toBe(false);
    expect(
      isOverdueInvoice(
        { status: "OPEN", issuedOn: justBefore, dueOn: new Date(DEMO_AS_OF.getTime() + 86_400_000) },
        DEMO_AS_OF,
        "issued",
      ),
    ).toBe(true);
  });

  it("rounds a partial day the way past-due age is counted", () => {
    expect(daysBetween(DEMO_AS_OF, new Date("2026-08-09T12:00:00.000Z"))).toBe(14);
    expect(daysBetween(DEMO_AS_OF, DEMO_AS_OF)).toBe(0);
    expect(daysBetween(new Date("2026-08-23T12:00:00.000Z"), new Date("2026-08-23T00:00:00.000Z"))).toBe(1);
    expect(daysBetween(new Date("2026-08-23T11:00:00.000Z"), new Date("2026-08-23T00:00:00.000Z"))).toBe(0);
  });
});
