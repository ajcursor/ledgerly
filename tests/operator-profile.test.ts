import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { saveOperatorProfile } from "@/app/profile/actions";
import ProfilePage from "@/app/profile/page";
import { DEMO_OPERATOR } from "@/lib/demo-session";
import {
  emptyOperatorFormState,
  getOperatorProfile,
  OPERATOR_ID,
  SEEDED_OPERATOR,
  SEEDED_OPERATOR_TIMEZONE,
  type OperatorFormState,
  type OperatorProfileInput,
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

const seededInput: OperatorProfileInput = {
  displayName: SEEDED_OPERATOR.displayName,
  role: SEEDED_OPERATOR.role,
  email: SEEDED_OPERATOR.email,
  timezone: SEEDED_OPERATOR.timezone,
  notifyDisputeOpened: SEEDED_OPERATOR.notifyDisputeOpened,
  notifyInvoiceOverdue: SEEDED_OPERATOR.notifyInvoiceOverdue,
  notifyWeeklyDigest: SEEDED_OPERATOR.notifyWeeklyDigest,
};

function previousState(): OperatorFormState {
  return emptyOperatorFormState(seededInput);
}

function profileForm(overrides: Record<string, string | null> = {}) {
  const fields: Record<string, string | null> = {
    displayName: seededInput.displayName,
    role: seededInput.role,
    email: seededInput.email,
    timezone: seededInput.timezone,
    notifyDisputeOpened: "on",
    notifyInvoiceOverdue: "on",
    notifyWeeklyDigest: null,
    ...overrides,
  };
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== null) form.set(key, value);
  }
  return form;
}

async function expectUnchanged(before: Awaited<ReturnType<typeof getOperatorProfile>>) {
  const after = await getOperatorProfile();
  expect(after.displayName).toBe(before.displayName);
  expect(after.role).toBe(before.role);
  expect(after.email).toBe(before.email);
  expect(after.timezone).toBe(before.timezone);
  expect(after.notifyDisputeOpened).toBe(before.notifyDisputeOpened);
  expect(after.notifyInvoiceOverdue).toBe(before.notifyInvoiceOverdue);
  expect(after.notifyWeeklyDigest).toBe(before.notifyWeeklyDigest);
  expect(after.updatedAt).toEqual(before.updatedAt);
}

describe("saveOperatorProfile", () => {
  it("saves a valid profile and trims the display name", async () => {
    const result = await saveOperatorProfile(
      previousState(),
      profileForm({
        displayName: "  Avery Q. Quinn  ",
        timezone: "America/Chicago",
        notifyInvoiceOverdue: "false",
        notifyWeeklyDigest: "true",
      }),
    );

    expect(result.saved).toBe(true);
    expect(result.fieldErrors).toEqual({});
    const stored = await getOperatorProfile();
    expect(stored.displayName).toBe("Avery Q. Quinn");
    expect(stored.role).toBe("Billing ops");
    expect(stored.email).toBe("avery.quinn@fieldnote.example");
    expect(stored.timezone).toBe("America/Chicago");
    expect(stored.notifyDisputeOpened).toBe(true);
    expect(stored.notifyInvoiceOverdue).toBe(false);
    expect(stored.notifyWeeklyDigest).toBe(true);
    expect(stored.initials).toBe("AQQ");
  });

  it("rejects an empty display name and saves nothing", async () => {
    const before = await getOperatorProfile();
    for (const displayName of ["", "   "]) {
      const result = await saveOperatorProfile(previousState(), profileForm({ displayName, email: "other@fieldnote.example" }));
      expect(result.saved).toBe(false);
      expect(result.fieldErrors.displayName).toBe("Display name is required.");
    }
    await expectUnchanged(before);
  });

  it("rejects a display name longer than 80 characters and saves nothing", async () => {
    const before = await getOperatorProfile();
    const result = await saveOperatorProfile(previousState(), profileForm({ displayName: "A".repeat(81) }));
    expect(result.saved).toBe(false);
    expect(result.fieldErrors.displayName).toBe("Display name must be 80 characters or fewer.");
    await expectUnchanged(before);
  });

  it("rejects an empty role and saves nothing", async () => {
    const before = await getOperatorProfile();
    const result = await saveOperatorProfile(previousState(), profileForm({ role: "   " }));
    expect(result.saved).toBe(false);
    expect(result.fieldErrors.role).toBe("Role is required.");
    await expectUnchanged(before);
  });

  it("rejects a role longer than 80 characters and saves nothing", async () => {
    const before = await getOperatorProfile();
    const result = await saveOperatorProfile(previousState(), profileForm({ role: "R".repeat(81) }));
    expect(result.saved).toBe(false);
    expect(result.fieldErrors.role).toBe("Role must be 80 characters or fewer.");
    await expectUnchanged(before);
  });

  it("rejects an invalid email and saves nothing", async () => {
    const before = await getOperatorProfile();
    const result = await saveOperatorProfile(
      previousState(),
      profileForm({ email: "not-an-email", displayName: "Avery Q. Quinn" }),
    );
    expect(result.saved).toBe(false);
    expect(result.fieldErrors.email).toBe("Enter a valid email.");
    await expectUnchanged(before);
  });

  it("rejects an unknown timezone and saves nothing", async () => {
    const before = await getOperatorProfile();
    const result = await saveOperatorProfile(previousState(), profileForm({ timezone: "Not/AZone" }));
    expect(result.saved).toBe(false);
    expect(result.fieldErrors.timezone).toBe("Enter a valid IANA timezone.");
    await expectUnchanged(before);
  });

  it("rejects a notification preference that is not yes or no and saves nothing", async () => {
    const before = await getOperatorProfile();
    const result = await saveOperatorProfile(previousState(), profileForm({ notifyWeeklyDigest: "maybe" }));
    expect(result.saved).toBe(false);
    expect(result.fieldErrors.notifyWeeklyDigest).toBe("Choose yes or no.");
    await expectUnchanged(before);
  });
});

describe("profile page", () => {
  it("renders the seeded profile", async () => {
    const html = renderToStaticMarkup(await ProfilePage());
    expect(html).toContain("Avery Quinn");
    expect(html).toContain("Billing ops");
    expect(html).toContain("avery.quinn@fieldnote.example");
    expect(html).toContain("America/New_York");
    expect(html).toContain("Dispute opened");
    expect(html).toContain("Invoice overdue");
    expect(html).toContain("Weekly digest");
    expect(html).toContain('name="notifyDisputeOpened"');
    expect(html).toMatch(/name="notifyDisputeOpened"[^>]*\bchecked\b|\bchecked\b[^>]*name="notifyDisputeOpened"/);
    expect(html).not.toMatch(/name="notifyWeeklyDigest"[^>]*\bchecked\b|\bchecked\b[^>]*name="notifyWeeklyDigest"/);
  });
});
