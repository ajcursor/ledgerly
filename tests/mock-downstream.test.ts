import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { GET as getNudge, POST as postNudge } from "@/app/api/mock/nudge/route";
import { GET as getPulse, POST as postPulse } from "@/app/api/mock/pulse/route";

const services = [
  { name: "nudge" as const, prefix: "REQ-N", detail: "action", get: getNudge, post: postNudge },
  { name: "pulse" as const, prefix: "REQ-P", detail: "signal", get: getPulse, post: postPulse },
];

function requestId(service: "nudge" | "pulse", prefix: string, ticketId: string) {
  const digest = createHash("sha256").update(`${service}:${ticketId}`).digest("hex").slice(0, 8).toUpperCase();
  return `${prefix}${digest}`;
}

describe("mock nudge and pulse", () => {
  it.each(services)("rejects a $name body that is not JSON or has no ticket id", async (service) => {
    const ready = await service.get();
    expect(ready.status).toBe(200);
    await expect(ready.json()).resolves.toMatchObject({ service: service.name, status: "ready" });

    const notJson = await service.post(
      new Request("http://localhost/api/mock", { method: "POST", body: "not-json" }),
    );
    expect(notJson.status).toBe(400);
    await expect(notJson.json()).resolves.toMatchObject({
      service: service.name,
      status: "rejected",
      error: "body must be JSON",
    });

    for (const body of [{}, { ticket_id: "  " }, { ticket_id: 1043 }]) {
      const rejected = await service.post(
        new Request("http://localhost/api/mock", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      );
      expect(rejected.status).toBe(422);
      await expect(rejected.json()).resolves.toMatchObject({
        service: service.name,
        status: "rejected",
        error: "ticket_id (string) is required",
      });
    }
  });

  it.each(services)("acks a $name call with a stable request id", async (service) => {
    const first = await service.post(
      new Request("http://localhost/api/mock", {
        method: "POST",
        body: JSON.stringify({ ticket_id: "dsp_1049", [service.detail]: "hold" }),
      }),
    );
    const second = await service.post(
      new Request("http://localhost/api/mock", {
        method: "POST",
        body: JSON.stringify({ ticket_id: "dsp_1049" }),
      }),
    );

    expect(first.status).toBe(200);
    await expect(first.json()).resolves.toEqual({
      service: service.name,
      status: "ok",
      request_id: requestId(service.name, service.prefix, "dsp_1049"),
      ticket_id: "dsp_1049",
      [service.detail]: "hold",
      note: "Mock downstream — deterministic ack, nothing persisted.",
    });
    await expect(second.json()).resolves.toMatchObject({
      request_id: requestId(service.name, service.prefix, "dsp_1049"),
      ticket_id: "dsp_1049",
      [service.detail]: "recorded",
    });
  });
});
