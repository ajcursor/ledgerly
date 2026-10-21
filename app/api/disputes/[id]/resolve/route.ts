import { NextResponse } from "next/server";
import { ClosedDisputeResolveError } from "@/lib/demo/error-scenarios";
import {
  DisputeAlreadyResolvedError,
  DisputeNotFoundError,
  resolveDispute,
} from "@/lib/disputes/resolve";

/**
 * Accept or decline a dispute.
 * Body: { action: "accept" | "decline", reviewerNote?: string }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: { action?: string; reviewerNote?: string } = {};
  try {
    body = (await request.json()) as { action?: string; reviewerNote?: string };
  } catch {
    body = {};
  }

  if (body.action !== "accept" && body.action !== "decline") {
    return NextResponse.json(
      { error: "action must be accept or decline" },
      { status: 400 },
    );
  }

  try {
    const result = await resolveDispute({
      disputeId: id,
      action: body.action,
      reviewerNote: body.reviewerNote,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof DisputeAlreadyResolvedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof DisputeNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ClosedDisputeResolveError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const message = error instanceof Error ? error.message : "Resolve failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
