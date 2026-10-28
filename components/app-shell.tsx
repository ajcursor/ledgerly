import type { ReactNode } from "react";
import { AppChrome } from "@/components/app-chrome";
import { getOpenDisputeCount, getOpenDisputeNotices } from "@/lib/data";
import { isDemoModeEnabled } from "@/lib/demo/mode";
import { viewingAsPickerModel } from "@/lib/demo/viewing-as";
import { DEMO_OPERATOR } from "@/lib/demo-session";
import { getOperatorProfile } from "@/lib/operator-profile";
import type { SyntheticCustomer } from "@/lib/synthetic-customers";

export async function AppShell({
  actingCustomer,
  children,
}: {
  actingCustomer: SyntheticCustomer;
  children: ReactNode;
}) {
  let openDisputeCount = 0;
  let openDisputes: Awaited<ReturnType<typeof getOpenDisputeNotices>> = [];
  try {
    [openDisputeCount, openDisputes] = await Promise.all([
      getOpenDisputeCount(),
      getOpenDisputeNotices(),
    ]);
  } catch {
    openDisputeCount = 0;
    openDisputes = [];
  }

  let operator = {
    displayName: DEMO_OPERATOR.name,
    role: DEMO_OPERATOR.role,
    initials: DEMO_OPERATOR.initials,
  };
  try {
    const profile = await getOperatorProfile();
    operator = {
      displayName: profile.displayName,
      role: profile.role,
      initials: profile.initials,
    };
  } catch {
    // Header still renders if the operator row is missing before seed.
  }

  return (
    <AppChrome
      openDisputeCount={openDisputeCount}
      openDisputes={openDisputes}
      viewingAs={viewingAsPickerModel(isDemoModeEnabled(), actingCustomer)}
      operator={operator}
    >
      {children}
    </AppChrome>
  );
}
