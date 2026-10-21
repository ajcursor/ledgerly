export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function daysBetween(later: Date, earlier: Date): number {
  const ms = later.getTime() - earlier.getTime();
  return Math.round(ms / 86_400_000);
}

export type InvoiceAgingBasis = "due" | "issued";

/** Date an open invoice is aged against. The contract date is the due date. */
export function invoiceAgingDate(
  invoice: { dueOn: Date; issuedOn: Date },
  basis: InvoiceAgingBasis,
): Date {
  return basis === "issued" ? invoice.issuedOn : invoice.dueOn;
}
