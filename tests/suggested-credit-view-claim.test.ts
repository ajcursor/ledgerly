import { describe, expect, it, vi } from "vitest";

describe("suggested credit view claims", () => {
  it("drops the oldest view id after 200 claims so that visit can report again", async () => {
    vi.resetModules();
    const { claimSuggestedCreditView } = await import("@/lib/demo/suggested-credit-over-refund");

    expect(claimSuggestedCreditView("view-0")).toBe(true);
    for (let index = 1; index <= 200; index += 1) {
      expect(claimSuggestedCreditView(`view-${index}`)).toBe(true);
    }

    expect(claimSuggestedCreditView("view-0")).toBe(true);
    expect(claimSuggestedCreditView("view-200")).toBe(false);
    expect(claimSuggestedCreditView("view-1")).toBe(true);
  });
});
