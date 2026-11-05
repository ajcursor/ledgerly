"use server";

import { revalidatePath } from "next/cache";
import {
  OPERATOR_ID,
  validateOperatorProfile,
  type OperatorFormState,
} from "@/lib/operator-profile";
import { prisma } from "@/lib/prisma";

export async function saveOperatorProfile(
  _previous: OperatorFormState,
  formData: FormData,
): Promise<OperatorFormState> {
  const result = validateOperatorProfile({
    displayName: formData.get("displayName"),
    role: formData.get("role"),
    email: formData.get("email"),
    timezone: formData.get("timezone"),
    notifyDisputeOpened: formData.get("notifyDisputeOpened"),
    notifyInvoiceOverdue: formData.get("notifyInvoiceOverdue"),
    notifyWeeklyDigest: formData.get("notifyWeeklyDigest"),
  });

  if (!result.ok) {
    return { saved: false, fieldErrors: result.fieldErrors, values: result.values };
  }

  await prisma.operator.update({
    where: { id: OPERATOR_ID },
    data: result.value,
  });

  if (process.env.VITEST !== "true") {
    revalidatePath("/", "layout");
    revalidatePath("/profile");
    revalidatePath("/settings");
  }

  return { saved: true, fieldErrors: {}, values: result.value };
}
