import type { ReactNode } from "react";
import { AppChrome } from "@/components/app-chrome";
import { getOpenDisputeCount, getOpenDisputeNotices } from "@/lib/data";
import { isDemoModeEnabled } from "@/lib/demo/mode";
import { viewingAsPickerModel } from "@/lib/demo/viewing-as";
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

  return (
    <AppChrome
      openDisputeCount={openDisputeCount}
      openDisputes={openDisputes}
      viewingAs={viewingAsPickerModel(isDemoModeEnabled(), actingCustomer)}
    >
      {children}
    </AppChrome>
  );
}
