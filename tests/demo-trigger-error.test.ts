import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureRequestError: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { GET } from "@/app/api/demo/trigger-error/route";
import { demoErrorScenarioIds } from "@/lib/demo/error-scenarios";
import { viewingAsCustomers } from "@/lib/demo/viewing-as";
import { ACTING_CUSTOMER_COOKIE, ACTING_CUSTOMER_HEADER, defaultActingCustomer } from "@/lib/synthetic-customers";

const ellis = defaultActingCustomer();
const jordan = viewingAsCustomers().find((customer) => customer.id === "cus_harborline");
if (!jordan) throw new Error("Acme North is missing from the viewing-as catalog.");

const previousDemoMode = process.env.DEMO_MODE;

function trigger(
  scenario: string | null,
  init?: { as?: string; cookie?: string; header?: string },
) {
  const url = new URL("http://localhost/api/demo/trigger-error");
  if (scenario !== null) url.searchParams.set("scenario", scenario);
  if (init?.as !== undefined) url.searchParams.set("as", init.as);
  const headers = new Headers();
  if (init?.cookie) headers.set("cookie", `${ACTING_CUSTOMER_COOKIE}=${encodeURIComponent(init.cookie)}`);
  if (init?.header) headers.set(ACTING_CUSTOMER_HEADER, init.header);
  return new Request(url, { headers });
}

describe("demo trigger-error route", () => {
  beforeEach(() => {
    process.env.DEMO_MODE = "true";
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (previousDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = previousDemoMode;
  });

  it("returns 404 when DEMO_MODE is unset", async () => {
    delete process.env.DEMO_MODE;
    const response = await GET(trigger("invoice-filter", { as: jordan.email }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.setUser).not.toHaveBeenCalled();
  });

  it("returns 404 when DEMO_MODE is not exactly true", async () => {
    process.env.DEMO_MODE = "TRUE";
    const response = await GET(trigger("invoice-filter"));

    expect(response.status).toBe(404);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown scenario and lists the registry", async () => {
    const response = await GET(trigger("not-a-scenario"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Unknown scenario",
      scenarios: demoErrorScenarioIds(),
    });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it.each([
    [
      "suggested-credit-over-refund",
      "disputes",
      /Suggested credit for dispute dsp_1043 would refund \$400\.00 against Scale invoice inv_1043 \(\$249\.00\)/,
    ],
    ["closed-dispute-resolve", "disputes", "Cannot resolve dispute dsp_1050: status is ACCEPTED."],
    ["invoice-filter", "invoices", "Invoice filter failed for status OVERDUE. The queue could not be narrowed."],
  ] as const)("throws %s with scenario and feature tags", async (scenario, feature, message) => {
    await expect(GET(trigger(scenario))).rejects.toThrow(message);

    expect(Sentry.setTag).toHaveBeenCalledWith("scenario", scenario);
    expect(Sentry.setTag).toHaveBeenCalledWith("feature", feature);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(message) }),
      {
        tags: {
          scenario,
          feature,
          company: "Cobalt Goods",
          plan: "Scale",
        },
      },
    );
    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: ellis.id,
      email: ellis.email,
      username: ellis.username,
    });
  });

  it("attributes the error to the customer in ?as=", async () => {
    await expect(
      GET(trigger("invoice-filter", { as: jordan.email })),
    ).rejects.toThrow(/OVERDUE/);

    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: jordan.id,
      email: jordan.email,
      username: jordan.username,
    });
    expect(Sentry.setTag).toHaveBeenCalledWith("company", "Acme North");
    expect(Sentry.setTag).toHaveBeenCalledWith("plan", "Growth");
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: expect.objectContaining({ company: "Acme North", plan: "Growth" }),
      }),
    );
  });

  it("attributes the error to the customer stored in the cookie", async () => {
    await expect(
      GET(trigger("closed-dispute-resolve", { cookie: "ap@northstarfab.example" })),
    ).rejects.toThrow(/dsp_1050/);

    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: "cus_northstarfab",
      email: "ap@northstarfab.example",
      username: "Mara Ellison",
    });
    expect(Sentry.setTag).toHaveBeenCalledWith("company", "Northstar Fabrication");
    expect(Sentry.setTag).toHaveBeenCalledWith("plan", "Growth");
  });

  it("prefers the acting-customer header over the cookie", async () => {
    await expect(
      GET(
        trigger("invoice-filter", {
          header: "hello@riverstone.example",
          cookie: jordan.email,
        }),
      ),
    ).rejects.toThrow(/OVERDUE/);

    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: "cus_cedarwell",
      email: "hello@riverstone.example",
      username: "Remy Sato",
    });
    expect(Sentry.setTag).toHaveBeenCalledWith("company", "Riverstone Labs");
    expect(Sentry.setTag).toHaveBeenCalledWith("plan", "Starter");
  });

  it("returns 400 for an email that is not in the seed and does not capture", async () => {
    const response = await GET(trigger("invoice-filter", { as: "person@realco.com" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unknown customer" });
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.setUser).not.toHaveBeenCalled();
  });

  it("an empty ?as= returns to the default customer even when a cookie is set", async () => {
    await expect(
      GET(trigger("invoice-filter", { as: "", cookie: jordan.email })),
    ).rejects.toThrow(/OVERDUE/);

    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: ellis.id,
      email: ellis.email,
      username: ellis.username,
    });
  });

  it("documents every scenario and the acting customer", () => {
    const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");
    const example = readFileSync(join(process.cwd(), ".env.example"), "utf8");

    for (const id of demoErrorScenarioIds()) {
      expect(readme).toContain(id);
    }
    expect(readme).toContain("DEMO_MODE");
    expect(readme).toContain("NEXT_PUBLIC_SENTRY_DSN");
    expect(readme).toContain("SENTRY_AUTH_TOKEN");
    expect(readme).toContain(ellis.email);
    expect(readme).toContain("Viewing as");
    expect(example).toContain("NEXT_PUBLIC_SENTRY_DSN=");
    expect(example).toContain("SENTRY_DSN=");
    expect(example).toContain("SENTRY_ENVIRONMENT=");
    expect(example).toContain("SENTRY_AUTH_TOKEN=");
    expect(example).toContain("DEMO_MODE=");
  });
});
