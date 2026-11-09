import { describe, expect, it } from "vitest";
import { GET as getDisputeRoute } from "@/app/api/disputes/[id]/route";
import { GET as getDisputesRoute } from "@/app/api/disputes/route";
import { GET as getInvoiceRoute } from "@/app/api/invoices/[id]/route";
import { GET as getInvoicesRoute } from "@/app/api/invoices/route";
import {
  getDispute,
  getDisputes,
  getInvoice,
  getInvoices,
  getOpenDisputeCount,
  getOpenDisputeNotices,
  getWorkspace,
  isDisputeStatus,
  isInvoiceStatus,
} from "@/lib/data";

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("invoice and dispute queries", () => {
  it("filters invoices by status and a trimmed case-insensitive query", async () => {
    const overdue = await getInvoices({ status: "OVERDUE" });
    const all = await getInvoices({ status: "ALL" });
    const searched = await getInvoices({ status: "OVERDUE", q: "  inv-1043 " });

    expect(overdue.length).toBeGreaterThan(0);
    expect(overdue.every((invoice) => invoice.status === "OVERDUE")).toBe(true);
    expect(overdue.map((invoice) => invoice.id)).toContain("inv_1043");
    expect(overdue.map((invoice) => invoice.id)).not.toContain("inv_1042");
    expect(all.length).toBeGreaterThan(overdue.length);
    expect(all.map((invoice) => invoice.id)).toContain("inv_1048");
    expect(searched.map((invoice) => invoice.id)).toEqual(["inv_1043"]);
    expect(await getInvoices({ q: "not-a-customer" })).toEqual([]);
    expect(await getInvoices({ status: "NOT_A_STATUS" })).toEqual([]);
    expect(isInvoiceStatus("OVERDUE")).toBe(true);
    expect(isInvoiceStatus("NEEDS_REVIEW")).toBe(false);
  });

  it("filters disputes by status and returns the full book for ALL", async () => {
    const needsReview = await getDisputes({ status: "NEEDS_REVIEW" });
    const open = await getDisputes({ status: "OPEN" });
    const all = await getDisputes({ status: "ALL" });
    const unfiltered = await getDisputes();

    expect(needsReview.every((dispute) => dispute.status === "NEEDS_REVIEW")).toBe(true);
    expect(needsReview.map((dispute) => dispute.id)).toContain("dsp_1049");
    expect(needsReview.map((dispute) => dispute.id)).not.toContain("dsp_1050");
    expect(open.map((dispute) => dispute.id)).toEqual(expect.arrayContaining(["dsp_1047", "dsp_1041"]));
    expect(open.map((dispute) => dispute.id)).not.toContain("dsp_1049");
    expect(all.map((dispute) => dispute.id).sort()).toEqual(unfiltered.map((dispute) => dispute.id).sort());
    expect(all.map((dispute) => dispute.id)).toContain("dsp_1050");
    expect(isDisputeStatus("DECLINED")).toBe(true);
    expect(isDisputeStatus("PAID")).toBe(false);
  });

  it("returns no row for an unknown invoice or dispute id", async () => {
    expect(await getInvoice("inv_missing")).toBeNull();
    expect(await getDispute("dsp_missing")).toBeNull();

    const invoice = await getInvoice("inv_1043");
    expect(invoice?.number).toBe("INV-1043");
    expect(invoice?.customer.name).toBe("Cobalt Goods");
    expect(invoice?.plan).toBe("SCALE");
  });

  it("lists the newest open dispute notices for the shell", async () => {
    const count = await getOpenDisputeCount();
    const notices = await getOpenDisputeNotices();

    expect(notices[0]).toEqual({
      id: "dsp_1041",
      customerName: "Acme North",
      invoiceNumber: "INV-1041",
      status: "OPEN",
    });
    expect(notices.map((notice) => notice.id)).toContain("dsp_1049");
    expect(notices.map((notice) => notice.id)).not.toContain("dsp_1050");
    expect(notices.every((notice) => notice.status === "OPEN" || notice.status === "NEEDS_REVIEW")).toBe(
      true,
    );
    expect([3, 4]).toContain(notices.length);
    expect([3, 4]).toContain(count);
  });

  it("loads the Fieldnote workspace", async () => {
    await expect(getWorkspace()).resolves.toMatchObject({
      id: "ws_fieldnote",
      name: "Fieldnote Workspace",
      slug: "fieldnote",
    });
  });

  it("applies the same filters over HTTP and returns 404 when the id is missing", async () => {
    const unfilteredInvoices = await getInvoicesRoute(new Request("http://localhost/api/invoices"));
    expect(unfilteredInvoices.status).toBe(200);
    const unfilteredInvoiceBody = (await unfilteredInvoices.json()) as { invoices: { id: string }[] };
    expect(unfilteredInvoiceBody.invoices.map((invoice) => invoice.id)).toEqual(
      expect.arrayContaining(["inv_1042", "inv_1043", "inv_1048"]),
    );

    const invoices = await getInvoicesRoute(
      new Request("http://localhost/api/invoices?status=OVERDUE&q=%20inv-1043%20"),
    );
    expect(invoices.status).toBe(200);
    await expect(invoices.json()).resolves.toMatchObject({
      invoices: [{ id: "inv_1043", number: "INV-1043", status: "OVERDUE" }],
    });

    const missingInvoice = await getInvoiceRoute(new Request("http://localhost/api/invoices/inv_missing"), params("inv_missing"));
    expect(missingInvoice.status).toBe(404);
    await expect(missingInvoice.json()).resolves.toEqual({ error: "Invoice not found" });

    const foundInvoice = await getInvoiceRoute(new Request("http://localhost/api/invoices/inv_1042"), params("inv_1042"));
    expect(foundInvoice.status).toBe(200);
    await expect(foundInvoice.json()).resolves.toMatchObject({
      invoice: { id: "inv_1042", number: "INV-1042", status: "PAID" },
    });

    const unfilteredDisputes = await getDisputesRoute(new Request("http://localhost/api/disputes"));
    expect(unfilteredDisputes.status).toBe(200);
    const unfilteredDisputeBody = (await unfilteredDisputes.json()) as { disputes: { id: string }[] };
    expect(unfilteredDisputeBody.disputes.map((dispute) => dispute.id)).toEqual(
      expect.arrayContaining(["dsp_1049", "dsp_1050"]),
    );

    const disputes = await getDisputesRoute(new Request("http://localhost/api/disputes?status=ACCEPTED"));
    expect(disputes.status).toBe(200);
    const disputeBody = (await disputes.json()) as { disputes: { id: string; status: string }[] };
    expect(disputeBody.disputes.map((dispute) => dispute.id)).toEqual(["dsp_1050"]);

    const missingDispute = await getDisputeRoute(new Request("http://localhost/api/disputes/dsp_missing"), params("dsp_missing"));
    expect(missingDispute.status).toBe(404);
    await expect(missingDispute.json()).resolves.toEqual({ error: "Dispute not found" });

    const foundDispute = await getDisputeRoute(new Request("http://localhost/api/disputes/dsp_1049"), params("dsp_1049"));
    expect(foundDispute.status).toBe(200);
    await expect(foundDispute.json()).resolves.toMatchObject({
      dispute: { id: "dsp_1049", status: "NEEDS_REVIEW" },
    });
  });
});
