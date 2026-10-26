/**
 * The dispute page reports a suggested credit above the catalog price.
 * One report per page view: strict-mode replays reuse the token, and a real
 * unmount forgets it so the next visit can report again.
 */

const pageViews = new Map<string, { token: string; sent: boolean }>();
const pendingForget = new Map<string, ReturnType<typeof setTimeout>>();
const capturedPageViews = new Set<string>();

export const SUGGESTED_CREDIT_OVER_REFUND_REPORT_PATH = "/api/demo/suggested-credit-over-refund";

export function suggestedCreditExceedsCatalog(suggestedCreditCents: number, catalogPriceCents: number): boolean {
  return suggestedCreditCents > catalogPriceCents;
}

export function shouldReportSuggestedCreditOverRefund(input: {
  demoMode: boolean;
  creditV1Enabled: boolean;
  suggestedCreditCents: number;
  catalogPriceCents: number;
}): boolean {
  return (
    input.demoMode &&
    input.creditV1Enabled &&
    suggestedCreditExceedsCatalog(input.suggestedCreditCents, input.catalogPriceCents)
  );
}

export function openSuggestedCreditPageView(disputeId: string): void {
  const pending = pendingForget.get(disputeId);
  if (pending !== undefined) {
    clearTimeout(pending);
    pendingForget.delete(disputeId);
  }
  if (!pageViews.has(disputeId)) {
    pageViews.set(disputeId, { token: crypto.randomUUID(), sent: false });
  }
}

/** Returns the page-view token the first time this view should be sent. */
export function claimSuggestedCreditSend(disputeId: string): string | null {
  const view = pageViews.get(disputeId);
  if (!view || view.sent) return null;
  view.sent = true;
  return view.token;
}

export function closeSuggestedCreditPageView(disputeId: string): void {
  const pending = pendingForget.get(disputeId);
  if (pending !== undefined) clearTimeout(pending);
  pendingForget.set(
    disputeId,
    setTimeout(() => {
      pendingForget.delete(disputeId);
      pageViews.delete(disputeId);
    }, 0),
  );
}

/** Server-side guard so a repeated post for the same page view captures once. */
export function claimSuggestedCreditCapture(pageViewId: string): boolean {
  if (capturedPageViews.has(pageViewId)) return false;
  capturedPageViews.add(pageViewId);
  return true;
}

export function resetSuggestedCreditReportState(): void {
  for (const timer of pendingForget.values()) clearTimeout(timer);
  pendingForget.clear();
  pageViews.clear();
  capturedPageViews.clear();
}

export function postSuggestedCreditOverRefund(disputeId: string, pageViewId: string): void {
  void fetch(SUGGESTED_CREDIT_OVER_REFUND_REPORT_PATH, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ disputeId, pageViewId }),
    cache: "no-store",
    keepalive: true,
  }).catch(() => {
    // The panel already shows the credit. A missed report stays quiet.
  });
}
