import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureRequestError: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import ErrorState, { reportRouteError } from "@/app/error";
import GlobalError, { reportGlobalError } from "@/app/global-error";
import { onRequestError } from "@/instrumentation";
import {
  ACTING_CUSTOMER_COOKIE,
  defaultActingCustomer,
  findSyntheticCustomer,
} from "@/lib/synthetic-customers";

function riverstone() {
  const customer = findSyntheticCustomer("hello@riverstone.example");
  if (!customer) throw new Error("Riverstone Labs is missing from the catalog.");
  return customer;
}

const context = {
  routerKind: "App Router" as const,
  routePath: "/invoices",
  routeType: "render" as const,
  revalidateReason: undefined,
};

function request(cookie: string) {
  return {
    path: "/invoices",
    method: "GET",
    headers: { cookie },
  };
}

function sentryUser(customer: { id: string; email: string; username: string }) {
  return {
    id: customer.id,
    email: customer.email,
    username: customer.username,
  };
}

describe("error reporting with the acting-customer cookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("still reports the original request error when the acting-customer cookie is not valid percent-encoding", () => {
    const error = new Error("invoice list failed");
    const info = request(`${ACTING_CUSTOMER_COOKIE}=%`);

    onRequestError(error, info, context);

    expect(Sentry.captureRequestError).toHaveBeenCalledWith(error, info, context);
    expect(Sentry.setUser).not.toHaveBeenCalled();
  });

  it("attributes a decoded cookie before reporting when another cookie is malformed", () => {
    const customer = riverstone();
    const error = new Error("invoice list failed");
    const info = request(
      `theme=%; ${ACTING_CUSTOMER_COOKIE}=${encodeURIComponent(customer.email)}`,
    );

    onRequestError(error, info, context);

    expect(Sentry.setUser).toHaveBeenCalledWith(sentryUser(customer));
    expect(Sentry.captureRequestError).toHaveBeenCalledWith(error, info, context);
    expect(vi.mocked(Sentry.setUser).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(Sentry.captureRequestError).mock.invocationCallOrder[0],
    );
  });

  it("still captures a global error when the cookie is not valid percent-encoding", () => {
    const error = new Error("SQLite is missing.");
    const fallback = defaultActingCustomer();

    reportGlobalError(error, {
      search: "",
      cookie: `${ACTING_CUSTOMER_COOKIE}=%`,
    });

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
    expect(Sentry.setUser).toHaveBeenCalledWith(sentryUser(fallback));

    const html = renderToStaticMarkup(createElement(GlobalError, { error, reset: () => {} }));
    expect(html).toContain("SQLite is missing.");
    expect(html).toContain("Try again");
  });

  it("keeps the ?as= customer when the cookie is not valid percent-encoding", () => {
    const customer = riverstone();
    const error = new Error("dispute page failed");

    reportGlobalError(error, {
      search: `?as=${encodeURIComponent(customer.email)}`,
      cookie: `${ACTING_CUSTOMER_COOKIE}=%E0%A4%A`,
    });

    expect(Sentry.setUser).toHaveBeenCalledWith(sentryUser(customer));
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it("attributes the cookie customer on a global error when no query is set", () => {
    const customer = riverstone();
    const error = new Error("dispute page failed");

    reportGlobalError(error, {
      search: "",
      cookie: `theme=dark; ${ACTING_CUSTOMER_COOKIE}=${encodeURIComponent(customer.email)}`,
    });

    expect(Sentry.setUser).toHaveBeenCalledWith(sentryUser(customer));
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it("uses the default customer for an unknown ?as= and still captures", () => {
    const error = new Error("dispute page failed");
    const fallback = defaultActingCustomer();

    reportGlobalError(error, {
      search: "?as=missing%40fieldnote.example",
      cookie: "",
    });

    expect(Sentry.setUser).toHaveBeenCalledWith(sentryUser(fallback));
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it("reports a route error and shows its message", () => {
    const error = new Error("SQLite is missing.");

    reportRouteError(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
    const html = renderToStaticMarkup(createElement(ErrorState, { error, reset: () => {} }));
    expect(html).toContain("SQLite is missing.");
    expect(html).toContain("Try again");
  });
});
