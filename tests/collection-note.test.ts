import { describe, expect, it } from "vitest";
import { draftCollectionNote } from "@/lib/collection-note";
import { formatUsd } from "@/lib/money";
import { PLAN_IDS, PLAN_PRICE_CENTS, planLabel } from "@/lib/plans";

describe("collection note draft", () => {
  it("names the customer and plan and leaves the catalog price out", () => {
    for (const plan of PLAN_IDS) {
      const note = draftCollectionNote({
        customerName: "Riverstone Labs",
        daysPastDue: 12,
        plan,
      });
      expect(note).toContain("Riverstone Labs");
      expect(note).toContain(planLabel(plan));
      expect(note).not.toContain("$");
      expect(note).not.toContain(formatUsd(PLAN_PRICE_CENTS[plan]));
      expect(note).not.toContain(String(PLAN_PRICE_CENTS[plan]));
    }
  });
});
