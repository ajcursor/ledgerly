import { describe, expect, it } from "vitest";
import { postDisputeResolution } from "@/components/disputes/resolution-panel";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("dispute resolution request", () => {
  it("posts the action and note to the encoded resolve path", async () => {
    let url = "";
    let init: RequestInit | undefined;
    const result = await postDisputeResolution(
      "dsp/1043",
      "decline",
      "  Charge stands.  ",
      async (input, requestInit) => {
        url = String(input);
        init = requestInit;
        return jsonResponse(200, { ok: true });
      },
    );

    expect(result).toEqual({ ok: true });
    expect(url).toBe("/api/disputes/dsp%2F1043/resolve");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "content-type": "application/json" });
    expect(JSON.parse(String(init?.body))).toEqual({
      action: "decline",
      reviewerNote: "  Charge stands.  ",
    });
  });

  it("surfaces the API error and a fallback when the response is unusable", async () => {
    const conflict = await postDisputeResolution("dsp_1043", "accept", "Again.", async () =>
      jsonResponse(409, { error: "Dispute dsp_1043 is already ACCEPTED." }),
    );
    expect(conflict).toEqual({
      ok: false,
      error: "Dispute dsp_1043 is already ACCEPTED.",
    });

    const empty = await postDisputeResolution("dsp_1043", "accept", "", async () =>
      jsonResponse(500, {}),
    );
    expect(empty).toEqual({ ok: false, error: "Resolve failed." });

    const notJson = await postDisputeResolution("dsp_1043", "accept", "", async () => {
      return {
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("not json");
        },
      } as Response;
    });
    expect(notJson).toEqual({ ok: false, error: "Resolve failed." });

    const offline = await postDisputeResolution("dsp_1043", "decline", "", async () => {
      throw new Error("offline");
    });
    expect(offline).toEqual({ ok: false, error: "Resolve failed." });
  });
});
