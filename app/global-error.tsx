"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { resolveActingCustomer } from "@/lib/acting-customer";
import { applyActingCustomer } from "@/lib/sentry-user";
import { ACTING_CUSTOMER_COOKIE, defaultActingCustomer } from "@/lib/synthetic-customers";

function readBrowserCookie(header: string, name: string): string | null {
  const prefix = `${name}=`;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(prefix)) continue;
    return decodeURIComponent(trimmed.slice(prefix.length));
  }
  return null;
}

/**
 * Attribute the acting customer, then report the original failure.
 * A truncated percent-escape throws inside the cookie reader. That must not
 * drop the report, and it must not discard a valid `?as=`.
 */
export function reportGlobalError(
  error: unknown,
  source: { search: string; cookie: string },
) {
  let cookieEmail: string | null = null;
  try {
    cookieEmail = readBrowserCookie(source.cookie, ACTING_CUSTOMER_COOKIE);
  } catch {
    cookieEmail = null;
  }
  const queryEmail = new URLSearchParams(source.search).get("as");
  const resolved = resolveActingCustomer({
    queryEmail,
    cookieEmail,
  });
  applyActingCustomer("error" in resolved ? defaultActingCustomer() : resolved.customer);
  Sentry.captureException(error);
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportGlobalError(error, {
      search: window.location.search,
      cookie: document.cookie,
    });
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
