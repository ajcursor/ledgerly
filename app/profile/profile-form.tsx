"use client";

import { useActionState, useState } from "react";
import { saveOperatorProfile } from "@/app/profile/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  emptyOperatorFormState,
  type OperatorField,
  type OperatorFormState,
  type OperatorProfileInput,
} from "@/lib/operator-profile";

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
  const [draft, setDraft] = useState(profile);
  const [state, formAction, pending] = useActionState(
    async (previous: OperatorFormState, formData: FormData) => {
      const next = await saveOperatorProfile(previous, formData);
      setDraft(next.values);
      return next;
    },
    emptyOperatorFormState(profile),
  );
  const errors = state.fieldErrors;

  function updateDraft<K extends keyof OperatorProfileInput>(field: K, value: OperatorProfileInput[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
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
              value={draft.displayName}
              autoComplete="name"
              onChange={(event) => updateDraft("displayName", event.target.value)}
              {...textProps("displayName", errors.displayName)}
            />
            <FieldError id="displayName-error" message={errors.displayName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              name="role"
              value={draft.role}
              autoComplete="organization-title"
              onChange={(event) => updateDraft("role", event.target.value)}
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
              value={draft.email}
              autoComplete="email"
              onChange={(event) => updateDraft("email", event.target.value)}
              {...textProps("email", errors.email)}
            />
            <FieldError id="email-error" message={errors.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              value={draft.timezone}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => updateDraft("timezone", event.target.value)}
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
            checked={draft.notifyDisputeOpened}
            onChecked={(checked) => updateDraft("notifyDisputeOpened", checked)}
            error={errors.notifyDisputeOpened}
          />
          <Preference
            id="notifyInvoiceOverdue"
            label="Invoice overdue"
            hint="Keep a note when an invoice goes overdue."
            checked={draft.notifyInvoiceOverdue}
            onChecked={(checked) => updateDraft("notifyInvoiceOverdue", checked)}
            error={errors.notifyInvoiceOverdue}
          />
          <Preference
            id="notifyWeeklyDigest"
            label="Weekly digest"
            hint="Keep a weekly summary of the collections queue."
            checked={draft.notifyWeeklyDigest}
            onChecked={(checked) => updateDraft("notifyWeeklyDigest", checked)}
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
  checked,
  onChecked,
  error,
}: {
  id: OperatorField;
  label: string;
  hint: string;
  checked: boolean;
  onChecked: (checked: boolean) => void;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <Input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChecked(event.target.checked)}
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
