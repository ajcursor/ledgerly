import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { POST } from "@/app/api/demo/suggested-credit-over-refund/route";
import {
  claimSuggestedCreditView,
  displayedSuggestedCreditCents,
  shouldReportSuggestedCreditOverRefund,
} from "@/lib/demo/suggested-credit-over-refund";
import { PLAN_PRICE_CENTS } from "@/lib/plans";
import { ACTING_CUSTOMER_COOKIE, defaultActingCustomer } from "@/lib/synthetic-customers";
import { viewingAsCustomers } from "@/lib/demo/viewing-as";

const ellis = defaultActingCustomer();
const jordan = viewingAsCustomers().find((customer) => customer.id === "cus_harborline");
if (!jordan) throw new Error("Acme North is missing from the viewing-as catalog.");

const BUG_ENV = [
  "DEMO_BUGS",
  "DEMO_SCENARIO",
  "DEMO_BUGS_FILE",
  "NEXT_PUBLIC_DEMO_BUGS",
  "NEXT_PUBLIC_DEMO_SCENARIO",
] as const;

const previousDemoMode = process.env.DEMO_MODE;
const previousBugs = new Map<string, string | undefined>();

function setBugs(value: string | undefined) {
  for (const key of BUG_ENV) delete process.env[key];
  if (value !== undefined) process.env.DEMO_BUGS = value;
}

function report(disputeId: string, viewId: string, init?: { as?: string; cookie?: string }) {
  const url = new URL("http://localhost/api/demo/suggested-credit-over-refund");
  if (init?.as !== undefined) url.searchParams.set("as", init.as);
  const headers = new Headers({ "content-type": "application/json" });
  if (init?.cookie) headers.set("cookie", `${ACTING_CUSTOMER_COOKIE}=${encodeURIComponent(init.cookie)}`);
  return new Request(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ disputeId, viewId }),
  });
}

describe("suggested credit over the catalog", () => {
  beforeEach(() => {
    process.env.DEMO_MODE = "true";
    for (const key of BUG_ENV) previousBugs.set(key, process.env[key]);
    setBugs("credit_v1");
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (previousDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = previousDemoMode;
    for (const key of BUG_ENV) {
      const value = previousBugs.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("reports only when demo mode and credit_v1 are on and the credit is above the catalog", () => {
    const overScale = {
      suggestedCreditCents: 40_000,
      catalogPriceCents: PLAN_PRICE_CENTS.SCALE,
    };
    expect(
      shouldReportSuggestedCreditOverRefund({
        demoMode: true,
        creditV1Enabled: true,
        ...overScale,
      }),
    ).toBe(true);
    expect(
      shouldReportSuggestedCreditOverRefund({
        demoMode: false,
        creditV1Enabled: true,
        ...overScale,
      }),
    ).toBe(false);
    expect(
      shouldReportSuggestedCreditOverRefund({
        demoMode: true,
        creditV1Enabled: false,
        ...overScale,
      }),
    ).toBe(false);
    expect(
      shouldReportSuggestedCreditOverRefund({
        demoMode: true,
        creditV1Enabled: true,
        suggestedCreditCents: PLAN_PRICE_CENTS.SCALE,
        catalogPriceCents: PLAN_PRICE_CENTS.SCALE,
      }),
    ).toBe(false);
    expect(
      shouldReportSuggestedCreditOverRefund({
        demoMode: true,
        creditV1Enabled: true,
        suggestedCreditCents: PLAN_PRICE_CENTS.GROWTH,
        catalogPriceCents: PLAN_PRICE_CENTS.GROWTH,
      }),
    ).toBe(false);
  });

  it("shows the raw claim while credit_v1 is on and the catalog cap when it is off", () => {
    expect(
      displayedSuggestedCreditCents({
        creditV1Enabled: true,
        disputedAmountCents: 40_000,
        catalogPriceCents: PLAN_PRICE_CENTS.SCALE,
      }),
    ).toBe(40_000);
    expect(
      displayedSuggestedCreditCents({
        creditV1Enabled: false,
        disputedAmountCents: 40_000,
        catalogPriceCents: PLAN_PRICE_CENTS.SCALE,
      }),
    ).toBe(PLAN_PRICE_CENTS.SCALE);
  });

  it("claims each view id once", () => {
    expect(claimSuggestedCreditView("view-claim-a")).toBe(true);
    expect(claimSuggestedCreditView("view-claim-a")).toBe(false);
    expect(claimSuggestedCreditView("view-claim-b")).toBe(true);
  });

  it("captures dsp_1043 for Ellis when the suggested credit is above Scale", async () => {
    const response = await POST(report("dsp_1043", "view-ellis-1043", { cookie: ellis.email }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ reported: true });
    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: ellis.id,
      email: ellis.email,
      username: ellis.username,
    });
    expect(Sentry.setTag).toHaveBeenCalledWith("scenario", "suggested-credit-over-refund");
    expect(Sentry.setTag).toHaveBeenCalledWith("feature", "disputes");
    expect(Sentry.setTag).toHaveBeenCalledWith("customer.company", "Cobalt Goods");
    expect(Sentry.setTag).toHaveBeenCalledWith("fingerprint", "suggested-credit-over-refund");
    expect(Sentry.setTag).toHaveBeenCalledWith("bug_id", "credit_v1");
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
    expect(Sentry.flush).toHaveBeenCalledWith(2000);
  });

  it("does not capture when credit_v1 is disabled", async () => {
    setBugs("filter_state");

    const response = await POST(report("dsp_1043", "view-credit-v1-off", { cookie: ellis.email }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ reported: false });
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.setUser).not.toHaveBeenCalled();
  });

  it("does not capture when the suggested credit is within the catalog price", async () => {
    const growth = await POST(report("dsp_1047", "view-dsp-1047", { cookie: ellis.email }));
    const scale = await POST(report("dsp_1049", "view-dsp-1049", { cookie: ellis.email }));

    expect(growth.status).toBe(200);
    expect(scale.status).toBe(200);
    await expect(growth.json()).resolves.toEqual({ reported: false });
    await expect(scale.json()).resolves.toEqual({ reported: false });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("does not capture when DEMO_MODE is off", async () => {
    delete process.env.DEMO_MODE;

    const response = await POST(report("dsp_1043", "view-demo-off", { cookie: ellis.email }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.setUser).not.toHaveBeenCalled();
  });

  it("captures at most once for a page view", async () => {
    const first = await POST(report("dsp_1043", "view-once", { cookie: ellis.email }));
    const second = await POST(report("dsp_1043", "view-once", { cookie: ellis.email }));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(first.json()).resolves.toEqual({ reported: true });
    await expect(second.json()).resolves.toEqual({ reported: false });
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.flush).toHaveBeenCalledTimes(1);
  });

  it("attributes the acting customer from the cookie", async () => {
    const response = await POST(report("dsp_1043", "view-jordan", { cookie: jordan.email }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ reported: true });
    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: jordan.id,
      email: jordan.email,
      username: jordan.username,
    });
    expect(Sentry.setTag).toHaveBeenCalledWith("company", "Acme North");
    expect(Sentry.setTag).toHaveBeenCalledWith("customer.company", "Acme North");
    expect(Sentry.setTag).toHaveBeenCalledWith("plan", "Growth");
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: expect.objectContaining({
          company: "Acme North",
          "customer.company": "Acme North",
          plan: "Growth",
          bug_id: "credit_v1",
        }),
      }),
    );
  });
});
