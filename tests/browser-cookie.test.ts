import { describe, expect, it } from "vitest";
import { readBrowserCookie, resolveActingCustomer } from "@/lib/acting-customer";
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

describe("browser acting-customer cookie", () => {
  it("reads the acting-customer cookie and ignores a lookalike name", () => {
    const customer = riverstone();
    const encoded = encodeURIComponent(customer.email);
    const header = [
      "theme=dark",
      `${ACTING_CUSTOMER_COOKIE}_extra=${encoded}`,
      `${ACTING_CUSTOMER_COOKIE}=${encoded}`,
    ].join("; ");

    expect(readBrowserCookie(header, ACTING_CUSTOMER_COOKIE)).toBe(customer.email);
    expect(
      readBrowserCookie(`${ACTING_CUSTOMER_COOKIE}_extra=${encoded}`, ACTING_CUSTOMER_COOKIE),
    ).toBeNull();
    expect(readBrowserCookie(null, ACTING_CUSTOMER_COOKIE)).toBeNull();
    expect(readBrowserCookie("", ACTING_CUSTOMER_COOKIE)).toBeNull();
  });

  it("attributes a decoded cookie email and falls back when the cookie is unknown", () => {
    const customer = riverstone();
    const selected = resolveActingCustomer({
      cookieEmail: readBrowserCookie(
        `${ACTING_CUSTOMER_COOKIE}=${encodeURIComponent(customer.email)}`,
        ACTING_CUSTOMER_COOKIE,
      ),
    });
    expect(selected).toEqual({ customer });

    const unknown = resolveActingCustomer({
      cookieEmail: readBrowserCookie(
        `${ACTING_CUSTOMER_COOKIE}=${encodeURIComponent("missing@fieldnote.example")}`,
        ACTING_CUSTOMER_COOKIE,
      ),
    });
    expect(unknown).toEqual({ customer: defaultActingCustomer() });
    expect(defaultActingCustomer().company).toBe("Cobalt Goods");
  });
});
