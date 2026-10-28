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
