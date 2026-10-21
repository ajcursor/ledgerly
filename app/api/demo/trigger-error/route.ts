import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { readCookie, resolveActingCustomer } from "@/lib/acting-customer";
import { demoErrorScenario, demoErrorScenarioIds } from "@/lib/demo/error-scenarios";
import { applyActingCustomer, markDemoErrorCaptured } from "@/lib/sentry-user";
import { ACTING_CUSTOMER_COOKIE, ACTING_CUSTOMER_HEADER } from "@/lib/synthetic-customers";

/**
 * Throws a seeded demo error so Sentry can capture it.
 * Enabled only when DEMO_MODE=true. Otherwise this is a 404.
 *
 * Public by design: Ledgerly has no auth layer, and this route only throws
 * seeded errors for synthetic customers. DEMO_MODE must stay off outside demos.
 */
export async function GET(request: Request) {
  if (process.env.DEMO_MODE !== "true") {
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
  Sentry.setTag("scenario", scenario.id);
  Sentry.setTag("feature", scenario.feature);

  const error = scenario.createError();
  Sentry.captureException(error, {
    tags: {
      scenario: scenario.id,
      feature: scenario.feature,
      company: customer.company,
      plan: customer.plan,
    },
  });
  markDemoErrorCaptured(error);
  throw error;
}
