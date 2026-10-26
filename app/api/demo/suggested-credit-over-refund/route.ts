import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { readCookie, resolveActingCustomer } from "@/lib/acting-customer";
import { isDemoBugEnabled } from "@/lib/demo/bugs";
import { captureDemoBug } from "@/lib/demo/capture-bug";
import { DEMO_ERROR_SCENARIOS } from "@/lib/demo/error-scenarios";
import { isDemoModeEnabled } from "@/lib/demo/mode";
import {
  claimSuggestedCreditCapture,
  shouldReportSuggestedCreditOverRefund,
} from "@/lib/demo/suggested-credit-report";
import { getDispute } from "@/lib/data";
import { isPlanId, planPriceCents } from "@/lib/plans";
import { ACTING_CUSTOMER_COOKIE, ACTING_CUSTOMER_HEADER } from "@/lib/synthetic-customers";

const SCENARIO_ID = "suggested-credit-over-refund" as const;

type ReportBody = {
  disputeId: string;
  pageViewId: string;
};

function readReportBody(value: unknown): ReportBody | null {
  if (!value || typeof value !== "object") return null;
  const body = value as { disputeId?: unknown; pageViewId?: unknown };
  if (typeof body.disputeId !== "string" || typeof body.pageViewId !== "string") return null;
  const disputeId = body.disputeId.trim();
  const pageViewId = body.pageViewId.trim();
  if (!/^dsp_[A-Za-z0-9]+$/.test(disputeId)) return null;
  if (!/^[A-Za-z0-9-]{8,80}$/.test(pageViewId)) return null;
  return { disputeId, pageViewId };
}

/**
 * Captures the suggested-credit over-refund when the dispute page shows a
 * credit above the catalog price. Same event shape as the trigger route.
 * Absent unless DEMO_MODE=true. credit_v1 must be on, and the stored claim
 * must exceed the catalog price — a capped v2 amount does not report.
 */
export async function POST(request: Request) {
  if (!isDemoModeEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a dispute id and page view id" }, { status: 400 });
  }
  const parsed = readReportBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "Expected a dispute id and page view id" }, { status: 400 });
  }

  const dispute = await getDispute(parsed.disputeId);
  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }
  if (!isPlanId(dispute.invoice.plan)) {
    return NextResponse.json({ error: "Dispute invoice has an invalid plan" }, { status: 422 });
  }

  const catalogPriceCents = planPriceCents(dispute.invoice.plan);
  if (
    !shouldReportSuggestedCreditOverRefund({
      demoMode: true,
      creditV1Enabled: isDemoBugEnabled("credit_v1"),
      suggestedCreditCents: dispute.disputedAmountCents,
      catalogPriceCents,
    })
  ) {
    return NextResponse.json({ reported: false });
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

  if (!claimSuggestedCreditCapture(parsed.pageViewId)) {
    return NextResponse.json({ reported: false });
  }

  const scenario = DEMO_ERROR_SCENARIOS[SCENARIO_ID];
  const error = scenario.createError();
  captureDemoBug(error, {
    scenario: scenario.id,
    feature: scenario.feature,
    customer: resolved.customer,
  });
  try {
    await Sentry.flush(2000);
  } catch {
    // The seeded capture already ran. A failed send must not change the response.
  }
  return NextResponse.json({ reported: true });
}
