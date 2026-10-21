"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { resolveActingCustomer } from "@/lib/acting-customer";
import { applyActingCustomer } from "@/lib/sentry-user";
import { ACTING_CUSTOMER_COOKIE, defaultActingCustomer } from "@/lib/synthetic-customers";

function readBrowserCookie(name: string): string | null {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return decodeURIComponent(trimmed.slice(prefix.length));
  }
  return null;
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const queryEmail = new URLSearchParams(window.location.search).get("as");
    const resolved = resolveActingCustomer({
      queryEmail,
      cookieEmail: readBrowserCookie(ACTING_CUSTOMER_COOKIE),
    });
    applyActingCustomer("error" in resolved ? defaultActingCustomer() : resolved.customer);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <p>Ledgerly hit a snag</p>
        <h1>The ledger did not load.</h1>
        <p>
          If this is a fresh checkout, run npx prisma db seed and refresh. The demo database is local SQLite.
        </p>
        <p>{error.message}</p>
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </body>
    </html>
  );
}
