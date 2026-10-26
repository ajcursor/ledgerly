import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_AS_OF } from "@/lib/clock";
import { DEMO_OPERATOR } from "@/lib/demo-session";
import { formatUsd } from "@/lib/money";
import { PLAN_IDS, PLAN_LABEL, PLAN_PRICE_CENTS } from "@/lib/plans";

export const metadata = {
  title: "About",
};

const DEMO_DATE = DEMO_AS_OF.toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const PAGE_GUIDE = [
  { href: "/", label: "Dashboard", description: "Revenue, open invoices, disputes and collections for the last 30 days." },
  { href: "/invoices", label: "Invoices", description: "Every invoice in the book, filterable by status and customer." },
  { href: "/collections", label: "Collections", description: "Overdue invoices queued for follow-up, with dunning notes." },
  { href: "/disputes", label: "Disputes", description: "Customer claims against invoices, with the suggested credit." },
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Workspace"
        title="About"
        description="What Ledgerly is, and what the numbers on each page mean."
      />

      <Card>
        <CardHeader>
          <CardTitle>What Ledgerly is</CardTitle>
          <CardDescription>A billing ops tool built for demos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p>
            Ledgerly is a fictional B2B billing and collections app for {DEMO_OPERATOR.workspace}. It tracks
            invoices, chases overdue balances and settles disputes.
          </p>
          <p>
            The operator is {DEMO_OPERATOR.name} ({DEMO_OPERATOR.role}). There is no sign-in behind the app.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Synthetic data and the demo clock</CardTitle>
          <CardDescription>Nothing here belongs to a real business.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p>All data is synthetic. Companies, customers and email addresses are invented for the demo.</p>
          <p>
            The demo clock is frozen on {DEMO_DATE}. Invoice ages and due dates count from that day, not from
            today.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan catalog</CardTitle>
          <CardDescription>Three monthly plans. Every invoice bills one of them.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {PLAN_IDS.map((plan) => (
            <div key={plan} className="rounded-md border border-border bg-background/70 px-3 py-3">
              <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{PLAN_LABEL[plan]}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{formatUsd(PLAN_PRICE_CENTS[plan])}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page guide</CardTitle>
          <CardDescription>Where to look for each part of the book.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {PAGE_GUIDE.map((page) => (
              <li key={page.href} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <Link href={page.href} className="w-28 shrink-0 font-medium text-indigo hover:underline">
                  {page.label}
                </Link>
                <span className="text-muted-foreground">{page.description}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
