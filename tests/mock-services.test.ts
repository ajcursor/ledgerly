import { describe, expect, it } from "vitest";
import { GET as nudgeGet, POST as nudgePost } from "@/app/api/mock/nudge/route";
import { GET as pulseGet, POST as pulsePost } from "@/app/api/mock/pulse/route";

function post(handler: (request: Request) => Promise<Response>, body: string, json = false) {
  return handler(
    new Request("http://localhost/api/mock", {
      method: "POST",
      headers: json ? { "content-type": "application/json" } : undefined,
      body,
    }),
  );
}

describe("mock nudge", () => {
  it("reports ready", async () => {
    const response = await nudgeGet();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      service: "nudge",
      status: "ready",
    });
  });

  it("rejects a body that is not JSON and a missing ticket id", async () => {
    const malformed = await post(nudgePost, "{");
    expect(malformed.status).toBe(400);
    await expect(malformed.json()).resolves.toEqual({
      service: "nudge",
      status: "rejected",
      error: "body must be JSON",
    });

    const missing = await post(nudgePost, JSON.stringify({ ticket_id: "  " }), true);
    expect(missing.status).toBe(422);
    await expect(missing.json()).resolves.toEqual({
      service: "nudge",
      status: "rejected",
      error: "ticket_id (string) is required",
    });
  });

  it("acks the same ticket with the same request id", async () => {
    const first = await post(nudgePost, JSON.stringify({ ticket_id: "TCK-14" }), true);
    const second = await post(
      nudgePost,
      JSON.stringify({ ticket_id: "TCK-14", action: "remind" }),
      true,
    );
    const other = await post(nudgePost, JSON.stringify({ ticket_id: "TCK-15" }), true);
    const firstBody = (await first.json()) as { request_id: string; action: string; ticket_id: string };
    const secondBody = (await second.json()) as { request_id: string; action: string };
    const otherBody = (await other.json()) as { request_id: string };

    expect(first.status).toBe(200);
    expect(firstBody).toMatchObject({
      service: "nudge",
      status: "ok",
      ticket_id: "TCK-14",
      action: "recorded",
    });
    expect(firstBody.request_id).toMatch(/^REQ-N[0-9A-F]{8}$/);
    expect(secondBody.request_id).toBe(firstBody.request_id);
    expect(secondBody.action).toBe("remind");
    expect(otherBody.request_id).not.toBe(firstBody.request_id);
  });
});

describe("mock pulse", () => {
  it("reports ready", async () => {
    const response = await pulseGet();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      service: "pulse",
      status: "ready",
    });
  });

  it("rejects a body that is not JSON and a missing ticket id", async () => {
    const malformed = await post(pulsePost, "nope");
    expect(malformed.status).toBe(400);
    await expect(malformed.json()).resolves.toMatchObject({
      service: "pulse",
      status: "rejected",
      error: "body must be JSON",
    });

    const missing = await post(pulsePost, JSON.stringify({ signal: "late" }), true);
    expect(missing.status).toBe(422);
    await expect(missing.json()).resolves.toMatchObject({
      service: "pulse",
      error: "ticket_id (string) is required",
    });
  });

  it("acks the same ticket with the same request id", async () => {
    const first = await post(pulsePost, JSON.stringify({ ticket_id: "TCK-14" }), true);
    const second = await post(
      pulsePost,
      JSON.stringify({ ticket_id: "TCK-14", signal: "past-due" }),
      true,
    );
    const firstBody = (await first.json()) as { request_id: string; signal: string };
    const secondBody = (await second.json()) as { request_id: string; signal: string };

    expect(firstBody.request_id).toMatch(/^REQ-P[0-9A-F]{8}$/);
    expect(firstBody.signal).toBe("recorded");
    expect(secondBody.request_id).toBe(firstBody.request_id);
    expect(secondBody.signal).toBe("past-due");
  });
});
