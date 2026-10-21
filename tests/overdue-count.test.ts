import { describe, expect, it } from "vitest";
import { DEMO_AS_OF } from "@/lib/clock";
import { countOverdueInvoices } from "@/lib/dashboard";

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
});
