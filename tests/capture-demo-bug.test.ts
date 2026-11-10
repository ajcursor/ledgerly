import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { captureDemoBug } from "@/lib/demo/capture-bug";
import type { DemoErrorScenarioId } from "@/lib/demo/error-scenarios";
import { isDemoErrorCaptured } from "@/lib/sentry-user";
import { defaultActingCustomer } from "@/lib/synthetic-customers";

describe("captureDemoBug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("omits bug_id and marks the error captured when the scenario is not registered", () => {
    const error = new Error("unmapped demo failure");
    const customer = defaultActingCustomer();

    captureDemoBug(error, {
      scenario: "not-a-scenario" as DemoErrorScenarioId,
      feature: "invoices",
      customer,
    });

    expect(Sentry.setTag).not.toHaveBeenCalledWith("bug_id", expect.anything());
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      fingerprint: ["not-a-scenario"],
      tags: {
        scenario: "not-a-scenario",
        feature: "invoices",
        company: customer.company,
        "customer.company": customer.company,
        plan: customer.plan,
        fingerprint: "not-a-scenario",
      },
    });
    expect(isDemoErrorCaptured(error)).toBe(true);
  });
});
