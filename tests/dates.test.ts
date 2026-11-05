import { describe, expect, it } from "vitest";
import { daysBetween, formatDate, invoiceAgingDate } from "@/lib/dates";

describe("billing dates", () => {
  it("formats calendar days in UTC", () => {
    expect(formatDate("2026-08-23T23:30:00.000Z")).toBe("Aug 23, 2026");
    expect(formatDate(new Date("2026-08-24T00:30:00.000Z"))).toBe("Aug 24, 2026");
  });

  it("rounds a span to the nearest day", () => {
    expect(
      daysBetween(new Date("2026-08-24T12:00:00.000Z"), new Date("2026-08-23T12:00:00.000Z")),
    ).toBe(1);
    expect(
      daysBetween(new Date("2026-08-24T18:00:00.000Z"), new Date("2026-08-23T00:00:00.000Z")),
    ).toBe(2);
    // Math.round ties toward +∞, so a negative 36-hour span is -1 day.
    expect(
      daysBetween(new Date("2026-08-23T00:00:00.000Z"), new Date("2026-08-24T12:00:00.000Z")),
    ).toBe(-1);
  });

  it("ages an invoice from the due date unless the caller selects the issue date", () => {
    const invoice = {
      dueOn: new Date("2026-09-06T12:00:00.000Z"),
      issuedOn: new Date("2026-08-07T12:00:00.000Z"),
    };
    expect(invoiceAgingDate(invoice, "due")).toBe(invoice.dueOn);
    expect(invoiceAgingDate(invoice, "issued")).toBe(invoice.issuedOn);
  });
});
