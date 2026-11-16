import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { repostClosedDisputeCredit } from "@/lib/disputes/closed-credit";
import { PLAN_PRICE_CENTS } from "@/lib/plans";
import { syntheticCustomers } from "@/lib/synthetic-customers";

const customer = syntheticCustomers().find((row) => row.id === "cus_copperleaf");
if (!customer) throw new Error("Copperleaf Atelier is missing from the synthetic book.");

const ENV_KEYS = [
  "DEMO_BUGS",
  "DEMO_SCENARIO",
  "DEMO_BUGS_FILE",
  "NEXT_PUBLIC_DEMO_BUGS",
  "NEXT_PUBLIC_DEMO_SCENARIO",
] as const;

const accepted = {
  id: "dsp_1050",
  status: "ACCEPTED",
  suggestedCreditCents: PLAN_PRICE_CENTS.GROWTH,
};

function withBugs(bugs: string, fn: () => void) {
  const previous = new Map<string, string | undefined>();
  for (const key of ENV_KEYS) previous.set(key, process.env[key]);
  for (const key of ENV_KEYS) delete process.env[key];
  process.env.DEMO_BUGS = bugs;
  try {
    fn();
  } finally {
    for (const key of ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("closed dispute credit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not post another credit when the dispute is already accepted", () => {
    expect(repostClosedDisputeCredit(accepted, customer)).toBe(0);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("returns the stored credit for an open dispute even when the closed-dispute bug is on", () => {
    const open = {
      id: "dsp_1041",
      status: "OPEN",
      suggestedCreditCents: PLAN_PRICE_CENTS.GROWTH,
    };
    const review = {
      id: "dsp_1049",
      status: "NEEDS_REVIEW",
      suggestedCreditCents: PLAN_PRICE_CENTS.SCALE,
    };

    withBugs("closed_dispute_credit", () => {
      expect(repostClosedDisputeCredit(open, customer)).toBe(PLAN_PRICE_CENTS.GROWTH);
      expect(repostClosedDisputeCredit(review, customer)).toBe(PLAN_PRICE_CENTS.SCALE);
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });
});
