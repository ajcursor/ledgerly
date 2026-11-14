import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DisputeStatusBadge, InvoiceStatusBadge } from "@/components/status-badge";

function markup(element: ReactElement) {
  return renderToStaticMarkup(element);
}

describe("invoice status badge", () => {
  it("shows Disputed for an open dispute and the catalog status otherwise", () => {
    const disputed = markup(createElement(InvoiceStatusBadge, { status: "DISPUTED" }));
    expect(disputed).toContain("Disputed");
    expect(disputed).toContain("text-danger");
    expect(disputed).not.toContain("DISPUTED");

    const paid = markup(createElement(InvoiceStatusBadge, { status: "PAID" }));
    expect(paid).toContain("Paid");
    expect(paid).toContain("text-success");

    const overdue = markup(createElement(InvoiceStatusBadge, { status: "OVERDUE" }));
    expect(overdue).toContain("Overdue");
    expect(overdue).toContain("text-danger");

    const open = markup(createElement(InvoiceStatusBadge, { status: "OPEN" }));
    expect(open).toContain("Open");
    expect(open).toContain("text-warning");

    const voided = markup(createElement(InvoiceStatusBadge, { status: "VOID" }));
    expect(voided).toContain("Void");
    expect(voided).toContain("text-muted-foreground");

    const draft = markup(createElement(InvoiceStatusBadge, { status: "DRAFT" }));
    expect(draft).toContain("Draft");
    expect(draft).toContain("text-secondary-foreground");

    const unknown = markup(createElement(InvoiceStatusBadge, { status: "HOLD" }));
    expect(unknown).toContain("HOLD");
    expect(unknown).toContain("text-secondary-foreground");
  });
});

describe("dispute status badge", () => {
  it("reserves danger for needs review and success for an accepted dispute", () => {
    const review = markup(createElement(DisputeStatusBadge, { status: "NEEDS_REVIEW" }));
    expect(review).toContain("Needs review");
    expect(review).toContain("text-danger");

    const accepted = markup(createElement(DisputeStatusBadge, { status: "ACCEPTED" }));
    expect(accepted).toContain("Accepted");
    expect(accepted).toContain("text-success");

    const declined = markup(createElement(DisputeStatusBadge, { status: "DECLINED" }));
    expect(declined).toContain("Declined");
    expect(declined).toContain("text-muted-foreground");

    const open = markup(createElement(DisputeStatusBadge, { status: "OPEN" }));
    expect(open).toContain("Open");
    expect(open).toContain("text-warning");
  });
});
