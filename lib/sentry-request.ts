import * as Sentry from "@sentry/nextjs";
import { readCookie, resolveActingCustomer } from "@/lib/acting-customer";
import { demoErrorScenario } from "@/lib/demo/error-scenarios";
import { applyActingCustomer } from "@/lib/sentry-user";
import {
  ACTING_CUSTOMER_COOKIE,
  ACTING_CUSTOMER_HEADER,
  defaultActingCustomer,
} from "@/lib/synthetic-customers";

type RequestInfo = {
  path: string;
  headers: { [key: string]: string | string[] | undefined };
};

function headerValue(headers: RequestInfo["headers"], name: string): string | null {
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** Tag the active server scope before Sentry records an unhandled request error. */
export function attributeServerRequest(request: RequestInfo) {
  const url = new URL(request.path, "http://ledgerly.local");
  const resolved = resolveActingCustomer({
    queryEmail: url.searchParams.get("as"),
    headerEmail: headerValue(request.headers, ACTING_CUSTOMER_HEADER),
    cookieEmail: readCookie(headerValue(request.headers, "cookie"), ACTING_CUSTOMER_COOKIE),
  });
  const customer = "error" in resolved ? defaultActingCustomer() : resolved.customer;
  applyActingCustomer(customer);

  if (url.pathname !== "/api/demo/trigger-error") return;
  const scenario = demoErrorScenario(url.searchParams.get("scenario"));
  if (!scenario) return;
  Sentry.setTag("scenario", scenario.id);
  Sentry.setTag("feature", scenario.feature);
}
