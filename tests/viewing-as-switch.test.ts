import { describe, expect, it, vi } from "vitest";
import { viewingAsCustomers, viewingAsSwitchHref } from "@/lib/demo/viewing-as";

vi.mock("@/lib/synthetic-customers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/synthetic-customers")>();
  return {
    ...actual,
    syntheticCustomers: () => actual.syntheticCustomers().filter((customer) => customer.id !== "cus_fernway"),
  };
});

const CURRENT = "ellis.marlow@cobaltgoods.brightdesk-demo.co.uk";
const NEXT = "lila.shore@copperleaf.brightdesk-demo.co.uk";

describe("viewing-as picker switch", () => {
  it("does not reload when the picker re-selects the current contact", () => {
    expect(
      viewingAsSwitchHref("http://localhost:43173/invoices?status=OPEN", CURRENT, CURRENT),
    ).toBeNull();
  });

  it("swaps only the as param and keeps the page, other query params, and hash", () => {
    const href = viewingAsSwitchHref(
      `http://localhost:43173/disputes/dsp_1043?status=OPEN&as=${encodeURIComponent(CURRENT)}#note`,
      CURRENT,
      NEXT,
    );
    if (!href) throw new Error("Expected a navigation href for a different contact.");

    const url = new URL(href);
    expect(url.pathname).toBe("/disputes/dsp_1043");
    expect(url.searchParams.get("status")).toBe("OPEN");
    expect(url.searchParams.getAll("as")).toEqual([NEXT]);
    expect(url.hash).toBe("#note");
  });

  it("fails loudly when a viewing-as contact is missing from the catalog", () => {
    expect(() => viewingAsCustomers()).toThrow(
      "Viewing-as contact cus_fernway is missing from the customer catalog.",
    );
  });
});
