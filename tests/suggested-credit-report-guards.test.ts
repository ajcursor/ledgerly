import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { POST } from "@/app/api/demo/suggested-credit-over-refund/route";

const previousDemoMode = process.env.DEMO_MODE;

function post(body: unknown, init?: { as?: string; raw?: string }) {
  const url = new URL("http://localhost/api/demo/suggested-credit-over-refund");
  if (init?.as !== undefined) url.searchParams.set("as", init.as);
  return POST(
    new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: init?.raw ?? JSON.stringify(body),
    }),
  );
}

describe("suggested credit over-refund guards", () => {
  beforeEach(() => {
    process.env.DEMO_MODE = "true";
    vi.clearAllMocks();
    vi.mocked(Sentry.flush).mockResolvedValue(true);
  });

  afterEach(() => {
    if (previousDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = previousDemoMode;
  });

  it("rejects an unknown acting customer", async () => {
    const response = await post(
      { disputeId: "dsp_1043", viewId: "view-unknown-customer" },
      { as: "missing.customer@example" },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unknown customer" });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const response = await post(undefined, { raw: "not-json" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid body" });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("rejects a body whose ids are not strings", async () => {
    const response = await post({ disputeId: "dsp_1043", viewId: 4 });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid body" });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("returns 404 when the dispute does not exist", async () => {
    const response = await post({ disputeId: "dsp_missing", viewId: "view-missing-dispute" });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Dispute not found" });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("does not report a blank or oversized view id", async () => {
    const blank = await post({ disputeId: "dsp_1043", viewId: "   " });
    const oversized = await post({ disputeId: "dsp_1043", viewId: "v".repeat(201) });

    expect(blank.status).toBe(200);
    expect(oversized.status).toBe(200);
    await expect(blank.json()).resolves.toEqual({ reported: false });
    await expect(oversized.json()).resolves.toEqual({ reported: false });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("still reports when the Sentry flush fails", async () => {
    vi.mocked(Sentry.flush).mockRejectedValueOnce(new Error("network"));

    const response = await post({ disputeId: "dsp_1043", viewId: "view-flush-fails" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ reported: true });
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
