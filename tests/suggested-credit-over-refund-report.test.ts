import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { POST } from "@/app/api/demo/suggested-credit-over-refund/route";
import { PLAN_PRICE_CENTS } from "@/lib/plans";
import {
  claimSuggestedCreditCapture,
  claimSuggestedCreditSend,
  closeSuggestedCreditPageView,
  openSuggestedCreditPageView,
  resetSuggestedCreditReportState,
  shouldReportSuggestedCreditOverRefund,
} from "@/lib/demo/suggested-credit-report";
import { viewingAsCustomers } from "@/lib/demo/viewing-as";
import { ACTING_CUSTOMER_COOKIE, defaultActingCustomer } from "@/lib/synthetic-customers";

const ellis = defaultActingCustomer();
const jordan = viewingAsCustomers().find((customer) => customer.id === "cus_harborline");
if (!jordan) throw new Error("Acme North is missing from the viewing-as catalog.");

const ENV_KEYS = [
  "DEMO_MODE",
  "DEMO_BUGS",
  "DEMO_SCENARIO",
  "DEMO_BUGS_FILE",
  "NEXT_PUBLIC_DEMO_BUGS",
  "NEXT_PUBLIC_DEMO_SCENARIO",
] as const;

const overCatalog = {
  demoMode: true,
  creditV1Enabled: true,
  suggestedCreditCents: 40_000,
  catalogPriceCents: PLAN_PRICE_CENTS.SCALE,
};

function restoreEnv(previous: Map<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    const value = previous.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

async function withEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>>, fn: () => Promise<void>) {
  const previous = new Map<string, string | undefined>(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
  for (const [key, value] of Object.entries(values)) process.env[key] = value;
  try {
    await fn();
  } finally {
    restoreEnv(previous);
  }
}

function postReport(
  disputeId: string,
  pageViewId: string,
  init?: { as?: string; cookie?: string },
) {
  const url = new URL("http://localhost/api/demo/suggested-credit-over-refund");
  if (init?.as !== undefined) url.searchParams.set("as", init.as);
  const headers = new Headers({ "content-type": "application/json" });
  if (init?.cookie) {
    headers.set("cookie", `${ACTING_CUSTOMER_COOKIE}=${encodeURIComponent(init.cookie)}`);
  }
  return POST(
    new Request(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ disputeId, pageViewId }),
    }),
  );
}

describe("shouldReportSuggestedCreditOverRefund", () => {
  it("reports when the credit is over the catalog price and credit_v1 is enabled", () => {
    expect(shouldReportSuggestedCreditOverRefund(overCatalog)).toBe(true);
  });

  it("does not report when demo mode is off", () => {
    expect(shouldReportSuggestedCreditOverRefund({ ...overCatalog, demoMode: false })).toBe(false);
  });

  it("does not report when credit_v1 is disabled", () => {
    expect(shouldReportSuggestedCreditOverRefund({ ...overCatalog, creditV1Enabled: false })).toBe(false);
  });

  it("does not report when the credit is under or equal to the catalog price", () => {
    expect(shouldReportSuggestedCreditOverRefund({ ...overCatalog, suggestedCreditCents: 10_000 })).toBe(false);
    expect(
      shouldReportSuggestedCreditOverRefund({
        ...overCatalog,
        suggestedCreditCents: PLAN_PRICE_CENTS.SCALE,
      }),
    ).toBe(false);
  });
});

describe("suggested credit page view", () => {
  afterEach(() => {
    resetSuggestedCreditReportState();
    vi.useRealTimers();
  });

  it("sends once per page view, including a strict-mode replay", () => {
    vi.useFakeTimers();
    openSuggestedCreditPageView("dsp_1043");
    closeSuggestedCreditPageView("dsp_1043");
    openSuggestedCreditPageView("dsp_1043");

    const first = claimSuggestedCreditSend("dsp_1043");
    expect(claimSuggestedCreditSend("dsp_1043")).toBeNull();
    expect(first).toEqual(expect.any(String));
  });

  it("sends again after the page view ends", () => {
    vi.useFakeTimers();
    openSuggestedCreditPageView("dsp_1043");
    const first = claimSuggestedCreditSend("dsp_1043");
    closeSuggestedCreditPageView("dsp_1043");
    vi.runAllTimers();
    openSuggestedCreditPageView("dsp_1043");
    const second = claimSuggestedCreditSend("dsp_1043");

    expect(first).toEqual(expect.any(String));
    expect(second).toEqual(expect.any(String));
    expect(second).not.toBe(first);
  });

  it("captures a page view id once on the server", () => {
    expect(claimSuggestedCreditCapture("page-view-1")).toBe(true);
    expect(claimSuggestedCreditCapture("page-view-1")).toBe(false);
    expect(claimSuggestedCreditCapture("page-view-2")).toBe(true);
  });
});

