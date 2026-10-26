"use client";

import { useEffect, useState } from "react";
import {
  claimSuggestedCreditView,
  SUGGESTED_CREDIT_OVER_REFUND_REPORT_PATH,
  suggestedCreditExceedsCatalog,
} from "@/lib/demo/suggested-credit-over-refund";
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
  disputeId: string;
  /** Server render id. Stable across a strict-mode remount, new on the next page view. */
  reportViewId: string;
  /** True only when DEMO_MODE is on and credit_v1 is enabled. */
  reportOverCatalog: boolean;
};

export function SuggestedCredit({
  path,
  catalogPriceCents,
  planName,
  disputeId,
  reportViewId,
  reportOverCatalog,
}: SuggestedCreditProps) {
  const [credit, setCredit] = useState<SuggestedCreditResponse | null>(null);
  const [error, setError] = useState(false);
  // router.refresh() re-renders the page with a new id; keep the one this view was mounted with.
  const [viewId] = useState(reportViewId);

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

  useEffect(() => {
    if (!reportOverCatalog || !credit || credit.disputeId !== disputeId) return;
    if (!suggestedCreditExceedsCatalog(credit.suggestedCreditCents, catalogPriceCents)) return;
    if (!claimSuggestedCreditView(viewId)) return;

    void fetch(SUGGESTED_CREDIT_OVER_REFUND_REPORT_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ disputeId, viewId }),
    }).catch(() => {
      // The figure on screen stays as it is when the report cannot be sent.
    });
  }, [catalogPriceCents, credit, disputeId, reportOverCatalog, viewId]);

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
