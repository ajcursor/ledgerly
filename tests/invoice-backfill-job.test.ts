import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const START = new Date("2026-08-23T12:00:00.000Z");

describe("invoice backfill job", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves from idle to running to complete and restarts on a new POST", async () => {
    const { GET, POST } = await import("@/app/api/demo/job/route");

    const idle = await GET();
    expect(idle.status).toBe(200);
    await expect(idle.json()).resolves.toEqual({
      id: "job_invoice_backfill",
      status: "idle",
      startedAt: null,
      completesAt: null,
      elapsedMs: 0,
      remainingMs: 45_000,
    });

    const started = await POST();
    expect(started.status).toBe(201);
    await expect(started.json()).resolves.toMatchObject({
      id: "job_invoice_backfill",
      status: "running",
      startedAt: "2026-08-23T12:00:00.000Z",
      completesAt: "2026-08-23T12:00:45.000Z",
      elapsedMs: 0,
      remainingMs: 45_000,
    });

    vi.setSystemTime(new Date("2026-08-23T12:00:20.000Z"));
    await expect(GET().then((response) => response.json())).resolves.toMatchObject({
      status: "running",
      elapsedMs: 20_000,
      remainingMs: 25_000,
    });

    vi.setSystemTime(new Date("2026-08-23T12:02:00.000Z"));
    await expect(GET().then((response) => response.json())).resolves.toMatchObject({
      status: "complete",
      elapsedMs: 45_000,
      remainingMs: 0,
    });

    vi.setSystemTime(new Date("2026-08-23T13:00:00.000Z"));
    const restarted = await POST();
    expect(restarted.status).toBe(201);
    await expect(restarted.json()).resolves.toMatchObject({
      status: "running",
      startedAt: "2026-08-23T13:00:00.000Z",
      completesAt: "2026-08-23T13:00:45.000Z",
      elapsedMs: 0,
      remainingMs: 45_000,
    });
  });
});