describe("suggested credit over-refund report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSuggestedCreditReportState();
  });

  afterEach(() => {
    resetSuggestedCreditReportState();
  });

  it("returns 404 and does not capture when DEMO_MODE is off", async () => {
    await withEnv({ DEMO_BUGS: "credit_v1" }, async () => {
      const response = await postReport("dsp_1043", "page-view-demo-off");

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: "Not found" });
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  it("returns 404 when DEMO_MODE is not exactly true", async () => {
    await withEnv({ DEMO_MODE: "TRUE", DEMO_BUGS: "credit_v1" }, async () => {
      const response = await postReport("dsp_1043", "page-view-demo-true");

      expect(response.status).toBe(404);
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  it("does not capture when credit_v1 is disabled", async () => {
    await withEnv({ DEMO_MODE: "true", DEMO_BUGS: "filter_state" }, async () => {
      const response = await postReport("dsp_1043", "page-view-bug-off");

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ reported: false });
      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(Sentry.setUser).not.toHaveBeenCalled();
    });
  });

  it("does not capture when the suggested credit is within the catalog price", async () => {
    await withEnv({ DEMO_MODE: "true", DEMO_BUGS: "credit_v1" }, async () => {
      const response = await postReport("dsp_1047", "page-view-under-cap");

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ reported: false });
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  it("captures the trigger-route event when dsp_1043 is over the Scale cap", async () => {
    await withEnv({ DEMO_MODE: "true", DEMO_BUGS: "credit_v1" }, async () => {
      const response = await postReport("dsp_1043", "page-view-over-cap");

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ reported: true });
      expect(Sentry.setTag).toHaveBeenCalledWith("scenario", "suggested-credit-over-refund");
      expect(Sentry.setTag).toHaveBeenCalledWith("feature", "disputes");
      expect(Sentry.setTag).toHaveBeenCalledWith("fingerprint", "suggested-credit-over-refund");
      expect(Sentry.setTag).toHaveBeenCalledWith("bug_id", "credit_v1");
      expect(Sentry.setTag).toHaveBeenCalledWith("customer.company", "Cobalt Goods");
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "SuggestedCreditOverRefundError",
          message: expect.stringMatching(
            /Suggested credit for dispute dsp_1043 would refund \$400\.00 against Scale invoice inv_1043 \(\$249\.00\)/,
          ),
        }),
        {
          fingerprint: ["suggested-credit-over-refund"],
          tags: {
            scenario: "suggested-credit-over-refund",
            feature: "disputes",
            company: "Cobalt Goods",
            "customer.company": "Cobalt Goods",
            plan: "Scale",
            fingerprint: "suggested-credit-over-refund",
            bug_id: "credit_v1",
          },
        },
      );
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: ellis.id,
        email: ellis.email,
        username: ellis.username,
      });
      expect(Sentry.flush).toHaveBeenCalledWith(2000);
    });
  });

  it("attributes the capture to the acting customer cookie", async () => {
    await withEnv({ DEMO_MODE: "true", DEMO_BUGS: "credit_v1" }, async () => {
      const response = await postReport("dsp_1043", "page-view-jordan", { cookie: jordan.email });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ reported: true });
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: jordan.id,
        email: jordan.email,
        username: jordan.username,
      });
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          fingerprint: ["suggested-credit-over-refund"],
          tags: expect.objectContaining({
            company: "Acme North",
            "customer.company": "Acme North",
            plan: "Growth",
            bug_id: "credit_v1",
            fingerprint: "suggested-credit-over-refund",
          }),
        }),
      );
    });
  });

  it("captures at most once for the same page view and again for the next one", async () => {
    await withEnv({ DEMO_MODE: "true", DEMO_BUGS: "credit_v1" }, async () => {
      const first = await postReport("dsp_1043", "page-view-once");
      const repeat = await postReport("dsp_1043", "page-view-once");
      const nextView = await postReport("dsp_1043", "page-view-next");

      await expect(first.json()).resolves.toEqual({ reported: true });
      await expect(repeat.json()).resolves.toEqual({ reported: false });
      await expect(nextView.json()).resolves.toEqual({ reported: true });
      expect(Sentry.captureException).toHaveBeenCalledTimes(2);
    });
  });

  it("returns 404 for an unknown dispute and does not capture", async () => {
    await withEnv({ DEMO_MODE: "true", DEMO_BUGS: "credit_v1" }, async () => {
      const response = await postReport("dsp_missing", "page-view-missing");

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: "Dispute not found" });
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  it("returns 400 for an unknown acting customer and does not capture", async () => {
    await withEnv({ DEMO_MODE: "true", DEMO_BUGS: "credit_v1" }, async () => {
      const response = await postReport("dsp_1043", "page-view-unknown-customer", {
        as: "person@realco.com",
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Unknown customer" });
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  it("returns 400 when the body is missing a dispute id", async () => {
    await withEnv({ DEMO_MODE: "true", DEMO_BUGS: "credit_v1" }, async () => {
      const response = await POST(
        new Request("http://localhost/api/demo/suggested-credit-over-refund", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pageViewId: "page-view-only" }),
        }),
      );

      expect(response.status).toBe(400);
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });
});
