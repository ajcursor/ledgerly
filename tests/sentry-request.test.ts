import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { attributeServerRequest } from "@/lib/sentry-request";
import { viewingAsCustomers } from "@/lib/demo/viewing-as";
import { ACTING_CUSTOMER_COOKIE, ACTING_CUSTOMER_HEADER, defaultActingCustomer } from "@/lib/synthetic-customers";

const ellis = defaultActingCustomer();
const jordan = viewingAsCustomers().find((customer) => customer.id === "cus_harborline");
if (!jordan) throw new Error("Acme North is missing from the viewing-as catalog.");

function asUser(customer: { id: string; email: string; username: string }) {
  return { id: customer.id, email: customer.email, username: customer.username };
}

describe("attributeServerRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tags the scenario and feature on the trigger route", () => {
    attributeServerRequest({
      path: "/api/demo/trigger-error?scenario=suggested-credit-over-refund",
      headers: {},
    });

    expect(Sentry.setTag).toHaveBeenCalledWith("scenario", "suggested-credit-over-refund");
    expect(Sentry.setTag).toHaveBeenCalledWith("feature", "disputes");
  });

  it("attributes the default customer and skips scenario tags for an unknown scenario", () => {
    attributeServerRequest({ path: "/api/demo/trigger-error?scenario=not-a-scenario", headers: {} });

    expect(Sentry.setUser).toHaveBeenCalledWith(asUser(ellis));
    expect(Sentry.setTag).not.toHaveBeenCalledWith("scenario", expect.anything());
    expect(Sentry.setTag).not.toHaveBeenCalledWith("feature", expect.anything());
  });

  it("does not tag scenarios on other paths even when the query names one", () => {
    attributeServerRequest({
      path: "/invoices?scenario=suggested-credit-over-refund",
      headers: {},
    });

    expect(Sentry.setTag).not.toHaveBeenCalledWith("scenario", expect.anything());
    expect(Sentry.setTag).not.toHaveBeenCalledWith("feature", expect.anything());
  });

  it("prefers the ?as= customer over the header and cookie", () => {
    attributeServerRequest({
      path: `/invoices?as=${encodeURIComponent(jordan.email)}`,
      headers: {
        [ACTING_CUSTOMER_HEADER]: ellis.email,
        cookie: `${ACTING_CUSTOMER_COOKIE}=${encodeURIComponent(ellis.email)}`,
      },
    });

    expect(Sentry.setUser).toHaveBeenCalledWith(asUser(jordan));
    expect(Sentry.setTag).toHaveBeenCalledWith("company", jordan.company);
    expect(Sentry.setTag).toHaveBeenCalledWith("customer.company", jordan.company);
    expect(Sentry.setTag).toHaveBeenCalledWith("plan", jordan.plan);
  });

  it("reads the acting customer from the first header value when the header repeats", () => {
    attributeServerRequest({
      path: "/invoices",
      headers: { [ACTING_CUSTOMER_HEADER]: [jordan.email, ellis.email] },
    });

    expect(Sentry.setUser).toHaveBeenCalledWith(asUser(jordan));
  });

  it("reads the acting customer from the cookie when no query or header is set", () => {
    attributeServerRequest({
      path: "/disputes",
      headers: { cookie: `theme=dark; ${ACTING_CUSTOMER_COOKIE}=${encodeURIComponent(jordan.email)}` },
    });

    expect(Sentry.setUser).toHaveBeenCalledWith(asUser(jordan));
  });

  it("falls back to the default customer when ?as= names an unknown contact", () => {
    attributeServerRequest({
      path: "/invoices?as=person%40realco.com",
      headers: { [ACTING_CUSTOMER_HEADER]: jordan.email },
    });

    expect(Sentry.setUser).toHaveBeenCalledWith(asUser(ellis));
    expect(Sentry.setTag).toHaveBeenCalledWith("company", ellis.company);
  });
});
