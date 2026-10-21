export type LedgerlySentryOptions = {
  dsn: string;
  tracesSampleRate: number;
  environment?: string;
};

function nonempty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Server and edge prefer `SENTRY_DSN`. The browser only sees
 * `NEXT_PUBLIC_SENTRY_DSN`. No DSN means the SDK stays uninitialized.
 */
export function readSentryDsn(): string | undefined {
  return nonempty(process.env.SENTRY_DSN) ?? nonempty(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function sentryInitOptions(): LedgerlySentryOptions | null {
  const dsn = readSentryDsn();
  if (!dsn) return null;

  const environment = nonempty(process.env.SENTRY_ENVIRONMENT);
  return {
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    ...(environment ? { environment } : {}),
  };
}
