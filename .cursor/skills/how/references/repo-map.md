# Ledgerly — Repo Map

Read this before exploring. Prefer code + this map over guessing from filenames.

## Stack and layout

| Layer | Path | Notes |
| --- | --- | --- |
| Routes | `app/` | Next.js 16 App Router. `/`, `/invoices`, `/invoices/[id]`, `/disputes`, `/disputes/[id]`, `/collections`, `/settings` |
| API | `app/api/` | `invoices`, `disputes` (+ `[id]/resolve` stub), `v1` and `v2` `disputes/[id]/suggested-credit`, `mock/nudge`, `mock/pulse`, `demo/*` |
| UI | `components/` | `app-shell`, `app-chrome`, `kpi-card`, `invoice-table`, `filter-pills`, `status-badge`, `viewing-as-picker`, `ui/*` |
| Domain | `lib/` | The only place pages get data and business rules |
| Schema | `prisma/schema.prisma` | SQLite, `file:./dev.db`. Status columns are strings |
| Seed | `prisma/seed.ts` | `db push`, then reload Fieldnote data from `core-customers.ts`, `extra-accounts.ts`, `demo-contacts.ts` |
| Demo bugs | `lib/demo/bugs.ts` | Switchable bug registry, mirrored in `demo/bugs.json` |
| Tests | `tests/` | Vitest. Needs the seeded `prisma/dev.db`. WCAG checks in `tests/a11y/` run separately |
| Docs | `AGENTS.md`, `README.md`, `demo-howto.md`, `prds/`, `.cursor/plans/` | Conventions, setup, presenter run-of-show, PRD, slice plans |

Dev: `npm run dev` → http://localhost:43173. No separate API, no Docker, no auth.

## Layering (hard rule)

```
app/pages  →  lib/data.ts  →  lib/prisma.ts
     ↑            ↑
 components   plans / money / clock / dates / status / dashboard
```

- **Pages and components** render. They do not import `lib/prisma`. Data comes from `lib/data.ts` (`getDashboard`, `getInvoices`, `getInvoice`, `getDisputes`, `getDispute`, `getOpenDisputeNotices`, `getWorkspace`).
- **`lib/plans.ts`** is the only price source: Starter $49, Growth $99, Scale $249. **`lib/money.ts`** `formatUsd` is the only USD formatter. Amounts are integer cents.
- **`lib/clock.ts`** is the demo clock (`DEMO_AS_OF`, 2026-08-23 UTC) plus the dashboard windows. **`lib/dates.ts`** has `formatDate`, `daysBetween`, `invoiceAgingDate`. Business dates never use `Date.now()`.
- **`lib/status.ts`** holds the invoice statuses (`DRAFT`, `OPEN`, `PAID`, `OVERDUE`, `VOID`) and dispute statuses (`OPEN`, `NEEDS_REVIEW`, `ACCEPTED`, `DECLINED`).
- **`lib/dashboard.ts`** owns KPI maths: collected, open, overdue count, dispute exposure, revenue series.
- **`lib/demo/bugs.ts`** decides which demo bugs are on. Code branches on `isDemoBugEnabled(id)`. Selection comes from `DEMO_BUGS`, `DEMO_SCENARIO`, `DEMO_BUGS_FILE`, or each bug's `defaultEnabled`.
- **`lib/utils.ts`** `cn` joins classes. Styling uses tokens from `app/globals.css` only.

### Key modules

| File | Owns |
| --- | --- |
| `lib/data.ts` | Every page-facing query |
| `lib/plans.ts` | Catalog plans and prices |
| `lib/money.ts` | `formatUsd`, `sumCents` |
| `lib/clock.ts`, `lib/dates.ts` | Demo date, windows, aging |
| `lib/dashboard.ts` | KPI and chart maths |
| `lib/invoice-lines.ts` | Invoice line totals |
| `lib/dispute-credit.ts` | Catalog cap on dispute credit |
| `lib/disputes/suggested-credit-api.ts` | Suggested-credit client; picks v1 or v2 |
| `lib/disputes/closed-credit.ts` | Credit on closed disputes |
| `lib/disputes/resolve.ts` | Dispute resolution (incomplete on purpose) |
| `lib/acting-customer.ts`, `lib/demo/viewing-as.ts` | `?as=` customer and the Viewing as menu |
| `lib/sentry*.ts`, `lib/demo/capture-bug.ts` | Sentry tags (`bug_id`, fingerprint) |

## Domain model

`Workspace` → `Customer` → `Invoice` → `InvoiceLine`, and `Dispute` against an invoice.

- A customer has a catalog plan from `lib/plans.ts`.
- Invoice amounts are cents. Overdue aging is measured from `invoiceAgingDate` to `DEMO_AS_OF`.
- A dispute has a claimed amount and a suggested credit capped at the invoice's catalog price. `dsp_1043` claims $400 against a $249 Scale invoice; v2 and the stored credit return $249, v1 returns the raw $400.

Seeded customers: the ten Fieldnote book accounts, Sam Okafor at Fernway Logistics, and the fourteen extra accounts. Viewing as addresses are in `README.md`.

## Where to start by question type

| Question about… | Start here |
| --- | --- |
| Dashboard KPIs and charts | `app/page.tsx`, `getDashboard`, `lib/dashboard.ts`, `components/kpi-card.tsx` |
| Invoice list and filters | `app/invoices/page.tsx`, `getInvoices`, `components/filter-pills.tsx`, `components/invoice-table.tsx` |
| Invoice detail and line totals | `app/invoices/[id]/page.tsx`, `getInvoice`, `lib/invoice-lines.ts` |
| Dispute list and detail | `app/disputes/`, `getDisputes`, `getDispute`, `components/disputes/` |
| Suggested credit | `lib/disputes/suggested-credit-api.ts`, `app/api/v1` and `app/api/v2`, `lib/dispute-credit.ts` |
| Collections queue and notes | `app/collections/`, `lib/collection-note.ts` |
| Acting as a customer | `lib/acting-customer.ts`, `lib/demo/viewing-as.ts`, `components/viewing-as-picker.tsx` |
| Which demo bugs are on | `lib/demo/bugs.ts`, `demo/bugs.json`, `scripts/test-coverage.ts` |
| Money display | `lib/money.ts` |
| Status labels and badges | `lib/status.ts`, `components/status-badge.tsx` |
| Seeded data | `prisma/seed.ts`, `prisma/schema.prisma` |

## Docs to skim first

1. `AGENTS.md` — commands, product constraints, the red tests, planted demo issues
2. `README.md` — setup, port, demo bugs, Viewing as addresses
3. `.cursor/rules/ledgerly.mdc` — catalog, seed names, seams

`demo-howto.md` and `runbooks/meta.ts` are presenter material. Cite them when explaining history. Do not quote them into Linear, Slack, or PR text as "this bug was planted."
