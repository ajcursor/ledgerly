import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { attributeServerRequest } from "@/lib/sentry-request";
import { ACTING_CUSTOMER_COOKIE, ACTING_CUSTOMER_HEADER, defaultActingCustomer, syntheticCustomers } from "@/lib/synthetic-customers";

const ellis = defaultActingCustomer();
const jordan = syntheticCustomers().find((customer) => customer.id === "cus_harborline");
if (!jordan) throw new Error("Acme North is missing from the customer catalog.");

function request(path: string, headers: Record<string, string | string[] | undefined> = {}) {
  attributeServerRequest({ path, headers });
}

describe("server request attribution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attributes an unknown or blank ?as= to the default customer", () => {
    request(`/invoices?as=${encodeURIComponent("person@realco.com")}`);
    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: ellis.id,
      email: ellis.email,
      username: ellis.username,
    });
    expect(Sentry.setTag).toHaveBeenCalledWith("company", ellis.company);
    expect(Sentry.setTag).not.toHaveBeenCalledWith("scenario", expect.anything());

    vi.clearAllMocks();
    request("/invoices?as=");
    expect(Sentry.setUser).toHaveBeenCalledWith(expect.objectContaining({ email: ellis.email }));
  });

  it("prefers the acting-customer header, then the cookie", () => {
    request("/invoices", {
      [ACTING_CUSTOMER_HEADER]: [jordan.email, ellis.email],
    });
    expect(Sentry.setUser).toHaveBeenCalledWith(expect.objectContaining({ email: jordan.email }));

    vi.clearAllMocks();
    request("/invoices", {
      [ACTING_CUSTOMER_HEADER]: "not-a-customer@example",
      cookie: `${ACTING_CUSTOMER_COOKIE}=${encodeURIComponent(jordan.email)}`,
    });
    expect(Sentry.setUser).toHaveBeenCalledWith(expect.objectContaining({ email: jordan.email }));
    expect(Sentry.setTag).toHaveBeenCalledWith("plan", jordan.plan);
  });

  it("tags a known trigger-error scenario and ignores the tag everywhere else", () => {
    request(`/api/demo/trigger-error?scenario=invoice-filter&as=${encodeURIComponent(jordan.email)}`);
    expect(Sentry.setUser).toHaveBeenCalledWith(expect.objectContaining({ email: jordan.email }));
    expect(Sentry.setTag).toHaveBeenCalledWith("scenario", "invoice-filter");
    expect(Sentry.setTag).toHaveBeenCalledWith("feature", "invoices");

    vi.clearAllMocks();
    request("/api/demo/trigger-error?scenario=not-a-scenario");
    expect(Sentry.setUser).toHaveBeenCalled();
    expect(Sentry.setTag).not.toHaveBeenCalledWith("scenario", expect.anything());

    vi.clearAllMocks();
    request("/invoices?scenario=invoice-filter");
    expect(Sentry.setTag).not.toHaveBeenCalledWith("scenario", expect.anything());
    expect(Sentry.setTag).not.toHaveBeenCalledWith("feature", expect.anything());
  });
});
