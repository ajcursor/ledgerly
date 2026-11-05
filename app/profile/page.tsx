import { ProfileForm } from "@/app/profile/profile-form";
import { PageHeader } from "@/components/page-header";
import { getOperatorProfile } from "@/lib/operator-profile";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const profile = await getOperatorProfile();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Name, role, email, timezone, and which billing events to keep on file. Preferences are stored only."
      />
      <ProfileForm
        profile={{
          displayName: profile.displayName,
          role: profile.role,
          email: profile.email,
          timezone: profile.timezone,
          notifyDisputeOpened: profile.notifyDisputeOpened,
          notifyInvoiceOverdue: profile.notifyInvoiceOverdue,
          notifyWeeklyDigest: profile.notifyWeeklyDigest,
        }}
      />
    </div>
  );
}
