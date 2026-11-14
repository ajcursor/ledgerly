import { describe, expect, it } from "vitest";
import { demoDay } from "@/lib/clock";
import { daysBetween, formatDate, invoiceAgingDate } from "@/lib/dates";

describe("formatDate", () => {
  it("formats the UTC calendar day, not the viewer's local day", () => {
    expect(formatDate("2026-08-23")).toBe("Aug 23, 2026");
    expect(formatDate(new Date("2026-08-23T23:30:00.000Z"))).toBe("Aug 23, 2026");
  });
});

describe("daysBetween", () => {
  it("counts whole days and rounds partial days to the nearest day", () => {
    expect(daysBetween(demoDay("2026-08-23"), demoDay("2026-08-09"))).toBe(14);
    expect(daysBetween(new Date("2026-08-23T18:00:00.000Z"), new Date("2026-08-23T00:00:00.000Z"))).toBe(1);
    expect(daysBetween(new Date("2026-08-23T06:00:00.000Z"), new Date("2026-08-23T00:00:00.000Z"))).toBe(0);
  });

  it("returns a negative count when the later date is earlier", () => {
    expect(daysBetween(demoDay("2026-08-09"), demoDay("2026-08-23"))).toBe(-14);
  });
});

describe("invoiceAgingDate", () => {
  const invoice = { dueOn: demoDay("2026-08-09"), issuedOn: demoDay("2026-07-10") };

  it("ages against the due date on the contract basis", () => {
    expect(invoiceAgingDate(invoice, "due")).toEqual(demoDay("2026-08-09"));
  });

  it("ages against the issue date when the issued basis is selected", () => {
    expect(invoiceAgingDate(invoice, "issued")).toEqual(demoDay("2026-07-10"));
  });
});
