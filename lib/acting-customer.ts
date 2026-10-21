import {
  ACTING_CUSTOMER_COOKIE,
  defaultActingCustomer,
  findSyntheticCustomer,
  type SyntheticCustomer,
} from "@/lib/synthetic-customers";

export { ACTING_CUSTOMER_COOKIE, ACTING_CUSTOMER_HEADER } from "@/lib/synthetic-customers";

export function readCookie(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return null;
}

export type ActingCustomerSource = {
  /** `?as=` when the param is present. Empty string clears back to the default. */
  queryEmail?: string | null;
  headerEmail?: string | null;
  cookieEmail?: string | null;
};

/**
 * Resolve who an error should be attributed to.
 * An explicit unknown `?as=` is rejected. A missing selection falls through
 * the request header, then the cookie, then the default seeded customer.
 */
export function resolveActingCustomer(
  source: ActingCustomerSource,
): { customer: SyntheticCustomer } | { error: "Unknown customer" } {
  if (source.queryEmail != null) {
    const query = source.queryEmail.trim();
    if (!query) return { customer: defaultActingCustomer() };
    const customer = findSyntheticCustomer(query);
    if (!customer) return { error: "Unknown customer" };
    return { customer };
  }

  const header = source.headerEmail?.trim();
  if (header) {
    const customer = findSyntheticCustomer(header);
    if (customer) return { customer };
  }

  const cookie = source.cookieEmail?.trim();
  if (cookie) {
    const customer = findSyntheticCustomer(cookie);
    if (customer) return { customer };
  }

  return { customer: defaultActingCustomer() };
}

export function actingCustomerFromCookieHeader(header: string | null | undefined): SyntheticCustomer {
  const resolved = resolveActingCustomer({
    cookieEmail: readCookie(header, ACTING_CUSTOMER_COOKIE),
  });
  if ("error" in resolved) return defaultActingCustomer();
  return resolved.customer;
}
