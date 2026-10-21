import { formatUsd } from "@/lib/money";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

export type DemoFeature = "disputes" | "invoices";

export type DemoErrorScenario = {
  id: string;
  feature: DemoFeature;
  description: string;
  createError: () => Error;
};

/** Seeded claim on dsp_1043. v1 returns this amount; the Scale price is the cap. */
const DSP_1043_CLAIM_CENTS = 40_000;

export class SuggestedCreditOverRefundError extends Error {
  constructor() {
    super(
      `Suggested credit for dispute dsp_1043 would refund ${formatUsd(DSP_1043_CLAIM_CENTS)} against Scale invoice inv_1043 (${formatUsd(PLAN_PRICE_CENTS.SCALE)}).`,
    );
    this.name = "SuggestedCreditOverRefundError";
  }
}

export class ClosedDisputeResolveError extends Error {
  constructor() {
    super("Cannot resolve dispute dsp_1050: status is ACCEPTED.");
    this.name = "ClosedDisputeResolveError";
  }
}

export class InvoiceFilterError extends Error {
  constructor() {
    super("Invoice filter failed for status OVERDUE. The queue could not be narrowed.");
    this.name = "InvoiceFilterError";
  }
}

/**
 * Add a scenario by inserting one entry. The trigger route and its unknown-scenario
 * response both read this map.
 */
export const DEMO_ERROR_SCENARIOS = {
  "suggested-credit-over-refund": {
    id: "suggested-credit-over-refund",
    feature: "disputes" as const,
    description: "Issuing the raw dsp_1043 claim would refund more than the Scale invoice.",
    createError: () => new SuggestedCreditOverRefundError(),
  },
  "closed-dispute-resolve": {
    id: "closed-dispute-resolve",
    feature: "disputes" as const,
    description: "Resolve was requested for dsp_1050, which is already accepted.",
    createError: () => new ClosedDisputeResolveError(),
  },
  "invoice-filter": {
    id: "invoice-filter",
    feature: "invoices" as const,
    description: "The invoice queue failed while applying the Overdue filter.",
    createError: () => new InvoiceFilterError(),
  },
} satisfies Record<string, DemoErrorScenario>;

export type DemoErrorScenarioId = keyof typeof DEMO_ERROR_SCENARIOS;

export function demoErrorScenarioIds(): DemoErrorScenarioId[] {
  return Object.keys(DEMO_ERROR_SCENARIOS) as DemoErrorScenarioId[];
}

export function demoErrorScenario(id: string | null | undefined): DemoErrorScenario | null {
  if (!id || !(id in DEMO_ERROR_SCENARIOS)) return null;
  return DEMO_ERROR_SCENARIOS[id as DemoErrorScenarioId];
}
