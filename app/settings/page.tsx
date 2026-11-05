import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUsd } from "@/lib/money";
import { getOperatorProfile } from "@/lib/operator-profile";
import { PLAN_IDS, PLAN_LABEL, PLAN_PRICE_CENTS } from "@/lib/plans";
import { getWorkspace } from "@/lib/data";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const [workspace, operator] = await Promise.all([getWorkspace(), getOperatorProfile()]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Fieldnote is fiction. Keep the catalog honest and the names invented."
      />

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Signed-in shell only — there is no auth provider behind this screen.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Name</Label>
            <Input id="workspace-name" defaultValue={workspace.name} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="operator">Operator</Label>
            <Input id="operator" defaultValue={`${operator.displayName} · ${operator.role}`} readOnly />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="timezone">Timezone</Label>
            {/* TODO(cmd-k): replace this helper with a one-line explanation of why the demo clock is frozen on 23 Aug 2026. */}
            <Input id="timezone" defaultValue="UTC — demo clock is frozen" />
            <p className="text-xs text-muted-foreground">
              Workspace timezone — pick a region. The sentence above is unfinished on purpose.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan catalog</CardTitle>
          <CardDescription>These three prices are the product. There is no fourth tier.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {PLAN_IDS.map((plan) => (
            <div key={plan} className="rounded-md border border-border bg-background/70 px-3 py-3">
              <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{PLAN_LABEL[plan]}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{formatUsd(PLAN_PRICE_CENTS[plan])}</p>
              <p className="mt-1 text-xs text-muted-foreground">Monthly · tax $0.00</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outbound webhook</CardTitle>
          <CardDescription>
            {/* TODO(tab): validate https before enable. Reject anything that is not https://. */}
            Paste an https endpoint. Validation is a Tab-completion seam in this file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="webhook">Endpoint</Label>
          <Input id="webhook" placeholder="https://" autoComplete="off" />
          <Button type="button" variant="outline" disabled>
            Save endpoint
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
