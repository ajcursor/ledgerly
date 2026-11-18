import { describe, expect, it } from "vitest";
import { parseTheme } from "@/components/theme-toggle";

describe("theme preference parsing", () => {
  it("enables dark mode only for the exact stored dark value", () => {
    expect(parseTheme("dark")).toBe("dark");
  });

  it("falls back to light for missing, unknown, or differently cased values", () => {
    for (const stored of [null, "", "light", "DARK", " dark", "dark ", "system"]) {
      expect(parseTheme(stored)).toBe("light");
    }
  });
});
