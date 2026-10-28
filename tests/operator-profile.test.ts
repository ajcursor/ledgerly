import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_OPERATOR } from "@/lib/demo-session";
import {
  getOperatorProfile,
  OPERATOR_ID,
  SEEDED_OPERATOR,
  SEEDED_OPERATOR_TIMEZONE,
} from "@/lib/operator-profile";
import { prisma } from "@/lib/prisma";

beforeEach(async () => {
  await prisma.operator.upsert({
    where: { id: OPERATOR_ID },
    create: { ...SEEDED_OPERATOR },
    update: { ...SEEDED_OPERATOR },
  });
});

describe("getOperatorProfile", () => {
  it("returns Avery Quinn's seeded defaults", async () => {
    const profile = await getOperatorProfile();
    expect(profile).toMatchObject({
      id: OPERATOR_ID,
      displayName: DEMO_OPERATOR.name,
      role: DEMO_OPERATOR.role,
      email: DEMO_OPERATOR.email,
      timezone: SEEDED_OPERATOR_TIMEZONE,
      notifyDisputeOpened: true,
      notifyInvoiceOverdue: true,
      notifyWeeklyDigest: false,
      initials: "AQ",
    });
    expect(profile.displayName).toBe("Avery Quinn");
    expect(profile.role).toBe("Billing ops");
    expect(profile.email).toBe("avery.quinn@fieldnote.example");
    expect(profile.timezone).toBe("America/New_York");
  });
});
