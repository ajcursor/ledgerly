"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export async function postDisputeResolution(
  disputeId: string,
  action: "accept" | "decline",
  reviewerNote: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetchImpl(`/api/disputes/${encodeURIComponent(disputeId)}/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, reviewerNote }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      return { ok: false, error: body?.error ?? "Resolve failed." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Resolve failed." };
  }
}

export function ResolutionPanel({
  disputeId,
  initialNote,
}: {
  disputeId: string;
  initialNote: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "accept" | "decline") {
    setPending(true);
    setError(null);
    try {
      const result = await postDisputeResolution(disputeId, action, note);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="reviewer-note">Reviewer note</Label>
      <Textarea
        id="reviewer-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Note for the credit decision."
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={() => submit("accept")}>
          Accept credit
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => submit("decline")}>
          Decline
        </Button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
