import { describe, expect, it } from "vitest";
import { actingCustomerFromCookieHeader, readCookie, resolveActingCustomer } from "@/lib/acting-customer";
import { ACTING_CUSTOMER_COOKIE, defaultActingCustomer, syntheticCustomers } from "@/lib/synthetic-customers";

const ellis = defaultActingCustomer();
const jordan = syntheticCustomers().find((customer) => customer.id === "cus_harborline");
if (!jordan) throw new Error("Acme North is missing from the customer catalog.");

describe("acting customer resolution", () => {
  it("reads one named cookie from a combined header", () => {
    const encoded = encodeURIComponent(jordan.email);
    const header = `theme=dark; ${ACTING_CUSTOMER_COOKIE}=${encoded}; other=1`;
    expect(readCookie(header, ACTING_CUSTOMER_COOKIE)).toBe(jordan.email);
    expect(readCookie(` ${ACTING_CUSTOMER_COOKIE} = ${encoded} `, ACTING_CUSTOMER_COOKIE)).toBe(jordan.email);
    expect(readCookie(header, "missing")).toBeNull();
    expect(readCookie(null, ACTING_CUSTOMER_COOKIE)).toBeNull();
    expect(readCookie("noequals", ACTING_CUSTOMER_COOKIE)).toBeNull();
    expect(readCookie(`x${ACTING_CUSTOMER_COOKIE}=${encoded}`, ACTING_CUSTOMER_COOKIE)).toBeNull();
    expect(actingCustomerFromCookieHeader(header).email).toBe(jordan.email);
  });

  it("uses ?as= first, then the header, then the cookie, then the default", () => {
    expect(
      resolveActingCustomer({
        queryEmail: ellis.email,
        headerEmail: jordan.email,
        cookieEmail: jordan.email,
      }),
    ).toEqual({ customer: ellis });
    expect(
      resolveActingCustomer({
        queryEmail: "not-a-customer@example",
        cookieEmail: jordan.email,
      }),
    ).toEqual({ error: "Unknown customer" });
    expect(
      resolveActingCustomer({
        queryEmail: "   ",
        cookieEmail: jordan.email,
      }),
    ).toEqual({ customer: ellis });
    expect(
      resolveActingCustomer({
        headerEmail: "not-a-customer@example",
        cookieEmail: `  ${jordan.email}  `,
      }),
    ).toEqual({ customer: jordan });
    expect(
      resolveActingCustomer({
        headerEmail: jordan.email,
        cookieEmail: ellis.email,
      }),
    ).toEqual({ customer: jordan });
    expect(
      resolveActingCustomer({
        headerEmail: " ",
        cookieEmail: "not-a-customer@example",
      }),
    ).toEqual({ customer: ellis });
    expect(resolveActingCustomer({})).toEqual({ customer: ellis });
  });
});
