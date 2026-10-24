import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { readCookie, resolveActingCustomer } from "@/lib/acting-customer";
import { demoBugIdForScenario } from "@/lib/demo/bugs";
import { demoErrorScenario, demoErrorScenarioIds } from "@/lib/demo/error-scenarios";
import { isDemoModeEnabled } from "@/lib/demo/mode";
import { applyActingCustomer, markDemoErrorCaptured } from "@/lib/sentry-user";
import { ACTING_CUSTOMER_COOKIE, ACTING_CUSTOMER_HEADER } from "@/lib/synthetic-customers";

/**
 * Throws a seeded demo error so Sentry can capture it.
 * Enabled only when DEMO_MODE=true. Otherwise this is a 404.
 */
export async function GET(request: Request) {
  if (!isDemoModeEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const scenario = demoErrorScenario(url.searchParams.get("scenario"));
  if (!scenario) {
    return NextResponse.json(
      { error: "Unknown scenario", scenarios: demoErrorScenarioIds() },
      { status: 400 },
    );
  }

  const resolved = resolveActingCustomer({
    queryEmail: url.searchParams.get("as"),
    headerEmail: request.headers.get(ACTING_CUSTOMER_HEADER),
    cookieEmail: readCookie(request.headers.get("cookie"), ACTING_CUSTOMER_COOKIE),
  });
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const { customer } = resolved;
  applyActingCustomer(customer);
  const bugId = demoBugIdForScenario(scenario.id);
  Sentry.setTag("scenario", scenario.id);
  Sentry.setTag("feature", scenario.feature);
  Sentry.setTag("fingerprint", scenario.id);
  if (bugId) Sentry.setTag("bug_id", bugId);

  const error = scenario.createError();
  Sentry.captureException(error, {
    fingerprint: [scenario.id],
    tags: {
      scenario: scenario.id,
      feature: scenario.feature,
      company: customer.company,
      "customer.company": customer.company,
      plan: customer.plan,
      fingerprint: scenario.id,
      ...(bugId ? { bug_id: bugId } : {}),
    },
  });
  markDemoErrorCaptured(error);
  // onRequestError skips this error, so it never reaches the flush inside
  // captureRequestError. Wait here or the thrown 500 drops the envelope.
  try {
    await Sentry.flush(2000);
  } catch {
    // The seeded error is the response. A failed send must not replace it.
  }
  throw error;
}
