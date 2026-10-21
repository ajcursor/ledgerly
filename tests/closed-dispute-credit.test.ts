import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { repostClosedDisputeCredit } from "@/lib/disputes/closed-credit";
import { PLAN_PRICE_CENTS } from "@/lib/plans";
import { findSyntheticCustomer } from "@/lib/synthetic-customers";

const customer = findSyntheticCustomer("studio@copperleaf.example");
if (!customer) throw new Error("Copperleaf Atelier is missing from the synthetic book.");

const accepted = {
  id: "dsp_1050",
  status: "ACCEPTED",
  suggestedCreditCents: PLAN_PRICE_CENTS.GROWTH,
};

describe("closed dispute credit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not post another credit when the dispute is already accepted", () => {
    expect(repostClosedDisputeCredit(accepted, customer)).toBe(0);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
