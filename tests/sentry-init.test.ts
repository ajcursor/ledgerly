import { afterEach, describe, expect, it } from "vitest";
import { sentryInitOptions } from "@/lib/sentry";

const ENV_KEYS = ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN", "SENTRY_ENVIRONMENT"] as const;

const original = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]])) as Record<
  (typeof ENV_KEYS)[number],
  string | undefined
>;

function restoreEnv() {
  for (const key of ENV_KEYS) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe("sentryInitOptions", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("stays uninitialized when no DSN is set", () => {
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    process.env.SENTRY_ENVIRONMENT = "demo";

    expect(sentryInitOptions()).toBeNull();
  });

  it("treats a blank DSN as unset", () => {
    process.env.SENTRY_DSN = "   ";
    process.env.NEXT_PUBLIC_SENTRY_DSN = "";

    expect(sentryInitOptions()).toBeNull();
  });

  it("uses the public DSN and environment when those are the values provided", () => {
    delete process.env.SENTRY_DSN;
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@example.ingest.sentry.io/1";
    process.env.SENTRY_ENVIRONMENT = "demo";

    expect(sentryInitOptions()).toMatchObject({
      dsn: "https://public@example.ingest.sentry.io/1",
      environment: "demo",
    });
  });

  it("prefers SENTRY_DSN for the server", () => {
    process.env.SENTRY_DSN = "https://server@example.ingest.sentry.io/2";
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@example.ingest.sentry.io/1";
    delete process.env.SENTRY_ENVIRONMENT;

    const options = sentryInitOptions();
    expect(options?.dsn).toBe("https://server@example.ingest.sentry.io/2");
    expect(options).not.toHaveProperty("environment");
  });
});
