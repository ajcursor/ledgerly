import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { readCookie, resolveActingCustomer } from "@/lib/acting-customer";
import { captureDemoBug } from "@/lib/demo/capture-bug";
import {
  demoErrorScenario,
  demoErrorScenarioIds,
  type DemoErrorScenarioId,
} from "@/lib/demo/error-scenarios";
import { isDemoModeEnabled } from "@/lib/demo/mode";
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
  const error = scenario.createError();
  captureDemoBug(error, {
    scenario: scenario.id as DemoErrorScenarioId,
    feature: scenario.feature,
    customer,
  });
  // onRequestError skips this error, so it never reaches the flush inside
  // captureRequestError. Wait here or the thrown 500 drops the envelope.
  try {
    await Sentry.flush(2000);
  } catch {
    // The seeded error is the response. A failed send must not replace it.
  }
  throw error;
}
