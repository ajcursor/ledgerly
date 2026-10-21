"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorState({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 py-16">
      <p className="text-xs font-medium tracking-[0.16em] text-indigo uppercase">Ledgerly hit a snag</p>
      <h1 className="text-3xl font-semibold tracking-tight">The ledger did not load.</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        If this is a fresh checkout, run <code className="font-mono text-foreground">npx prisma db seed</code>{" "}
        and refresh. The demo database is local SQLite — nothing here talks to a real billing provider.
      </p>
      <p className="font-mono text-xs text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
