export type SuggestedCreditResponse = {
  disputeId: string;
  suggestedCreditCents: number;
  apiVersion: "v1" | "v2";
};

export type SuggestedCreditFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

/** v1 returns the raw disputed amount uncapped; it stays routable only for older callers. */
export const SUGGESTED_CREDIT_API_VERSION = "v2";

export function suggestedCreditApiVersion(): "v1" | "v2" {
  return SUGGESTED_CREDIT_API_VERSION;
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
