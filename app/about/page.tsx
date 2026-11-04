import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_AS_OF } from "@/lib/clock";
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

const PAGES = [
  { name: "Dashboard", summary: "Monthly recurring revenue, open invoices, disputes, and cash collected this month." },
  { name: "Invoices", summary: "Every invoice in the book, filterable by status." },
  { name: "Collections", summary: "Overdue invoices aged against the demo clock, with dunning notes." },
  { name: "Disputes", summary: "Customer claims against invoices, each with a suggested credit capped at the catalog price." },
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Workspace"
        title="About"
        description="What Ledgerly is, and what you are looking at."
      />

      <Card>
        <CardHeader>
          <CardTitle>Ledgerly</CardTitle>
          <CardDescription>A billing ops tool for Fieldnote Workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p>Ledgerly is a fictional billing app for Fieldnote Workspace.</p>
          <p>All data in the app is synthetic. Customers, invoices, and disputes are invented.</p>
          <p>The demo clock is frozen on {DEMO_DATE}. Invoices age against that date, not today.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan catalog</CardTitle>
          <CardDescription>Three plans, billed monthly.</CardDescription>
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
          <CardTitle>Pages</CardTitle>
          <CardDescription>Where to look first.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3">
            {PAGES.map((page) => (
              <div key={page.name}>
                <dt className="text-sm font-medium">{page.name}</dt>
                <dd className="text-sm text-muted-foreground">{page.summary}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
