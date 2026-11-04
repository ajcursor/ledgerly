import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureRequestError: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { onRequestError } from "@/instrumentation";
import { attributeServerRequest } from "@/lib/sentry-request";
import { markDemoErrorCaptured } from "@/lib/sentry-user";

const JORDAN = "jordan.hale@acmenorth.brightdesk-demo.co.uk";
const ELLIS = "ellis.marlow@cobaltgoods.brightdesk-demo.co.uk";

const context = {
  routerKind: "App Router",
  routePath: "/invoices",
  routeType: "render",
  renderSource: "react-server-components",
};

function request(path: string, headers: Record<string, string | string[]> = {}) {
  return { path, method: "GET", headers };
}

function attributedEmail() {
  const user = vi.mocked(Sentry.setUser).mock.calls.at(-1)?.[0] as { email?: string } | undefined;
  return user?.email;
}

function tags(name: string) {
  return vi.mocked(Sentry.setTag).mock.calls.filter((call) => call[0] === name).map((call) => call[1]);
}

describe("request attribution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attributes an ordinary request from the query, a header list, the cookie, or the default customer", () => {
    attributeServerRequest(
      request(`/invoices?as=${JORDAN}`, {
        "x-ledgerly-acting-customer": ELLIS,
      }),
    );
    expect(attributedEmail()).toBe(JORDAN);
    expect(tags("company")).toEqual(["Acme North"]);
    expect(tags("customer.company")).toEqual(["Acme North"]);
    expect(tags("plan")).toEqual(["Growth"]);
    expect(tags("scenario")).toEqual([]);

    vi.clearAllMocks();
    attributeServerRequest(
      request("/invoices", {
        "x-ledgerly-acting-customer": [ELLIS, JORDAN],
      }),
    );
    expect(attributedEmail()).toBe(ELLIS);
    expect(tags("company")).toEqual(["Cobalt Goods"]);

    vi.clearAllMocks();
    attributeServerRequest(
      request("/invoices", {
        "x-ledgerly-acting-customer": [],
        cookie: `ledgerly-acting-customer=${JORDAN}`,
      }),
    );
    expect(attributedEmail()).toBe(JORDAN);

    vi.clearAllMocks();
    attributeServerRequest(request("/collections"));
    expect(attributedEmail()).toBe(ELLIS);
    expect(tags("plan")).toEqual(["Scale"]);
    expect(tags("scenario")).toEqual([]);
  });

  it("attributes the default customer when ?as= is unknown or blank", () => {
    attributeServerRequest(
      request("/invoices?as=nobody@example.com", {
        "x-ledgerly-acting-customer": JORDAN,
      }),
    );
    expect(attributedEmail()).toBe(ELLIS);
    expect(tags("company")).toEqual(["Cobalt Goods"]);

    vi.clearAllMocks();
    attributeServerRequest(
      request("/invoices?as=", {
        cookie: `ledgerly-acting-customer=${JORDAN}`,
      }),
    );
    expect(attributedEmail()).toBe(ELLIS);
  });

  it("tags a known trigger-error scenario and ignores a scenario on any other path", () => {
    attributeServerRequest(request("/api/demo/trigger-error?scenario=invoice-filter"));
    expect(tags("scenario")).toEqual(["invoice-filter"]);
    expect(tags("feature")).toEqual(["invoices"]);

    vi.clearAllMocks();
    attributeServerRequest(request("/api/demo/trigger-error?scenario=not-a-scenario"));
    expect(attributedEmail()).toBe(ELLIS);
    expect(tags("scenario")).toEqual([]);
    expect(tags("feature")).toEqual([]);

    vi.clearAllMocks();
    attributeServerRequest(request("/invoices?scenario=invoice-filter"));
    expect(tags("scenario")).toEqual([]);
    expect(tags("feature")).toEqual([]);
  });

  it("still reports the request error when the acting-customer cookie cannot be decoded", () => {
    const error = new Error("queue failed");
    const info = request("/invoices", { cookie: "ledgerly-acting-customer=%" });

    onRequestError(error, info, context);

    expect(Sentry.captureRequestError).toHaveBeenCalledTimes(1);
    expect(Sentry.captureRequestError).toHaveBeenCalledWith(error, info, context);
    expect(Sentry.setUser).not.toHaveBeenCalled();
  });

  it("does not report a demo error that was already captured", () => {
    const error = new Error("already sent");
    markDemoErrorCaptured(error);

    onRequestError(error, request("/invoices"), context);

    expect(Sentry.captureRequestError).not.toHaveBeenCalled();
    expect(Sentry.setUser).not.toHaveBeenCalled();
  });
});
