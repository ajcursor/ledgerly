import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";
import { isDemoErrorCaptured } from "@/lib/sentry-user";
import { attributeServerRequest } from "@/lib/sentry-request";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  if (isDemoErrorCaptured(error)) return;
  try {
    attributeServerRequest(request);
  } catch {
    // Still report the original failure if attribution itself throws.
  }
  Sentry.captureRequestError(error, request, context);
};
