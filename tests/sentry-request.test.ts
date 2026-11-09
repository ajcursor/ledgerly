import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { attributeServerRequest } from "@/lib/sentry-request";
import { viewingAsCustomers } from "@/lib/demo/viewing-as";
import {
  ACTING_CUSTOMER_COOKIE,
  ACTING_CUSTOMER_HEADER,
  defaultActingCustomer,
} from "@/lib/synthetic-customers";

const ellis = defaultActingCustomer();
const jordan = viewingAsCustomers().find((customer) => customer.id === "cus_harborline");
if (!jordan) throw new Error("Acme North is missing from the viewing-as catalog.");

function request(path: string, headers: Record<string, string | string[] | undefined> = {}) {
  return { path, headers };
}

describe("server request attribution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attributes the acting customer and tags a known trigger-error scenario", () => {
    attributeServerRequest(
      request("/api/demo/trigger-error?scenario=invoice-filter", {
        [ACTING_CUSTOMER_HEADER]: [jordan.email, ellis.email],
      }),
    );

    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: jordan.id,
      email: jordan.email,
      username: jordan.username,
    });
    expect(Sentry.setTag).toHaveBeenCalledWith("company", jordan.company);
    expect(Sentry.setTag).toHaveBeenCalledWith("plan", jordan.plan);
    expect(Sentry.setTag).toHaveBeenCalledWith("scenario", "invoice-filter");
    expect(Sentry.setTag).toHaveBeenCalledWith("feature", "invoices");
  });

  it("falls back to the default customer for an unknown selection and skips tags off that route", () => {
    attributeServerRequest(
      request("/api/invoices?as=not-a-person@example", {
        cookie: `${ACTING_CUSTOMER_COOKIE}=${encodeURIComponent(jordan.email)}`,
      }),
    );

    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: ellis.id,
      email: ellis.email,
      username: ellis.username,
    });
    expect(Sentry.setTag).not.toHaveBeenCalledWith("scenario", expect.anything());

    vi.clearAllMocks();
    attributeServerRequest(
      request("/api/demo/trigger-error?scenario=not-a-scenario", {
        [ACTING_CUSTOMER_HEADER]: [],
        cookie: `other=1; ${ACTING_CUSTOMER_COOKIE}=${encodeURIComponent(jordan.email)}`,
      }),
    );

    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: jordan.id,
      email: jordan.email,
      username: jordan.username,
    });
    expect(Sentry.setTag).not.toHaveBeenCalledWith("scenario", expect.anything());
    expect(Sentry.setTag).toHaveBeenCalledWith("company", jordan.company);
  });
});
