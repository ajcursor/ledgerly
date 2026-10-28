import { DEMO_OPERATOR } from "@/lib/demo-session";
import { prisma } from "@/lib/prisma";

export const OPERATOR_ID = "op_avery";

/**
 * IANA zone `Intl.supportedValuesOf("timeZone")` accepts.
 * UTC is absent from that list on this runtime.
 */
export const SEEDED_OPERATOR_TIMEZONE = "America/New_York";

export const SEEDED_OPERATOR = {
  id: OPERATOR_ID,
  displayName: DEMO_OPERATOR.name,
  role: DEMO_OPERATOR.role,
  email: DEMO_OPERATOR.email,
  timezone: SEEDED_OPERATOR_TIMEZONE,
  notifyDisputeOpened: true,
  notifyInvoiceOverdue: true,
  notifyWeeklyDigest: false,
} as const;

export type OperatorProfile = {
  id: string;
  displayName: string;
  role: string;
  email: string;
  timezone: string;
  notifyDisputeOpened: boolean;
  notifyInvoiceOverdue: boolean;
  notifyWeeklyDigest: boolean;
  updatedAt: Date;
  initials: string;
};

export type OperatorProfileInput = {
  displayName: string;
  role: string;
  email: string;
  timezone: string;
  notifyDisputeOpened: boolean;
  notifyInvoiceOverdue: boolean;
  notifyWeeklyDigest: boolean;
};

export type OperatorField = keyof OperatorProfileInput;

export type OperatorFieldErrors = Partial<Record<OperatorField, string>>;

export type OperatorFormState = {
  saved: boolean;
  fieldErrors: OperatorFieldErrors;
  values: OperatorProfileInput;
};

const DISPLAY_NAME_MAX = 80;
const ROLE_MAX = 80;
const EMAIL_MAX = 254;
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function emptyOperatorFormState(values: OperatorProfileInput): OperatorFormState {
  return { saved: false, fieldErrors: {}, values };
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parsePreference(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return false;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "") return false;
  if (normalized === "true" || normalized === "on" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "off" || normalized === "0" || normalized === "no") return false;
  return null;
}

let knownTimeZones: Set<string> | undefined;

function isKnownTimeZone(value: string): boolean {
  if (!knownTimeZones) knownTimeZones = new Set(Intl.supportedValuesOf("timeZone"));
  return knownTimeZones.has(value);
}

export function validateOperatorProfile(raw: {
  displayName: unknown;
  role: unknown;
  email: unknown;
  timezone: unknown;
  notifyDisputeOpened: unknown;
  notifyInvoiceOverdue: unknown;
  notifyWeeklyDigest: unknown;
}):
  | { ok: true; value: OperatorProfileInput }
  | { ok: false; fieldErrors: OperatorFieldErrors; values: OperatorProfileInput } {
  const displayName = text(raw.displayName).trim();
  const role = text(raw.role).trim();
  const email = text(raw.email).trim();
  const timezone = text(raw.timezone).trim();
  const notifyDisputeOpened = parsePreference(raw.notifyDisputeOpened);
  const notifyInvoiceOverdue = parsePreference(raw.notifyInvoiceOverdue);
  const notifyWeeklyDigest = parsePreference(raw.notifyWeeklyDigest);
  const fieldErrors: OperatorFieldErrors = {};

  if (!displayName) fieldErrors.displayName = "Display name is required.";
  else if (displayName.length > DISPLAY_NAME_MAX) {
    fieldErrors.displayName = `Display name must be ${DISPLAY_NAME_MAX} characters or fewer.`;
  }

  if (!role) fieldErrors.role = "Role is required.";
  else if (role.length > ROLE_MAX) {
    fieldErrors.role = `Role must be ${ROLE_MAX} characters or fewer.`;
  }

  if (!email || email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter a valid email.";
  }

  if (!isKnownTimeZone(timezone)) {
    fieldErrors.timezone = "Enter a valid IANA timezone.";
  }

  if (notifyDisputeOpened === null) fieldErrors.notifyDisputeOpened = "Choose yes or no.";
  if (notifyInvoiceOverdue === null) fieldErrors.notifyInvoiceOverdue = "Choose yes or no.";
  if (notifyWeeklyDigest === null) fieldErrors.notifyWeeklyDigest = "Choose yes or no.";

  const values: OperatorProfileInput = {
    displayName,
    role,
    email,
    timezone,
    notifyDisputeOpened: notifyDisputeOpened ?? false,
    notifyInvoiceOverdue: notifyInvoiceOverdue ?? false,
    notifyWeeklyDigest: notifyWeeklyDigest ?? false,
  };

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors, values };
  return { ok: true, value: values };
}

export function operatorInitials(displayName: string): string {
  const letters = displayName
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z]/g, "").charAt(0))
    .filter((letter) => letter.length > 0)
    .slice(0, 3);
  return letters.join("").toUpperCase();
}

export async function getOperatorProfile(): Promise<OperatorProfile> {
  const row = await prisma.operator.findUnique({ where: { id: OPERATOR_ID } });
  if (!row) {
    throw new Error("Operator profile is not seeded.");
  }
  return {
    id: row.id,
    displayName: row.displayName,
    role: row.role,
    email: row.email,
    timezone: row.timezone,
    notifyDisputeOpened: row.notifyDisputeOpened,
    notifyInvoiceOverdue: row.notifyInvoiceOverdue,
    notifyWeeklyDigest: row.notifyWeeklyDigest,
    updatedAt: row.updatedAt,
    initials: operatorInitials(row.displayName),
  };
}
