import { NextResponse } from "next/server";
import { readCookie, resolveActingCustomer } from "@/lib/acting-customer";
import { isDemoModeEnabled } from "@/lib/demo/mode";
import { reportDisplayedSuggestedCreditOverRefund } from "@/lib/demo/report-suggested-credit-over-refund";
import { ACTING_CUSTOMER_COOKIE, ACTING_CUSTOMER_HEADER } from "@/lib/synthetic-customers";

/**
 * The dispute page calls this once when it is showing a suggested credit above
 * the catalog price. Enabled only when DEMO_MODE=true. Otherwise this is a 404.
 * The suggested-credit panel is unchanged; this route only reports.
 */
export async function POST(request: Request) {
  if (!isDemoModeEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const resolved = resolveActingCustomer({
    queryEmail: url.searchParams.get("as"),
    headerEmail: request.headers.get(ACTING_CUSTOMER_HEADER),
    cookieEmail: readCookie(request.headers.get("cookie"), ACTING_CUSTOMER_COOKIE),
  });
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  let body: { disputeId?: unknown; viewId?: unknown };
  try {
    body = (await request.json()) as { disputeId?: unknown; viewId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (typeof body.disputeId !== "string" || typeof body.viewId !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await reportDisplayedSuggestedCreditOverRefund({
    disputeId: body.disputeId,
    viewId: body.viewId,
    customer: resolved.customer,
  });
  if (result === "not_found") {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }
  return NextResponse.json({ reported: result === "reported" });
}
