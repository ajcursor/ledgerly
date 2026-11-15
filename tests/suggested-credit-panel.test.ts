import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  SuggestedCredit,
  suggestedCreditFigure,
  suggestedCreditNeedsReport,
} from "@/components/disputes/suggested-credit";
import { PLAN_PRICE_CENTS } from "@/lib/plans";

const SCALE = PLAN_PRICE_CENTS.SCALE;
const CLAIM = 40_000;

describe("suggested credit panel", () => {
  it("shows the raw claim above the Scale catalog price", () => {
    const figure = suggestedCreditFigure({
      error: false,
      credit: { suggestedCreditCents: CLAIM, apiVersion: "v1" },
      catalogPriceCents: SCALE,
      planName: "Scale",
    });

    expect(figure.overCatalog).toBe(true);
    expect(figure.title).toBe("Suggested credit $400.00");
    expect(figure.detail).toBe(
      "Above the Scale catalog price of $249.00. Source: suggested-credit API v1.",
    );

    const html = renderToStaticMarkup(
      createElement(SuggestedCredit, {
        path: "/api/v1/disputes/dsp_1043/suggested-credit",
        catalogPriceCents: SCALE,
        planName: "Scale",
        disputeId: "dsp_1043",
        reportViewId: "view-panel-over",
        reportOverCatalog: true,
        initialCredit: {
          disputeId: "dsp_1043",
          suggestedCreditCents: CLAIM,
          apiVersion: "v1",
        },
      }),
    );
    expect(html).toContain("Suggested credit $400.00");
    expect(html).toContain("Above the Scale catalog price of $249.00");
    expect(html).toContain("bg-danger-soft");
    expect(html).not.toContain("Within the Scale");
  });

  it("shows a capped credit as within the plan price", () => {
    const capped = suggestedCreditFigure({
      error: false,
      credit: { suggestedCreditCents: SCALE, apiVersion: "v2" },
      catalogPriceCents: SCALE,
      planName: "Scale",
    });
    expect(capped.overCatalog).toBe(false);
    expect(capped.title).toBe("Suggested credit $249.00");
    expect(capped.detail).toBe(
      "Within the Scale catalog price of $249.00. Source: suggested-credit API v2.",
    );

    const below = suggestedCreditFigure({
      error: false,
      credit: { suggestedCreditCents: PLAN_PRICE_CENTS.GROWTH, apiVersion: "v2" },
      catalogPriceCents: SCALE,
      planName: "Scale",
    });
    expect(below.overCatalog).toBe(false);
    expect(below.title).toBe("Suggested credit $99.00");
    expect(below.detail).toContain("Within the Scale catalog price of $249.00");
  });

  it("shows loading and a failed request without an amount", () => {
    const loading = suggestedCreditFigure({
      error: false,
      credit: null,
      catalogPriceCents: SCALE,
      planName: "Scale",
    });
    expect(loading).toEqual({
      overCatalog: false,
      title: "Loading suggested credit…",
      detail: "Loading credit policy.",
    });

    const failed = suggestedCreditFigure({
      error: true,
      credit: { suggestedCreditCents: CLAIM, apiVersion: "v1" },
      catalogPriceCents: SCALE,
      planName: "Scale",
    });
    expect(failed.overCatalog).toBe(false);
    expect(failed.title).toBe("Suggested credit unavailable");
    expect(failed.detail).toBe("The credit policy API could not be reached.");
    expect(failed.title).not.toContain("$400.00");

    const html = renderToStaticMarkup(
      createElement(SuggestedCredit, {
        path: "/api/v1/disputes/dsp_1043/suggested-credit",
        catalogPriceCents: SCALE,
        planName: "Scale",
        disputeId: "dsp_1043",
        reportViewId: "view-panel-error",
        reportOverCatalog: false,
        initialError: true,
      }),
    );
    expect(html).toContain("Suggested credit unavailable");
    expect(html).toContain("bg-danger-soft");
    expect(html).not.toContain("$400.00");
    expect(html).not.toContain("$249.00");
  });

  it("reports an over-catalog credit only for the dispute on screen", () => {
    const credit = { disputeId: "dsp_1043", suggestedCreditCents: CLAIM };
    expect(
      suggestedCreditNeedsReport({
        reportOverCatalog: true,
        credit,
        disputeId: "dsp_1043",
        catalogPriceCents: SCALE,
      }),
    ).toBe(true);
    expect(
      suggestedCreditNeedsReport({
        reportOverCatalog: true,
        credit: { disputeId: "dsp_1043", suggestedCreditCents: SCALE + 1 },
        disputeId: "dsp_1043",
        catalogPriceCents: SCALE,
      }),
    ).toBe(true);
    expect(
      suggestedCreditNeedsReport({
        reportOverCatalog: false,
        credit,
        disputeId: "dsp_1043",
        catalogPriceCents: SCALE,
      }),
    ).toBe(false);
    expect(
      suggestedCreditNeedsReport({
        reportOverCatalog: true,
        credit,
        disputeId: "dsp_1047",
        catalogPriceCents: SCALE,
      }),
    ).toBe(false);
    expect(
      suggestedCreditNeedsReport({
        reportOverCatalog: true,
        credit: null,
        disputeId: "dsp_1043",
        catalogPriceCents: SCALE,
      }),
    ).toBe(false);
    expect(
      suggestedCreditNeedsReport({
        reportOverCatalog: true,
        credit: { disputeId: "dsp_1043", suggestedCreditCents: SCALE },
        disputeId: "dsp_1043",
        catalogPriceCents: SCALE,
      }),
    ).toBe(false);
  });
});
