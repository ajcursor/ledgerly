import { describe, expect, it } from "vitest";
import {
  MIN_TEXT_CONTRAST,
  contrastRatio,
  loadThemeTokens,
  resolveColor,
  type Theme,
} from "./wcag";

// Text/background token pairs the app actually renders. Each value is a CSS
// token from app/globals.css or a literal hex used in a Tailwind class.
const TEXT_PAIRS: { text: string; background: string; usedBy: string }[] = [
  { text: "--foreground", background: "--background", usedBy: "page body" },
  { text: "--card-foreground", background: "--card", usedBy: "cards, tables" },
  { text: "--sidebar-foreground", background: "--sidebar", usedBy: "sidebar" },
  { text: "--muted-foreground", background: "--background", usedBy: "page descriptions" },
  { text: "--muted-foreground", background: "--card", usedBy: "card hints, table dates" },
  { text: "--muted-foreground", background: "--sidebar", usedBy: "inactive nav links" },
  { text: "--muted-foreground", background: "--muted", usedBy: "muted badge, search placeholder" },
  { text: "--muted-foreground", background: "--indigo-soft", usedBy: "collections queue callout" },
  { text: "--primary-foreground", background: "--primary", usedBy: "default button and badge" },
  { text: "--primary-foreground", background: "--indigo", usedBy: "active filter pill, nav count" },
  { text: "--secondary-foreground", background: "--secondary", usedBy: "secondary badge and button" },
  { text: "--accent-foreground", background: "--accent", usedBy: "outline and ghost button hover" },
  { text: "--indigo", background: "--indigo-soft", usedBy: "active nav link, avatar, icon chips" },
  { text: "--indigo", background: "--background", usedBy: "page eyebrow" },
  { text: "--indigo", background: "--card", usedBy: "notice bell links" },
  { text: "--success", background: "--success-soft", usedBy: "Paid and Accepted badges" },
  { text: "--warning", background: "--warning-soft", usedBy: "Open and dispute warning badges" },
  { text: "--danger", background: "--danger-soft", usedBy: "Overdue, Disputed badges; suggested credit" },
  { text: "--success", background: "--card", usedBy: "KPI growth up" },
  { text: "--danger", background: "--card", usedBy: "KPI growth down" },
];

const tokens = loadThemeTokens();

function color(theme: Theme, value: string): string {
  return resolveColor(tokens[theme], value.startsWith("--") ? `var(${value})` : value);
}

describe("WCAG 1.4.3 text contrast (4.5:1)", () => {
  for (const theme of ["light", "dark"] as const) {
    describe(`${theme} theme`, () => {
      it.each(TEXT_PAIRS)("$text on $background ($usedBy)", ({ text, background }) => {
        const fg = color(theme, text);
        const bg = color(theme, background);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `${fg} on ${bg} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
          MIN_TEXT_CONTRAST,
        );
      });
    });
  }
});

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });
});
