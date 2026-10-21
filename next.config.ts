import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
};

const authToken = process.env.SENTRY_AUTH_TOKEN?.trim();

export default withSentryConfig(nextConfig, {
  authToken,
  silent: !process.env.CI,
  widenClientFileUpload: Boolean(authToken),
  tunnelRoute: "/sentry-tunnel",
  telemetry: false,
  sourcemaps: {
    disable: !authToken,
  },
});
