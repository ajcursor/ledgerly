// Formats integer cents as USD.
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function sumCents(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
