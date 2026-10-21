import { isDemoBugEnabled } from "@/lib/demo/bugs";

export type SuggestedCreditResponse = {
  disputeId: string;
  suggestedCreditCents: number;
  apiVersion: "v1" | "v2";
};

export type SuggestedCreditFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

/** Legacy client pin. Used while the credit_v1 demo bug is on, which is the default. */
export const SUGGESTED_CREDIT_API_VERSION = "v1";
const CURRENT_SUGGESTED_CREDIT_API_VERSION = "v2";

export function suggestedCreditApiVersion(): "v1" | "v2" {
  return isDemoBugEnabled("credit_v1") ? SUGGESTED_CREDIT_API_VERSION : CURRENT_SUGGESTED_CREDIT_API_VERSION;
}

export function suggestedCreditPath(disputeId: string): string {
  return `/api/${suggestedCreditApiVersion()}/disputes/${encodeURIComponent(disputeId)}/suggested-credit`;
}

export async function getSuggestedCredit(
  disputeId: string,
  fetcher: SuggestedCreditFetcher = fetch,
): Promise<SuggestedCreditResponse> {
  const response = await fetcher(suggestedCreditPath(disputeId), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Suggested credit request failed with status ${response.status}.`);
  }

  return response.json() as Promise<SuggestedCreditResponse>;
}
