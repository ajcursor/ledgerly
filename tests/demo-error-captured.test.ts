import { describe, expect, it } from "vitest";
import { isDemoErrorCaptured, markDemoErrorCaptured } from "@/lib/sentry-user";

describe("demo error capture guard", () => {
  it("ignores unmarked values until the demo path marks that error", () => {
    const error = new Error("invoice query failed");
    expect(isDemoErrorCaptured(error)).toBe(false);
    expect(isDemoErrorCaptured(null)).toBe(false);
    expect(isDemoErrorCaptured(undefined)).toBe(false);
    expect(isDemoErrorCaptured("upstream failed")).toBe(false);
    expect(isDemoErrorCaptured({ message: "invoice query failed" })).toBe(false);

    markDemoErrorCaptured(error);
    expect(isDemoErrorCaptured(error)).toBe(true);
    expect(error.message).toBe("invoice query failed");
    expect(isDemoErrorCaptured(new Error("invoice query failed"))).toBe(false);
  });
});
