import type { SyntheticCustomer } from "@/lib/synthetic-customers";
import { syntheticCustomers } from "@/lib/synthetic-customers";

/** Header order: Cobalt Goods, Fernway Logistics, Acme North, Copperleaf Atelier. */
export const VIEWING_AS_CUSTOMER_IDS = [
  "cus_quarrypine",
  "cus_fernway",
  "cus_harborline",
  "cus_copperleaf",
] as const;

export type ViewingAsOption = {
  email: string;
  username: string;
  company: string;
};

export type ViewingAsPickerModel = {
  selectedEmail: string;
  options: ViewingAsOption[];
};

export function viewingAsCustomers(): SyntheticCustomer[] {
  const byId = new Map(syntheticCustomers().map((customer) => [customer.id, customer]));
  return VIEWING_AS_CUSTOMER_IDS.map((id) => {
    const customer = byId.get(id);
    if (!customer) {
      throw new Error(`Viewing-as contact ${id} is missing from the customer catalog.`);
    }
    return customer;
  });
}

/** The four demo contacts, plus the resolved customer when `?as=` selected someone else. */
export function viewingAsOptions(selected: SyntheticCustomer): SyntheticCustomer[] {
  const options = viewingAsCustomers();
  if (options.some((option) => option.email === selected.email)) return options;
  return [selected, ...options];
}

export function viewingAsPickerModel(demoMode: boolean, selected: SyntheticCustomer): ViewingAsPickerModel | null {
  if (!demoMode) return null;
  return {
    selectedEmail: selected.email,
    options: viewingAsOptions(selected).map((customer) => ({
      email: customer.email,
      username: customer.username,
      company: customer.company,
    })),
  };
}

/** Reload target that `proxy` already understands. Keeps the path, query, and hash. */
export function viewingAsNavigationHref(currentHref: string, email: string): string {
  const url = new URL(currentHref, "http://ledgerly.local");
  url.searchParams.set("as", email);
  return url.toString();
}
