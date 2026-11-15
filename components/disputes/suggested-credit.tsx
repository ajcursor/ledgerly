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
  /**
   * First paint only. The fetch still replaces this after mount.
   * Lets a test show the figure the operator sees without waiting on the network.
   */
  initialCredit?: SuggestedCreditResponse | null;
  initialError?: boolean;
};

export function suggestedCreditFigure(input: {
  error: boolean;
  credit: { suggestedCreditCents: number; apiVersion: "v1" | "v2" } | null;
  catalogPriceCents: number;
  planName: string;
}): { overCatalog: boolean; title: string; detail: string } {
  if (input.error) {
    return {
      overCatalog: false,
      title: "Suggested credit unavailable",
      detail: "The credit policy API could not be reached.",
    };
  }
  if (input.credit === null) {
    return {
      overCatalog: false,
      title: "Loading suggested credit…",
      detail: "Loading credit policy.",
    };
  }

  const overCatalog = input.credit.suggestedCreditCents > input.catalogPriceCents;
  const catalog = formatUsd(input.catalogPriceCents);
  const source = `Source: suggested-credit API ${input.credit.apiVersion}.`;
  return {
    overCatalog,
    title: `Suggested credit ${formatUsd(input.credit.suggestedCreditCents)}`,
    detail: overCatalog
      ? `Above the ${input.planName} catalog price of ${catalog}. ${source}`
      : `Within the ${input.planName} catalog price of ${catalog}. ${source}`,
  };
}

/** Gate for the over-catalog report. A mismatched dispute id must not be reported. */
export function suggestedCreditNeedsReport(input: {
  reportOverCatalog: boolean;
  credit: { disputeId: string; suggestedCreditCents: number } | null;
  disputeId: string;
  catalogPriceCents: number;
}): boolean {
  if (!input.reportOverCatalog || !input.credit || input.credit.disputeId !== input.disputeId) {
    return false;
  }
  return suggestedCreditExceedsCatalog(input.credit.suggestedCreditCents, input.catalogPriceCents);
}

export function SuggestedCredit({
  path,
  catalogPriceCents,
  planName,
  disputeId,
  reportViewId,
  reportOverCatalog,
  initialCredit = null,
  initialError = false,
}: SuggestedCreditProps) {
  const [credit, setCredit] = useState<SuggestedCreditResponse | null>(initialCredit);
  const [error, setError] = useState(initialError);

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
    if (!suggestedCreditNeedsReport({ reportOverCatalog, credit, disputeId, catalogPriceCents })) return;
    if (!claimSuggestedCreditView(reportViewId)) return;

    void fetch(SUGGESTED_CREDIT_OVER_REFUND_REPORT_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ disputeId, viewId: reportViewId }),
    }).catch(() => {
      // The figure on screen stays as it is when the report cannot be sent.
    });
  }, [catalogPriceCents, credit, disputeId, reportOverCatalog, reportViewId]);

  const figure = suggestedCreditFigure({ error, credit, catalogPriceCents, planName });
  const alert = error || figure.overCatalog;

  return (
    <div className={cn("rounded-md px-3 py-2", alert ? "bg-danger-soft" : "bg-indigo-soft")}>
      <p
        className={cn(
          "text-lg font-semibold tracking-tight",
          alert ? "text-danger" : "text-foreground",
        )}
      >
        {figure.title}
      </p>
      <p className={cn("text-xs", alert ? "text-danger" : "text-muted-foreground")}>{figure.detail}</p>
    </div>
  );
}
