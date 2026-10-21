import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { FilterPills } from "@/components/filter-pills";
import { PageHeader } from "@/components/page-header";
import { DisputeStatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getDisputes } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { planLabel } from "@/lib/plans";

export const metadata = {
  title: "Disputes",
};

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "NEEDS_REVIEW", label: "Needs review" },
  { id: "OPEN", label: "Open" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "DECLINED", label: "Declined" },
];

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "ALL";
  const disputes = await getDisputes({ status });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Exceptions"
        title="Dispute queue"
        description="Credit suggestions must stay inside the catalog. Accept posts that credit once."
      />

      <FilterPills pathname="/disputes" value={status} items={FILTERS} />

      {disputes.length === 0 ? (
        <EmptyState
          title="Nothing in this queue"
          body="Accepted and declined rows live on other filters. The brass scale stays empty until a new exception is seeded."
          imageSrc="/images/empty-disputes.svg"
          imageAlt="Empty dispute scale illustration"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {disputes.map((dispute) => (
            <Link key={dispute.id} href={`/disputes/${dispute.id}`}>
              <Card className="h-full transition-colors hover:bg-accent/40">
                <CardContent className="space-y-3 pt-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{dispute.invoice.customer.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {dispute.invoice.number} · {dispute.id}
                      </p>
                    </div>
                    <DisputeStatusBadge status={dispute.status} />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{dispute.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {planLabel(dispute.invoice.plan)} · opened {formatDate(dispute.openedOn)} ·{" "}
                    {formatUsd(dispute.disputedAmountCents)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
