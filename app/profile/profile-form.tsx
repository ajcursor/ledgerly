"use client";

import { useActionState } from "react";
import { saveOperatorProfile } from "@/app/profile/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emptyOperatorFormState, type OperatorField, type OperatorProfileInput } from "@/lib/operator-profile";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-danger">
      {message}
    </p>
  );
}

function textProps(field: OperatorField, message?: string) {
  return {
    "aria-invalid": message ? true : undefined,
    "aria-describedby": message ? `${field}-error` : undefined,
  };
}

export function ProfileForm({ profile }: { profile: OperatorProfileInput }) {
  const [state, formAction, pending] = useActionState(saveOperatorProfile, emptyOperatorFormState(profile));
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Operator</CardTitle>
          <CardDescription>Shown in the header and on Settings. There is no sign-in behind this form.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={profile.displayName}
              autoComplete="name"
              {...textProps("displayName", errors.displayName)}
            />
            <FieldError id="displayName-error" message={errors.displayName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              name="role"
              defaultValue={profile.role}
              autoComplete="organization-title"
              {...textProps("role", errors.role)}
            />
            <FieldError id="role-error" message={errors.role} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={profile.email}
              autoComplete="email"
              {...textProps("email", errors.email)}
            />
            <FieldError id="email-error" message={errors.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue={profile.timezone}
              autoComplete="off"
              spellCheck={false}
              {...textProps("timezone", errors.timezone)}
            />
            <FieldError id="timezone-error" message={errors.timezone} />
            <p className="text-xs text-muted-foreground">IANA name, such as America/New_York.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Stored on this profile. Ledgerly does not send mail.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Preference
            id="notifyDisputeOpened"
            label="Dispute opened"
            hint="Keep a note when a dispute is opened."
            defaultChecked={profile.notifyDisputeOpened}
            error={errors.notifyDisputeOpened}
          />
          <Preference
            id="notifyInvoiceOverdue"
            label="Invoice overdue"
            hint="Keep a note when an invoice goes overdue."
            defaultChecked={profile.notifyInvoiceOverdue}
            error={errors.notifyInvoiceOverdue}
          />
          <Preference
            id="notifyWeeklyDigest"
            label="Weekly digest"
            hint="Keep a weekly summary of the collections queue."
            defaultChecked={profile.notifyWeeklyDigest}
            error={errors.notifyWeeklyDigest}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
        {state.saved ? (
          <p role="status" className="text-sm font-medium text-foreground">
            Profile saved.
          </p>
        ) : null}
      </div>
    </form>
  );
}

function Preference({
  id,
  label,
  hint,
  defaultChecked,
  error,
}: {
  id: OperatorField;
  label: string;
  hint: string;
  defaultChecked: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <Input
          id={id}
          name={id}
          type="checkbox"
          defaultChecked={defaultChecked}
          className="size-4"
          {...textProps(id, error)}
        />
        <Label htmlFor={id}>{label}</Label>
      </div>
      <p className="pl-7 text-xs text-muted-foreground">{hint}</p>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
