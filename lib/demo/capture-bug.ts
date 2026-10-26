import * as Sentry from "@sentry/nextjs";
import { demoBugIdForScenario } from "@/lib/demo/bugs";
import type { DemoErrorScenarioId, DemoFeature } from "@/lib/demo/error-scenarios";
import { applyActingCustomer, markDemoErrorCaptured } from "@/lib/sentry-user";
import type { SyntheticCustomer } from "@/lib/synthetic-customers";

/**
 * Report a demo bug to Sentry with the acting customer and the same
 * fingerprint and tags the trigger route uses, so both paths group together.
 */
export function captureDemoBug(
  error: Error,
  input: {
    scenario: DemoErrorScenarioId;
    feature: DemoFeature;
    customer: SyntheticCustomer;
  },
) {
  applyActingCustomer(input.customer);
  const bugId = demoBugIdForScenario(input.scenario);
  Sentry.setTag("scenario", input.scenario);
  Sentry.setTag("feature", input.feature);
  Sentry.setTag("fingerprint", input.scenario);
  if (bugId) Sentry.setTag("bug_id", bugId);
  Sentry.captureException(error, {
    fingerprint: [input.scenario],
    tags: {
      scenario: input.scenario,
      feature: input.feature,
      company: input.customer.company,
      "customer.company": input.customer.company,
      plan: input.customer.plan,
      fingerprint: input.scenario,
      ...(bugId ? { bug_id: bugId } : {}),
    },
  });
  markDemoErrorCaptured(error);
}
