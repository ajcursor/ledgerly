import { describe, expect, it } from "vitest";
import { disputeStatusLabel, invoiceStatusLabel } from "@/lib/status";

describe("billing status labels", () => {
  it("labels each invoice status and leaves an unknown value unchanged", () => {
    expect(invoiceStatusLabel("DRAFT")).toBe("Draft");
    expect(invoiceStatusLabel("OPEN")).toBe("Open");
    expect(invoiceStatusLabel("PAID")).toBe("Paid");
    expect(invoiceStatusLabel("OVERDUE")).toBe("Overdue");
    expect(invoiceStatusLabel("VOID")).toBe("Void");
    expect(invoiceStatusLabel("PAST_DUE")).toBe("PAST_DUE");
  });

  it("labels each dispute status and leaves an unknown value unchanged", () => {
    expect(disputeStatusLabel("OPEN")).toBe("Open");
    expect(disputeStatusLabel("NEEDS_REVIEW")).toBe("Needs review");
    expect(disputeStatusLabel("ACCEPTED")).toBe("Accepted");
    expect(disputeStatusLabel("DECLINED")).toBe("Declined");
    expect(disputeStatusLabel("CLOSED")).toBe("CLOSED");
  });
});
