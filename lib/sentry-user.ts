import * as Sentry from "@sentry/nextjs";
import type { SyntheticCustomer } from "@/lib/synthetic-customers";

const CAPTURED = Symbol.for("ledgerly.demoErrorCaptured");

/** Attach the acting customer to the active Sentry scope (client or server). */
export function applyActingCustomer(customer: SyntheticCustomer) {
  Sentry.setUser({
    id: customer.id,
    email: customer.email,
    username: customer.username,
  });
  Sentry.setTag("company", customer.company);
  Sentry.setTag("customer.company", customer.company);
  Sentry.setTag("plan", customer.plan);
}

export function markDemoErrorCaptured(error: Error) {
  Object.defineProperty(error, CAPTURED, { value: true });
}

export function isDemoErrorCaptured(error: unknown): boolean {
  return typeof error === "object" && error !== null && CAPTURED in error;
}
