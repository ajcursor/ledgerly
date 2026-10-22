/**
 * The ten Fieldnote book accounts. `prisma/seed.ts` inserts these rows.
 * Extra accounts live in `prisma/extra-accounts.ts`.
 */
export type CoreCustomer = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  plan: "STARTER" | "GROWTH" | "SCALE";
};

export const CORE_CUSTOMERS: CoreCustomer[] = [
  {
    id: "cus_harborline",
    name: "Acme North",
    contactName: "Jordan Hale",
    email: "jordan.hale@acmenorth.brightdesk-demo.co.uk",
    plan: "GROWTH",
  },
  {
    id: "cus_cedarwell",
    name: "Riverstone Labs",
    contactName: "Remy Sato",
    email: "hello@riverstone.example",
    plan: "STARTER",
  },
  {
    id: "cus_quarrypine",
    name: "Cobalt Goods",
    contactName: "Ellis Marlow",
    email: "ellis.marlow@cobaltgoods.brightdesk-demo.co.uk",
    plan: "SCALE",
  },
  {
    id: "cus_brightwell",
    name: "Brightwell Labs",
    contactName: "Priya Nader",
    email: "ops@brightwell.example",
    plan: "GROWTH",
  },
  {
    id: "cus_oakiron",
    name: "Oakiron Supply",
    contactName: "Chris Bellamy",
    email: "billing@oakiron.example",
    plan: "STARTER",
  },
  {
    id: "cus_fieldnote",
    name: "Fieldnote Press",
    contactName: "Sam Ortez",
    email: "ledger@fieldnote.example",
    plan: "SCALE",
  },
  {
    id: "cus_silverpine",
    name: "Silverpine Outfitters",
    contactName: "Noor Voss",
    email: "pay@silverpine.example",
    plan: "GROWTH",
  },
  {
    id: "cus_mapleember",
    name: "Maple & Ember Co",
    contactName: "Dana Ruiz",
    email: "hello@mapleember.example",
    plan: "STARTER",
  },
  {
    id: "cus_tidewatch",
    name: "Tidewatch Logistics",
    contactName: "Keir Anand",
    email: "billing@tidewatch.example",
    plan: "SCALE",
  },
  {
    id: "cus_copperleaf",
    name: "Copperleaf Atelier",
    contactName: "Lila Shore",
    email: "lila.shore@copperleaf.brightdesk-demo.co.uk",
    plan: "GROWTH",
  },
];
