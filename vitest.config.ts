import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // WCAG checks run on their own with `npm run test:a11y`.
    exclude: [...configDefaults.exclude, "tests/a11y/**"],
    // Resolve tests write the shared SQLite file, then restore it. Queue
    // reads have to wait so they do not observe a dispute mid-resolve.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      // The two planted failures are red on a clean tree. Still write the report.
      reportOnFailure: true,
      reporter: ["text-summary", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
        "instrumentation.ts",
        "instrumentation-client.ts",
        "proxy.ts",
        "sentry.server.config.ts",
        "sentry.edge.config.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
