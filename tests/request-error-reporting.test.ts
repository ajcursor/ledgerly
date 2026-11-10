import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runtimeLoads = vi.hoisted(() => ({
  server: vi.fn(),
  edge: vi.fn(),
}));

vi.mock("../sentry.server.config", () => {
  runtimeLoads.server();
  return {};
});

vi.mock("../sentry.edge.config", () => {
  runtimeLoads.edge();
  return {};
});

vi.mock("@sentry/nextjs", () => ({
  captureRequestError: vi.fn(),
  init: vi.fn(),
}));

vi.mock("@/lib/sentry-request", () => ({
  attributeServerRequest: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { attributeServerRequest } from "@/lib/sentry-request";
import { onRequestError, register } from "@/instrumentation";
import { isDemoErrorCaptured, markDemoErrorCaptured } from "@/lib/sentry-user";

const request = {
  path: "/api/invoices/inv_1043",
  method: "GET",
  headers: { cookie: "ledgerly-acting-customer=ada@example" },
};

const context = {
  routerKind: "App Router" as const,
  routePath: "/api/invoices/[id]",
  routeType: "route" as const,
  revalidateReason: undefined,
};

describe("request error reporting", () => {
  const previousRuntime = process.env.NEXT_RUNTIME;

  beforeEach(() => {
    runtimeLoads.server.mockClear();
    runtimeLoads.edge.mockClear();
    vi.clearAllMocks();
    vi.mocked(attributeServerRequest).mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (previousRuntime === undefined) delete process.env.NEXT_RUNTIME;
    else process.env.NEXT_RUNTIME = previousRuntime;
  });

  it("does not report a demo error that was already captured", () => {
    const error = new Error("already sent");
    markDemoErrorCaptured(error);

    onRequestError(error, request, context);

    expect(isDemoErrorCaptured(error)).toBe(true);
    expect(attributeServerRequest).not.toHaveBeenCalled();
    expect(Sentry.captureRequestError).not.toHaveBeenCalled();
  });

  it("attributes the acting customer before reporting an unhandled request error", () => {
    const error = new Error("invoice query failed");

    onRequestError(error, request, context);

    expect(attributeServerRequest).toHaveBeenCalledWith(request);
    expect(Sentry.captureRequestError).toHaveBeenCalledWith(error, request, context);
  });

  it("still reports the original error when attribution throws", () => {
    vi.mocked(attributeServerRequest).mockImplementation(() => {
      throw new Error("cookie header is malformed");
    });
    const error = new Error("invoice query failed");

    onRequestError(error, request, context);

    expect(Sentry.captureRequestError).toHaveBeenCalledWith(error, request, context);
  });

  it("reports a non-object rejection", () => {
    onRequestError("upstream failed", request, context);

    expect(attributeServerRequest).toHaveBeenCalledWith(request);
    expect(Sentry.captureRequestError).toHaveBeenCalledWith("upstream failed", request, context);
  });

  it("loads only the Node server SDK when NEXT_RUNTIME is nodejs", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    vi.resetModules();
    const runtime = await import("@/instrumentation");

    await runtime.register();

    expect(runtimeLoads.server).toHaveBeenCalledTimes(1);
    expect(runtimeLoads.edge).not.toHaveBeenCalled();
  });

  it("loads only the edge SDK when NEXT_RUNTIME is edge", async () => {
    process.env.NEXT_RUNTIME = "edge";
    vi.resetModules();
    const runtime = await import("@/instrumentation");

    await runtime.register();

    expect(runtimeLoads.edge).toHaveBeenCalledTimes(1);
    expect(runtimeLoads.server).not.toHaveBeenCalled();
  });

  it("does not load a Sentry config for any other runtime", async () => {
    process.env.NEXT_RUNTIME = "browser";
    vi.resetModules();
    const runtime = await import("@/instrumentation");

    await runtime.register();

    expect(runtimeLoads.server).not.toHaveBeenCalled();
    expect(runtimeLoads.edge).not.toHaveBeenCalled();
  });
});
