"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { readBrowserCookie, resolveActingCustomer } from "@/lib/acting-customer";
import { applyActingCustomer } from "@/lib/sentry-user";
import { ACTING_CUSTOMER_COOKIE, defaultActingCustomer } from "@/lib/synthetic-customers";

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
      cookieEmail: readBrowserCookie(document.cookie, ACTING_CUSTOMER_COOKIE),
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
