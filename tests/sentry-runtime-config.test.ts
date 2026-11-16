import { afterEach, describe, expect, it, vi } from "vitest";

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => sentry);

const DSN = "https://server@example.ingest.sentry.io/2";
const ENV_KEYS = ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN", "SENTRY_ENVIRONMENT"] as const;
const originalEnv = new Map<string, string | undefined>(ENV_KEYS.map((key) => [key, process.env[key]]));

function clearDsnEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe("sentry runtime config", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    for (const key of ENV_KEYS) {
      const value = originalEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("leaves the server, edge, and browser SDKs uninitialized without a DSN", async () => {
    clearDsnEnv();
    vi.resetModules();
    await import("@/sentry.server.config");
    await import("@/sentry.edge.config");
    await import("@/instrumentation-client");

    expect(sentry.init).not.toHaveBeenCalled();
  });

  it("initializes each runtime from the shared DSN and keeps the router hook", async () => {
    clearDsnEnv();
    process.env.SENTRY_DSN = DSN;
    process.env.SENTRY_ENVIRONMENT = "demo";
    vi.resetModules();

    await import("@/sentry.server.config");
    await import("@/sentry.edge.config");
    const client = await import("@/instrumentation-client");

    expect(sentry.init).toHaveBeenCalledTimes(3);
    expect(sentry.init).toHaveBeenCalledWith({
      dsn: DSN,
      tracesSampleRate: 0.1,
      environment: "demo",
    });
    expect(client.onRouterTransitionStart).toBe(sentry.captureRouterTransitionStart);
  });
});
