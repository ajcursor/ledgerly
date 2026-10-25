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

const PAGES = [
  {
    href: "/",
    label: "Dashboard",
    description: "Balances, collected revenue, and the open dispute mix for this window.",
  },
  {
    href: "/invoices",
    label: "Invoices",
    description: "The seeded invoice book, with status filters and search.",
  },
  {
    href: "/collections",
    label: "Collections",
    description: "Overdue invoices and the dunning notes that sit with them.",
  },
  {
    href: "/disputes",
    label: "Disputes",
    description: "Claims against invoices, and a suggested credit that stays inside the catalog.",
  },
] as const;

/** Noon UTC. Format in UTC so the calendar day does not shift with the host zone. */
const demoClockLabel = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(DEMO_AS_OF);

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Fieldnote"
        title="About"
        description="What this app is for, and what the numbers on the other pages mean."
      />

      <Card>
        <CardHeader>
          <CardTitle>What Ledgerly is</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Ledgerly is a fictional billing app for {DEMO_OPERATOR.workspace}, used for B2B collections
            demos.
          </p>
          <p>The operator is {DEMO_OPERATOR.name}.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Synthetic data and the demo clock</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>All data is synthetic: no real companies, customers, or emails.</p>
          <p>The demo clock is frozen on {demoClockLabel}.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan catalogue</CardTitle>
          <CardDescription>Three prices. There is no fourth tier.</CardDescription>
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
          <CardDescription>Where the main screens lead.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4">
            {PAGES.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className="text-sm font-medium text-indigo hover:underline">
                  {page.label}
                </Link>
                <p className="text-sm leading-relaxed text-muted-foreground">{page.description}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
