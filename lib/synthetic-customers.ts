import { planLabel, type PlanId } from "@/lib/plans";
import { CORE_CUSTOMERS } from "@/prisma/core-customers";
import { EXTRA_ACCOUNTS } from "@/prisma/extra-accounts";

/** Cookie set by `?as=<email>` so later requests keep the same acting customer. */
export const ACTING_CUSTOMER_COOKIE = "ledgerly-acting-customer";

/** Request header copied from `?as=` so the first request sees the selection. */
export const ACTING_CUSTOMER_HEADER = "x-ledgerly-acting-customer";

/**
 * Cobalt Goods owns dispute dsp_1043. Errors use this account until `?as=`
 * selects another seeded customer.
 */
export const DEFAULT_ACTING_CUSTOMER_EMAIL = "accounts@cobaltgoods.example";

export type SyntheticCustomer = {
  id: string;
  email: string;
  /** Contact name. Sent as the Sentry username. */
  username: string;
  /** Account name. Sent as the Sentry `company` tag. */
  company: string;
  /** Catalog plan label. Sent as the Sentry `plan` tag. */
  plan: string;
};

function toCustomer(input: {
  id: string;
  email: string;
  username: string;
  company: string;
  plan: PlanId;
}): SyntheticCustomer {
  return {
    id: input.id,
    email: input.email,
    username: input.username,
    company: input.company,
    plan: planLabel(input.plan),
  };
}

function buildCustomers(): SyntheticCustomer[] {
  return [
    ...CORE_CUSTOMERS.map((customer) =>
      toCustomer({
        id: customer.id,
        email: customer.email,
        username: customer.contactName,
        company: customer.name,
        plan: customer.plan,
      }),
    ),
    ...EXTRA_ACCOUNTS.map((account) =>
      toCustomer({
        id: account.customerId,
        email: account.email,
        username: account.contactName,
        company: account.name,
        plan: account.plan,
      }),
    ),
  ];
}

const BY_EMAIL = new Map<string, SyntheticCustomer>();
for (const customer of buildCustomers()) {
  const key = customer.email.toLowerCase();
  if (BY_EMAIL.has(key)) {
    throw new Error(`Duplicate synthetic customer email: ${customer.email}`);
  }
  BY_EMAIL.set(key, customer);
}

export function syntheticCustomers(): SyntheticCustomer[] {
  return [...BY_EMAIL.values()];
}

export function findSyntheticCustomer(email: string): SyntheticCustomer | null {
  return BY_EMAIL.get(email.trim().toLowerCase()) ?? null;
}

export function defaultActingCustomer(): SyntheticCustomer {
  const customer = findSyntheticCustomer(DEFAULT_ACTING_CUSTOMER_EMAIL);
  if (!customer) {
    throw new Error(`Default acting customer ${DEFAULT_ACTING_CUSTOMER_EMAIL} is missing from the seed catalog.`);
  }
  return customer;
}
