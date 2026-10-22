import type { CoreCustomer } from "./core-customers";

/**
 * Demo contacts that sit outside the ten Fieldnote book accounts and the
 * fourteen extra invoice accounts. Seeded as customers with no invoice so
 * `?as=` and the header picker can attribute Sentry events to them.
 */
export const DEMO_CONTACTS: CoreCustomer[] = [
  {
    id: "cus_fernway",
    name: "Fernway Logistics",
    contactName: "Sam Okafor",
    email: "sam.okafor@fernway.brightdesk-demo.co.uk",
    plan: "GROWTH",
  },
];
