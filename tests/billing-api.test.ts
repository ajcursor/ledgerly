import { describe, expect, it } from "vitest";
import { GET as getDispute } from "@/app/api/disputes/[id]/route";
import { GET as getDisputes } from "@/app/api/disputes/route";
import { GET as getInvoice } from "@/app/api/invoices/[id]/route";
import { GET as getInvoices } from "@/app/api/invoices/route";

function request(path: string) {
  return new Request(`http://localhost${path}`);
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("billing API", () => {
  it("filters invoices through the status and q query parameters", async () => {
    const overdue = await getInvoices(request("/api/invoices?status=OVERDUE"));
    const overdueBody = (await overdue.json()) as {
      invoices: { id: string; status: string }[];
    };
    const search = await getInvoices(request("/api/invoices?q=INV-1043"));
    const searchBody = (await search.json()) as { invoices: { id: string; number: string }[] };
    const all = await getInvoices(request("/api/invoices"));
    const allBody = (await all.json()) as { invoices: { id: string }[] };

    expect(overdue.status).toBe(200);
    expect(overdueBody.invoices.length).toBeGreaterThan(0);
    expect(overdueBody.invoices.every((invoice) => invoice.status === "OVERDUE")).toBe(true);
    expect(overdueBody.invoices.some((invoice) => invoice.id === "inv_1043")).toBe(true);
    expect(overdueBody.invoices.length).toBeLessThan(allBody.invoices.length);
    expect(searchBody.invoices.map((invoice) => invoice.number)).toEqual(["INV-1043"]);
  });

  it("returns an invoice by id and 404 when the id is missing", async () => {
    const found = await getInvoice(request("/api/invoices/inv_1043"), params("inv_1043"));
    const body = (await found.json()) as { invoice: { id: string; number: string; customer: { name: string } } };
    const missing = await getInvoice(request("/api/invoices/inv_missing"), params("inv_missing"));

    expect(found.status).toBe(200);
    expect(body.invoice).toMatchObject({
      id: "inv_1043",
      number: "INV-1043",
      customer: { name: "Cobalt Goods" },
    });
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toEqual({ error: "Invoice not found" });
  });

  it("filters disputes through the status query and returns 404 when the id is missing", async () => {
    const needsReview = await getDisputes(request("/api/disputes?status=NEEDS_REVIEW"));
    const body = (await needsReview.json()) as { disputes: { id: string; status: string }[] };
    const found = await getDispute(request("/api/disputes/dsp_1049"), params("dsp_1049"));
    const foundBody = (await found.json()) as {
      dispute: { id: string; invoice: { number: string } };
    };
    const missing = await getDispute(request("/api/disputes/dsp_missing"), params("dsp_missing"));

    expect(needsReview.status).toBe(200);
    expect(body.disputes.length).toBeGreaterThan(0);
    expect(body.disputes.every((dispute) => dispute.status === "NEEDS_REVIEW")).toBe(true);
    expect(body.disputes.some((dispute) => dispute.id === "dsp_1049")).toBe(true);
    expect(body.disputes.some((dispute) => dispute.id === "dsp_1050")).toBe(false);
    expect(found.status).toBe(200);
    expect(foundBody.dispute).toMatchObject({ id: "dsp_1049", invoice: { number: "INV-1049" } });
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toEqual({ error: "Dispute not found" });
  });
});
