import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { filterPillHref } from "@/components/filter-pills";
import { DEMO_AS_OF } from "@/lib/clock";
import { countOverdueInvoices } from "@/lib/dashboard";
import {
  SHIPPED_TEST_TOTAL,
  bugsForScenario,
  demoBugIdForScenario,
  demoBugManifest,
  enabledDemoBugIds,
  expectedSuiteResult,
  isDemoBugEnabled,
  loadDemoBugFile,
  suiteOutputMatches,
} from "@/lib/demo/bugs";
import { repostClosedDisputeCredit } from "@/lib/disputes/closed-credit";
import { lineAmountCents } from "@/lib/invoice-lines";
import { PLAN_PRICE_CENTS } from "@/lib/plans";
import { syntheticCustomers } from "@/lib/synthetic-customers";

const ENV_KEYS = [
  "DEMO_BUGS",
  "DEMO_SCENARIO",
  "DEMO_BUGS_FILE",
  "NEXT_PUBLIC_DEMO_BUGS",
  "NEXT_PUBLIC_DEMO_SCENARIO",
] as const;

const previousEnv = new Map<string, string | undefined>();

function withEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>>, fn: () => void) {
  for (const key of ENV_KEYS) delete process.env[key];
  for (const [key, value] of Object.entries(values)) process.env[key] = value;
  fn();
}

const overdueFixtures = [
  {
    status: "OVERDUE",
    issuedOn: new Date("2026-07-10T12:00:00.000Z"),
    dueOn: new Date("2026-08-09T12:00:00.000Z"),
  },
  {
    status: "OPEN",
    issuedOn: new Date("2026-08-07T12:00:00.000Z"),
    dueOn: new Date("2026-09-06T12:00:00.000Z"),
  },
];

