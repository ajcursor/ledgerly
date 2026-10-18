import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FileText } from "lucide-react";
import { findUnlabeledInMarkup, findUnlabeledInSource } from "./wcag";

vi.mock("next/navigation", () => ({
  usePathname: () => "/invoices",
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
}));

const { AppChrome } = await import("@/components/app-chrome");
const { CopyButton } = await import("@/components/copy-button");
const { EmptyState } = await import("@/components/empty-state");
const { FilterPills } = await import("@/components/filter-pills");
const { InvoiceTable } = await import("@/components/invoice-table");
const { KpiCard } = await import("@/components/kpi-card");
const { SearchField } = await import("@/components/search-field");

const RENDERED: { name: string; element: ReactElement }[] = [
  {
    name: "AppChrome",
    element: (
      <AppChrome
        openDisputeCount={1}
        openDisputes={[
          { id: "dsp_1043", customerName: "Cobalt Goods", invoiceNumber: "INV-1043", status: "NEEDS_REVIEW" },
        ]}
      >
        {null}
      </AppChrome>
    ),
  },
  { name: "SearchField", element: <SearchField placeholder="Search invoices" status="OPEN" /> },
  { name: "CopyButton", element: <CopyButton text="npm test" /> },
  {
    name: "EmptyState",
    element: (
      <EmptyState
        title="No invoices"
        body="Nothing matches this filter."
        imageSrc="/images/empty-invoices.svg"
        imageAlt="Empty ledger"
      />
    ),
  },
  {
    name: "FilterPills",
    element: (
      <FilterPills
        pathname="/invoices"
        value="ALL"
        items={[
          { id: "ALL", label: "All" },
          { id: "OVERDUE", label: "Overdue" },
        ]}
      />
    ),
  },
  {
    name: "InvoiceTable",
    element: (
      <InvoiceTable
        invoices={[
          {
            id: "inv_1043",
            number: "INV-1043",
            plan: "SCALE",
            status: "OVERDUE",
            issuedOn: new Date("2026-07-10"),
            dueOn: new Date("2026-08-09"),
            totalCents: 24900,
            customer: { name: "Cobalt Goods" },
            disputes: [],
          },
        ]}
      />
    ),
  },
  {
    name: "KpiCard",
    element: <KpiCard label="Open invoices" value="3" hint="this month" icon={FileText} />,
  },
];

describe("WCAG 1.3.1 / 4.1.2 labels in rendered components", () => {
  it.each(RENDERED)("$name has labelled controls, named buttons and links, and image alt text", ({ element }) => {
    expect(findUnlabeledInMarkup(renderToStaticMarkup(element))).toEqual([]);
  });
});

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

describe("WCAG 1.3.1 / 3.3.2 form control labels in source", () => {
  const files = ["app", "components"].flatMap((dir) => tsxFiles(path.join(process.cwd(), dir)));

  it.each(files.map((file) => ({ file: path.relative(process.cwd(), file) })))(
    "$file labels every form control",
    ({ file }) => {
      expect(findUnlabeledInSource(readFileSync(file, "utf8"))).toEqual([]);
    },
  );
});

describe("label checkers", () => {
  it("flags unlabelled markup", () => {
    expect(
      findUnlabeledInMarkup(
        '<input type="text"/><button type="button"><svg aria-hidden="true"></svg></button><img src="/a.png"/>',
      ),
    ).toHaveLength(3);
  });

  it("accepts aria-label, label[for], hidden inputs, and visible text", () => {
    expect(
      findUnlabeledInMarkup(
        '<label for="n">Name</label><input id="n"/><input aria-label="Search"/><input type="hidden"/>' +
          '<button>Save</button><a href="/" aria-label="Home"><svg></svg></a><img alt=""/>',
      ),
    ).toEqual([]);
  });

  it("flags a source control with no label and accepts a Label htmlFor pair", () => {
    expect(findUnlabeledInSource('<Input placeholder="https://" />')).toHaveLength(1);
    expect(findUnlabeledInSource('<Label htmlFor="webhook">Endpoint</Label>\n<Input id="webhook" />')).toEqual([]);
  });
});
