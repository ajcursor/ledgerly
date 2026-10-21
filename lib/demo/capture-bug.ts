import * as Sentry from "@sentry/nextjs";
import type { DemoErrorScenarioId, DemoFeature } from "@/lib/demo/error-scenarios";
import { applyActingCustomer, markDemoErrorCaptured } from "@/lib/sentry-user";
import type { SyntheticCustomer } from "@/lib/synthetic-customers";

/** Report a demo bug to Sentry with the acting customer's id, email, and plan. */
export function captureDemoBug(
  error: Error,
  input: {
    scenario: DemoErrorScenarioId;
    feature: DemoFeature;
    customer: SyntheticCustomer;
  },
) {
  applyActingCustomer(input.customer);
  Sentry.setTag("scenario", input.scenario);
  Sentry.setTag("feature", input.feature);
  Sentry.captureException(error, {
    fingerprint: [input.scenario],
    tags: {
      scenario: input.scenario,
      feature: input.feature,
      company: input.customer.company,
      plan: input.customer.plan,
    },
  });
  markDemoErrorCaptured(error);
}