describe("demo bug registry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of ENV_KEYS) previousEnv.set(key, process.env[key]);
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = previousEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("keeps today's planted bugs when nothing is set", () => {
    withEnv({}, () => {
      expect(enabledDemoBugIds()).toEqual(["credit_v1", "filter_state"]);
      expect(isDemoBugEnabled("credit_v1")).toBe(true);
      expect(isDemoBugEnabled("filter_state")).toBe(true);
      expect(isDemoBugEnabled("overdue_count")).toBe(false);
      expect(isDemoBugEnabled("closed_dispute_credit")).toBe(false);
      expect(isDemoBugEnabled("line_rounding")).toBe(false);
      expect(demoBugIdForScenario("invoice-filter")).toBe("filter_state");
      expect(demoBugIdForScenario("suggested-credit-over-refund")).toBe("credit_v1");
      expect(demoBugIdForScenario("closed-dispute-resolve")).toBe("closed_dispute_credit");
    });
  });

  it("lets DEMO_BUGS replace the default set", () => {
    withEnv({ DEMO_BUGS: "overdue_count, line_rounding" }, () => {
      expect(enabledDemoBugIds()).toEqual(["overdue_count", "line_rounding"]);
    });
  });

  it("treats an empty DEMO_BUGS list as no bugs", () => {
    withEnv({ DEMO_BUGS: "" }, () => {
      expect(enabledDemoBugIds()).toEqual([]);
      expect(isDemoBugEnabled("credit_v1")).toBe(false);
    });
  });

  it("selects a preset scenario", () => {
    withEnv({ DEMO_SCENARIO: "known" }, () => {
      expect(enabledDemoBugIds()).toEqual(bugsForScenario("known"));
    });
    withEnv({ DEMO_SCENARIO: "ambiguous" }, () => {
      expect(enabledDemoBugIds()).toEqual(["overdue_count"]);
      expect(demoBugIdForScenario("invoice-filter")).toBe("overdue_count");
    });
    withEnv({ DEMO_SCENARIO: "new" }, () => {
      expect(enabledDemoBugIds()).toEqual(["closed_dispute_credit", "line_rounding"]);
    });
    withEnv({ DEMO_SCENARIO: "all" }, () => {
      expect(enabledDemoBugIds()).toHaveLength(5);
    });
  });

  it("prefers DEMO_BUGS over a scenario and a file", () => {
    withEnv(
      {
        DEMO_BUGS: "line_rounding",
        DEMO_SCENARIO: "known",
        DEMO_BUGS_FILE: "demo/scenarios/ambiguous.json",
      },
      () => {
        expect(enabledDemoBugIds()).toEqual(["line_rounding"]);
      },
    );
  });

  it("reads a scenario file", () => {
    expect(loadDemoBugFile("demo/scenarios/ambiguous.json")).toEqual(["overdue_count"]);
    expect(loadDemoBugFile("demo/scenarios/new.json")).toEqual(["closed_dispute_credit", "line_rounding"]);
    expect(loadDemoBugFile("demo/scenarios/credit-and-overdue.json")).toEqual(["credit_v1", "overdue_count"]);
    withEnv({ DEMO_BUGS_FILE: "demo/scenarios/known.json" }, () => {
      expect(enabledDemoBugIds()).toEqual(["credit_v1", "filter_state"]);
    });
  });

  it("rejects an unknown bug, an unknown scenario, and a file outside the project", () => {
    expect(() => withEnv({ DEMO_BUGS: "not_a_bug" }, () => enabledDemoBugIds())).toThrow(/Unknown demo bug/);
    expect(() => withEnv({ DEMO_SCENARIO: "enterprise" }, () => enabledDemoBugIds())).toThrow(/Unknown demo scenario/);
    expect(() => loadDemoBugFile("/etc/passwd")).toThrow(/inside the project/);
  });

  it("matches the committed manifest", () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), "demo/bugs.json"), "utf8"));
    expect(manifest).toEqual(demoBugManifest());
  });

  it("ages overdue invoices from the due date unless overdue_count is selected", () => {
    withEnv({}, () => {
      expect(countOverdueInvoices(overdueFixtures, DEMO_AS_OF)).toBe(1);
    });
    withEnv({ DEMO_BUGS: "overdue_count" }, () => {
      expect(countOverdueInvoices(overdueFixtures, DEMO_AS_OF)).toBe(2);
    });
  });

  it("rounds a prorated Growth line to the cent unless line_rounding is selected", () => {
    const line = {
      quantity: 1,
      unitPriceCents: PLAN_PRICE_CENTS.GROWTH,
      occupiedDays: 10,
      daysInPeriod: 31,
    };
    withEnv({}, () => {
      expect(lineAmountCents(line)).toBe(3194);
    });
    withEnv({ DEMO_BUGS: "line_rounding" }, () => {
      expect(lineAmountCents(line)).toBe(3200);
    });
  });

  it("refuses a second credit unless closed_dispute_credit is selected", () => {
    const customer = syntheticCustomers().find((row) => row.id === "cus_copperleaf");
    if (!customer) throw new Error("Copperleaf Atelier is missing from the synthetic book.");
    const dispute = {
      id: "dsp_1050",
      status: "ACCEPTED",
      suggestedCreditCents: PLAN_PRICE_CENTS.GROWTH,
    };

    withEnv({}, () => {
      expect(repostClosedDisputeCredit(dispute, customer)).toBe(0);
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    withEnv({ DEMO_BUGS: "closed_dispute_credit" }, () => {
      expect(() => repostClosedDisputeCredit(dispute, customer)).toThrow(
        /Cannot resolve dispute dsp_1050: status is ACCEPTED\. A second credit of \$99\.00 was posted/,
      );
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ name: "ClosedDisputeResolveError" }),
        expect.objectContaining({
          fingerprint: ["closed-dispute-resolve"],
          tags: expect.objectContaining({
            scenario: "closed-dispute-resolve",
            feature: "disputes",
            company: "Copperleaf Atelier",
            plan: "Growth",
          }),
        }),
      );
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: customer.id,
        email: customer.email,
        username: customer.username,
      });
    });
  });

  it("writes state while filter_state is on and status when it is off", () => {
    withEnv({}, () => {
      expect(filterPillHref("/invoices", "OVERDUE")).toBe("/invoices?state=OVERDUE");
      expect(filterPillHref("/disputes", "NEEDS_REVIEW")).toBe("/disputes?state=NEEDS_REVIEW");
    });
    withEnv({ DEMO_BUGS: "" }, () => {
      expect(filterPillHref("/invoices", "OVERDUE", { q: "Acme" })).toBe("/invoices?status=OVERDUE&q=Acme");
      expect(filterPillHref("/disputes", "ALL")).toBe("/disputes");
    });
  });

  it("counts one red test for each enabled bug that has one", () => {
    expect(expectedSuiteResult(["credit_v1", "filter_state"])).toEqual({
      failed: 2,
      passed: SHIPPED_TEST_TOTAL - 2,
    });
    expect(expectedSuiteResult(["overdue_count"])).toEqual({
      failed: 1,
      passed: SHIPPED_TEST_TOTAL - 1,
    });
    expect(expectedSuiteResult(["closed_dispute_credit", "line_rounding"])).toEqual({
      failed: 2,
      passed: SHIPPED_TEST_TOTAL - 2,
    });
    expect(expectedSuiteResult(bugsForScenario("all"))).toEqual({
      failed: 5,
      passed: SHIPPED_TEST_TOTAL - 5,
    });
    expect(expectedSuiteResult([])).toEqual({ failed: 0, passed: SHIPPED_TEST_TOTAL });
  });

  it("reads the vitest summary line", () => {
    expect(suiteOutputMatches(" Tests  1 failed | 63 passed (64)\n", { failed: 1, passed: 63 })).toBe(true);
    expect(suiteOutputMatches("Tests  64 passed (64)", { failed: 0, passed: 64 })).toBe(true);
    expect(suiteOutputMatches("Tests  2 failed | 62 passed (64)", { failed: 1, passed: 63 })).toBe(false);
    expect(suiteOutputMatches("Test Files  1 failed | 16 passed (17)", { failed: 1, passed: 16 })).toBe(false);
  });
});
