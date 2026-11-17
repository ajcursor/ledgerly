import { afterEach, describe, expect, it, vi } from "vitest";
import { EXTRA_ACCOUNTS } from "@/prisma/extra-accounts";
import { defaultActingCustomer, findSyntheticCustomer } from "@/lib/synthetic-customers";

afterEach(() => {
  vi.doUnmock("@/prisma/extra-accounts");
  vi.doUnmock("@/prisma/core-customers");
  vi.resetModules();
});

describe("synthetic customer catalog", () => {
  it("finds a seeded customer by email ignoring case and surrounding space, and returns null for unknown emails", () => {
    expect(findSyntheticCustomer("  AP@NORTHSTARFAB.EXAMPLE ")).toMatchObject({
      id: "cus_northstarfab",
      company: "Northstar Fabrication",
    });
    expect(findSyntheticCustomer("nobody@realco.com")).toBeNull();
    expect(defaultActingCustomer().company).toBe("Cobalt Goods");
  });

  it("refuses to load when two seeded accounts share an email, ignoring case", async () => {
    const [first] = EXTRA_ACCOUNTS;
    vi.doMock("@/prisma/extra-accounts", () => ({
      EXTRA_ACCOUNTS: [
        ...EXTRA_ACCOUNTS,
        { ...first, customerId: "cus_duplicate", email: first.email.toUpperCase() },
      ],
    }));

    await expect(import("@/lib/synthetic-customers")).rejects.toThrow(
      /Duplicate synthetic customer email: AP@NORTHSTARFAB\.EXAMPLE/,
    );
  });

  it("throws from defaultActingCustomer when the default Cobalt Goods customer is missing", async () => {
    vi.doMock("@/prisma/core-customers", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@/prisma/core-customers")>();
      return {
        ...actual,
        CORE_CUSTOMERS: actual.CORE_CUSTOMERS.filter((customer) => customer.id !== "cus_quarrypine"),
      };
    });
    const { defaultActingCustomer: missingDefault } = await import("@/lib/synthetic-customers");

    expect(() => missingDefault()).toThrow(
      "Default acting customer cus_quarrypine is missing from the seed catalog.",
    );
  });
});
