import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSuggestedCredit,
  suggestedCreditPath,
} from "@/lib/disputes/suggested-credit-api";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

const ENV_KEYS = [
  "DEMO_BUGS",
  "DEMO_SCENARIO",
  "DEMO_BUGS_FILE",
  "NEXT_PUBLIC_DEMO_BUGS",
  "NEXT_PUBLIC_DEMO_SCENARIO",
] as const;

const previousEnv = new Map<string, string | undefined>();

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = previousEnv.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  previousEnv.clear();
  vi.unstubAllGlobals();
});

function rememberEnv() {
  for (const key of ENV_KEYS) previousEnv.set(key, process.env[key]);
}

describe("suggested credit client", () => {
  it("returns the parsed credit and sends the encoded dispute id", async () => {
    const body = {
      disputeId: "dsp/1043",
      suggestedCreditCents: 40_000,
      apiVersion: "v1" as const,
    };
    const fetcher = vi.fn(async () => Response.json(body));

    await expect(getSuggestedCredit("dsp/1043", fetcher)).resolves.toEqual(body);
    expect(fetcher).toHaveBeenCalledWith(suggestedCreditPath("dsp/1043"), {
      cache: "no-store",
    });
    expect(suggestedCreditPath("dsp/1043")).toContain(encodeURIComponent("dsp/1043"));
  });

  it("throws the response status when the credit request fails", async () => {
    const fetcher = vi.fn(async () => new Response("nope", { status: 502 }));

    await expect(getSuggestedCredit("dsp_1043", fetcher)).rejects.toThrow(
      "Suggested credit request failed with status 502.",
    );
  });

  it("uses global fetch when no fetcher is passed", async () => {
    const body = {
      disputeId: "dsp_1043",
      suggestedCreditCents: 40_000,
      apiVersion: "v1" as const,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(body)),
    );

    await expect(getSuggestedCredit("dsp_1043")).resolves.toEqual(body);
    expect(fetch).toHaveBeenCalledWith(suggestedCreditPath("dsp_1043"), {
      cache: "no-store",
    });
  });

  it("calls the v2 credit route when credit_v1 is disabled", async () => {
    rememberEnv();
    for (const key of ENV_KEYS) delete process.env[key];
    process.env.DEMO_BUGS = "filter_state";

    const body = {
      disputeId: "dsp_1043",
      suggestedCreditCents: PLAN_PRICE_CENTS.SCALE,
      apiVersion: "v2" as const,
    };
    const fetcher = vi.fn(async () => Response.json(body));

    await expect(getSuggestedCredit("dsp_1043", fetcher)).resolves.toEqual(body);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/v2/disputes/dsp_1043/suggested-credit",
      { cache: "no-store" },
    );
  });
});
