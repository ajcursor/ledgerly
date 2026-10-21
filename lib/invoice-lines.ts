import { isDemoBugEnabled } from "@/lib/demo/bugs";

export type BillableLine = {
  quantity: number;
  unitPriceCents: number;
  /** Days the seat was occupied. Omit both day fields for a full period. */
  occupiedDays?: number;
  daysInPeriod?: number;
};

function lineFraction(line: BillableLine): number {
  if (line.occupiedDays == null && line.daysInPeriod == null) return 1;
  const days = line.occupiedDays ?? 0;
  const period = line.daysInPeriod ?? 0;
  if (!Number.isInteger(days) || !Number.isInteger(period) || period < 1 || days < 0 || days > period) {
    throw new Error("Occupied days must fall inside the billing period.");
  }
  return days / period;
}

/**
 * Line amount in cents.
 * Whole seats multiply integer cents. A mid-cycle seat is `occupiedDays / daysInPeriod`
 * of the catalog price, rounded to the nearest cent.
 * The selected line-rounding bug still uses the spreadsheet export, which rounded
 * each line to the nearest dollar before converting back to cents.
 */
export function lineAmountCents(line: BillableLine): number {
  if (!Number.isInteger(line.quantity) || line.quantity < 0) {
    throw new Error("Quantity must be a non-negative whole number of seats.");
  }
  if (!Number.isInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
    throw new Error("Unit price must be non-negative integer cents.");
  }
  const exactCents = line.quantity * line.unitPriceCents * lineFraction(line);
  const roundTo = isDemoBugEnabled("line_rounding") ? 100 : 1;
  return Math.round(exactCents / roundTo) * roundTo;
}

export function invoiceLinesTotalCents(lines: BillableLine[]): number {
  return lines.reduce((total, line) => total + lineAmountCents(line), 0);
}
