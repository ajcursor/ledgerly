"use client";

import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/money";
import { cn } from "@/lib/utils";

type SuggestedCreditResponse = {
  disputeId: string;
  suggestedCreditCents: number;
  apiVersion: "v1" | "v2";
};

type SuggestedCreditProps = {
  path: string;
  catalogPriceCents: number;
  planName: string;
};

export function SuggestedCredit({
  path,
  catalogPriceCents,
  planName,
}: SuggestedCreditProps) {
  const [credit, setCredit] = useState<SuggestedCreditResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    fetch(path, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Suggested credit request failed with status ${response.status}.`);
        }
        return response.json() as Promise<SuggestedCreditResponse>;
      })
      .then((result) => {
        if (active) setCredit(result);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [path]);

  const overCatalog =
    credit !== null && credit.suggestedCreditCents > catalogPriceCents;

  return (
    <div
      className={cn(
        "rounded-md px-3 py-2",
        error || overCatalog ? "bg-danger-soft" : "bg-indigo-soft",
      )}
    >
      <p
        className={cn(
          "text-lg font-semibold tracking-tight",
          error || overCatalog ? "text-danger" : "text-foreground",
        )}
      >
        {error
          ? "Suggested credit unavailable"
          : credit === null
            ? "Loading suggested credit…"
            : `Suggested credit ${formatUsd(credit.suggestedCreditCents)}`}
      </p>
      <p
        className={cn(
          "text-xs",
          error || overCatalog ? "text-danger" : "text-muted-foreground",
        )}
      >
        {error
          ? "The credit policy API could not be reached."
          : credit === null
            ? "Loading credit policy."
            : overCatalog
              ? `Above the ${planName} catalog price of ${formatUsd(catalogPriceCents)}. Source: suggested-credit API ${credit.apiVersion}.`
              : `Within the ${planName} catalog price of ${formatUsd(catalogPriceCents)}. Source: suggested-credit API ${credit.apiVersion}.`}
      </p>
    </div>
  );
}
