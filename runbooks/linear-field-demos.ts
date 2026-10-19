/** Ledgerly Linear board. Titles stay stable across per-operator setup. */

export const LINEAR_FIELD_DEMOS_PROJECT = {
  name: "ce-field-demos",
  summary:
    "Personal Ledgerly board: three scoped Fieldnote issues plus the Collections Command Center slices.",
  workspace: "Fieldnote Workspace",
  operator: "Avery Quinn",
  catalogPricesUsd: ["$49", "$99", "$249"] as const,
  ledgerlyUrl: "http://127.0.0.1:43173",
} as const;

export type FieldDemoIssueType = "Story" | "Bug";
export type FieldDemoIssueStatus = "Todo" | "In Progress";
export type FieldDemoPriority = 2 | 3;

export type FieldDemoIssue = {
  slug: "email-on-invoice" | "suggested-credit-v1" | "filter-pills";
  type: FieldDemoIssueType;
  state: FieldDemoIssueStatus;
  /** Linear: 2=High, 3=Medium */
  priority: FieldDemoPriority;
  title: string;
  /** Prior titles still on a board; restage updates those issues in place. */
  previousTitles?: readonly string[];
  description: string;
  ledgerlyPaths: readonly string[];
  ledgerlyUrls: readonly string[];
};

export const FIELD_DEMO_ISSUES: readonly FieldDemoIssue[] = [
  {
    slug: "suggested-credit-v1",
    type: "Bug",
    state: "In Progress",
    priority: 2,
    title: "Suggested credit on dsp_1043 shows $400 instead of the $249 Scale cap",
    previousTitles: ["Dispute dsp_1043 claims $400 against a $249 Scale invoice"],
    description: `## Bug

Open http://127.0.0.1:43173/disputes/dsp_1043. The Resolution card shows **Suggested credit $400.00**. INV-1043 is Scale at **$249**. Expected suggested credit is **$249.00**.

The $400 figure is Cobalt Goods' claim, not a fourth catalog price. Do not change the stored claim. The page still calls deprecated suggested-credit v1, which returns the raw claim. v2, the domain helper, and the seed already cap at $249.

## Acceptance

- Client selects /api/v2/disputes/*/suggested-credit.
- dsp_1043 still stores a $400 claim against INV-1043 (Scale $249).
- v1 and v2 routes remain; tests/suggested-credit-api.test.ts is not edited to force green.

## Paths

- \`lib/disputes/suggested-credit-api.ts\`
- \`app/disputes/[id]/page.tsx\`
- \`app/api/v1/disputes/[id]/suggested-credit/route.ts\`
- \`app/api/v2/disputes/[id]/suggested-credit/route.ts\`

## Verify

- http://127.0.0.1:43173/disputes/dsp_1043 — suggested credit reads $249.00
- Claim on the dispute stays $400. Scale stays $249.`,
    ledgerlyPaths: [
      "lib/disputes/suggested-credit-api.ts",
      "app/disputes/[id]/page.tsx",
      "app/api/v1/disputes/[id]/suggested-credit/route.ts",
      "app/api/v2/disputes/[id]/suggested-credit/route.ts",
    ],
    ledgerlyUrls: ["http://127.0.0.1:43173/disputes/dsp_1043"],
  },
  {
    slug: "filter-pills",
    type: "Bug",
    state: "Todo",
    priority: 2,
    title: "Clicking Overdue or Needs review does not filter the queue",
    previousTitles: ["Overdue / Needs review filter does not change the list"],
    description: `## Bug

On http://127.0.0.1:43173/invoices, click **Overdue**. The table still shows every invoice and **All** stays highlighted.

On http://127.0.0.1:43173/disputes, click **Needs review**. The queue still shows every dispute and **All** stays highlighted.

Same control on both pages. Fix filter selection so the active pill matches the rows. Do not split this into two issues.

## Acceptance

- On /invoices, Overdue shows only OVERDUE rows and only that pill is active.
- On /disputes, Needs review shows only NEEDS_REVIEW rows and only that pill is active.
- All still lists the full seeded book.

## Paths

- \`components/filter-pills.tsx\`
- \`app/invoices/page.tsx\`
- \`app/disputes/page.tsx\`

## Verify

- http://127.0.0.1:43173/invoices
- http://127.0.0.1:43173/disputes`,
    ledgerlyPaths: ["components/filter-pills.tsx", "app/invoices/page.tsx", "app/disputes/page.tsx"],
    ledgerlyUrls: ["http://127.0.0.1:43173/invoices", "http://127.0.0.1:43173/disputes"],
  },
  {
    slug: "email-on-invoice",
    type: "Story",
    state: "Todo",
    priority: 3,
    title: "Invoice detail has no control to change customer email",
    previousTitles: ["Change customer email on invoice detail"],
    description: `## Story

Open an invoice from http://127.0.0.1:43173/invoices. The customer card shows the seeded contact email with no way for Avery Quinn to change it. Add a control on that card. Do not add email-format validation.

Invoice amounts stay on the catalog: Starter $49, Growth $99, Scale $249. Customer names and .example addresses stay on the Fieldnote book.

## Acceptance

- Invoice detail customer card can change the seeded contact email.
- No email-format validation is added.
- Customer names and .example addresses stay on the Fieldnote book.

## Paths

- \`app/invoices/[id]/page.tsx\`

## Verify

- http://127.0.0.1:43173/invoices — pick any invoice, edit email on the customer card

Matches the 101 Plan beat. Keep the change on the invoice detail customer card.`,
    ledgerlyPaths: ["app/invoices/[id]/page.tsx"],
    ledgerlyUrls: ["http://127.0.0.1:43173/invoices"],
  },
] as const;

export const FIELD_DEMO_SUGGESTED_CREDIT_TITLE = FIELD_DEMO_ISSUES.find(
  (issue) => issue.slug === "suggested-credit-v1",
)!.title;

export const FIELD_DEMO_FILTER_TITLE = FIELD_DEMO_ISSUES.find(
  (issue) => issue.slug === "filter-pills",
)!.title;

/**
 * Collections Command Center slices.
 * stage-linear stages these on the same ce-field-demos project, after the three
 * Fieldnote issues, tagged with COLLECTIONS_COMMAND_CENTER_LINEAR. They must not
 * join FIELD_DEMO_ISSUES: the 101/201 beats still name only those three titles.
 */
export type CollectionsCommandCenterPattern = "Operations" | "Business rules";

export const COLLECTIONS_COMMAND_CENTER_LINEAR = {
  feature: "Collections Command Center",
  /** Team-scoped label on the confirmed team. Never a workspace label. */
  label: "Collections Command Center",
  /** First line of every slice description, so the tag survives a label strip. */
  note: "> **Collections Command Center feature.** This issue is one slice of the Collections Command Center (prds/prd-01-collections-command-center.md). It is not one of the three Fieldnote demo issues.",
  state: "Todo",
  /** Linear: 3=Medium */
  priority: 3,
} as const;

export type CollectionsCommandCenterIssue = {
  slug:
    | "overdue-book"
    | "full-payment"
    | "reject-other-amount"
    | "collection-note"
    | "note-edit-window"
    | "nudge-sent"
    | "nudge-failed"
    | "collections-kpi"
    | "amount-mask";
  title: string;
  why: string;
  pattern: CollectionsCommandCenterPattern;
  acceptance: readonly string[];
  constraints: string;
  notInThisIssue: string;
  covers: readonly string[];
  ledgerlyPaths: readonly string[];
  ledgerlyUrls: readonly string[];
};

export const COLLECTIONS_COMMAND_CENTER_ISSUES: readonly CollectionsCommandCenterIssue[] = [
  {
    slug: "overdue-book",
    title: "Customers account shows its overdue book",
    why: "A rep can open an account and see what is owed without leaving Customers.",
    pattern: "Operations",
    acceptance: [
      "Given a seeded account with at least one OVERDUE invoice, When Avery Quinn opens Customers and selects that account, Then the Overdue Book lists only that account’s OVERDUE invoices, days past due descending, with invoice number, invoice date, due date, days past due, outstanding balance via formatUsd, and an em dash when the account has no activity.",
      "Given one of those rows, When Avery selects it, Then the existing invoice page opens and shows its line items.",
      "Given an account with no OVERDUE invoices, When Avery opens that account, Then the Overdue Book has no invoice rows.",
    ],
    constraints:
      "Customer is the account. Add Customers to the nav. /customers lists seeded accounts with name, plan, overdue invoice count, and overdue balance. /customers/[id] is Account Detail. Days past due are daysBetween(DEMO_AS_OF, dueOn) for OVERDUE invoices (demo clock 23 Aug 2026). Outstanding balance is invoice.totalCents until a later slice records payments. Seeded plans show formatUsd. Leave app/collections/page.tsx as the cross-account queue. Do not add CollectionNote, Activity, or Payment, and do not add sample rows.",
    notInThisIssue:
      "Payment history, recording a payment, notes, Nudge, the dashboard card, and masking amounts for a non-catalog plan id.",
    covers: ["FR-1", "FR-2", "FR-3", "FR-4"],
    ledgerlyPaths: [
      "components/app-chrome.tsx",
      "app/customers/page.tsx",
      "app/customers/[id]/page.tsx",
    ],
    ledgerlyUrls: ["http://127.0.0.1:43173/customers"],
  },
  {
    slug: "full-payment",
    title: "Recording a full payment marks the invoice paid",
    why: "A rep can record a phone payment and see the invoice settle without a second tool.",
    pattern: "Operations",
    acceptance: [
      "Given an OVERDUE invoice with an outstanding balance, When Avery confirms “Record {amount} payment against {invoice number}?” after choosing check, ach, card_on_file, or cash, Then the invoice status is PAID, paidOn is the demo date, the invoice leaves the Overdue Book, payment history lists the payment, and the account activity feed shows PAYMENT_RECORDED for that amount, method, and recorder.",
      "Given an invoice whose outstanding balance is 0, When a payment is submitted, Then the response is 400 and the status stays unchanged.",
    ],
    constraints:
      "POST /api/invoices/[id]/payments with { method }. The server records the full outstanding balance (totalCents minus recorded payments) and ignores a client-supplied amount. Methods are only check, ach, card_on_file, and cash. Success sets status PAID and paidOn to DEMO_AS_OF, writes Payment and a PAYMENT_RECORDED activity (status recorded, occurredOn DEMO_AS_OF). This slice creates the single account activity feed; later slices append to it. Commit only after the confirm step, which shows the amount. On app/invoices/[id]/page.tsx add payment history and Record payment only. Do not change the customer email card or the unfinished collection-note card (lib/collection-note.ts, the disabled Save note button). Seed deleteMany for payments and activities runs before invoices. Tests that write restore the invoice and new rows. A new passing test updates the shipped suite citations in the same change. The sole failure stays tests/suggested-credit-api.test.ts. Catalog amounts stay Starter $49, Growth $99, Scale $249.",
    notInThisIssue:
      "Rejecting a body that sends a different amountCents, partial-payment entry, notes, Nudge, the dashboard card, and amount masking.",
    covers: ["FR-12", "FR-13", "FR-15", "FR-16", "FR-17", "FR-18"],
    ledgerlyPaths: [
      "prisma/schema.prisma",
      "prisma/seed.ts",
      "app/api/invoices/[id]/payments/route.ts",
      "app/invoices/[id]/page.tsx",
      "app/customers/[id]/page.tsx",
    ],
    ledgerlyUrls: ["http://127.0.0.1:43173/invoices"],
  },
  {
    slug: "reject-other-amount",
    title: "A payment that is not the outstanding balance does not mark the invoice paid",
    why: "A mismatched amount must not settle an invoice the customer has not paid in full.",
    pattern: "Business rules",
    acceptance: [
      "Given the record-payment form, When Avery opens the confirm step, Then the only amount offered is the full outstanding balance.",
      "Given an OVERDUE invoice, When a client posts amountCents other than that outstanding balance, Then the response is 400, nothing is stored, and the status stays OVERDUE.",
    ],
    constraints:
      "Same payments route as the full-payment slice. The form never collects a second amount. Tests that write restore the invoice. Update the shipped suite citations if this adds a passing test. The sole failure stays tests/suggested-credit-api.test.ts.",
    notInThisIssue: "Partial payments, installments, and a new payment method.",
    covers: ["FR-14"],
    ledgerlyPaths: ["app/api/invoices/[id]/payments/route.ts", "app/invoices/[id]/page.tsx"],
    ledgerlyUrls: ["http://127.0.0.1:43173/invoices"],
  },
  {
    slug: "collection-note",
    title: "Account detail saves a collection note",
    why: "A promise-to-pay or dispute note stays on the account instead of in a side channel.",
    pattern: "Operations",
    acceptance: [
      "Given Account Detail, When Avery saves a non-blank note, Then that note is first in the account activity feed, attributed to Avery Quinn, with a timestamp, and a NOTE_ADDED activity is stored.",
      "Given a blank body, When Avery saves, Then the response is 400 and the feed is unchanged.",
      "Given a note body and an invoice id, When Avery saves, Then the note is tied to that invoice.",
    ],
    constraints:
      "POST /api/customers/[id]/notes with { body, invoiceId? }. Persist CollectionNote (customerId, invoiceId nullable, authorName, body, createdAt, updatedAt) and a NOTE_ADDED activity on the same account feed. Author is Avery Quinn (DEMO_OPERATOR). Newest createdAt first. Seed deleteMany notes before invoices. Do not finish the invoice-page stub in lib/collection-note.ts or enable its Save note button. Tests that write restore the new rows. Update the shipped suite citations if this adds a passing test. The sole failure stays tests/suggested-credit-api.test.ts.",
    notInThisIssue: "The 15-minute edit window, delete, Nudge, and payments.",
    covers: ["FR-5", "FR-6"],
    ledgerlyPaths: [
      "prisma/schema.prisma",
      "prisma/seed.ts",
      "app/api/customers/[id]/notes/route.ts",
      "app/customers/[id]/page.tsx",
    ],
    ledgerlyUrls: ["http://127.0.0.1:43173/customers"],
  },
  {
    slug: "note-edit-window",
    title: "Avery can edit a collection note for 15 minutes",
    why: "A rep can fix a note just written, and the audit trail still keeps it.",
    pattern: "Business rules",
    acceptance: [
      "Given a note Avery Quinn created less than 15 minutes ago, When Avery changes the body, Then the new body is saved.",
      "Given a note older than 15 minutes, or an author other than Avery Quinn, When the body is patched, Then the response is 403 and the body stays.",
      "Given a saved note, When Avery views the account, Then there is no delete control.",
    ],
    constraints:
      "PATCH /api/notes/[id] updates body only. The window is createdAt, not occurredOn. No delete route. The 15 minutes stand in for the PRD’s unspecified edit window.",
    notInThisIssue: "Deleting notes, editing someone else’s note inside the window, and a longer retention policy.",
    covers: ["FR-7"],
    ledgerlyPaths: ["app/api/notes/[id]/route.ts", "app/customers/[id]/page.tsx"],
    ledgerlyUrls: ["http://127.0.0.1:43173/customers"],
  },
  {
    slug: "nudge-sent",
    title: "Sending a Nudge logs it on the account",
    why: "A reminder is tied to the invoice and shows up in the account history.",
    pattern: "Operations",
    acceptance: [
      "Given an OVERDUE invoice and a customer email on file, When Avery sends a Nudge for that invoice, Then the feed shows NUDGE_SENT with status sent, channel email, sender Avery Quinn, and the fixed template names the invoice number, outstanding balance, and due date.",
      "Given an account with overdue invoices, When Avery uses the account Nudge, Then the nudge is for the most-past-due overdue invoice.",
      "Given an account with no overdue invoices, When Avery views the account, Then the Nudge control is disabled.",
    ],
    constraints:
      "POST /api/invoices/[id]/nudge. No custom body. Email only, to the on-file address. Per-invoice send starts from the overdue row on Account Detail. Append to the existing activity feed. Do not add the control to the invoice-page collection-note card. Update the shipped suite citations if this adds a passing test. The sole failure stays tests/suggested-credit-api.test.ts.",
    notInThisIssue: "Failed sends, SMS or voice, custom copy, and dunning cadences.",
    covers: ["FR-8", "FR-9", "FR-10"],
    ledgerlyPaths: [
      "app/api/invoices/[id]/nudge/route.ts",
      "app/customers/[id]/page.tsx",
    ],
    ledgerlyUrls: ["http://127.0.0.1:43173/customers"],
  },
  {
    slug: "nudge-failed",
    title: "A Nudge that cannot be emailed shows as failed",
    why: "A bad address stays visible on the account instead of looking like a sent reminder.",
    pattern: "Business rules",
    acceptance: [
      "Given a customer whose email is missing or not an email address, When Avery sends a Nudge, Then the feed shows NUDGE_SENT with status failed and the UI shows that failure.",
    ],
    constraints:
      "Same nudge route. Write the activity. Do not throw the request away and do not add a bounce provider. SMS stays out.",
    notInThisIssue: "Retry, alternate channels, and editing the template.",
    covers: ["FR-11"],
    ledgerlyPaths: [
      "app/api/invoices/[id]/nudge/route.ts",
      "app/customers/[id]/page.tsx",
    ],
    ledgerlyUrls: ["http://127.0.0.1:43173/customers"],
  },
  {
    slug: "collections-kpi",
    title: "Dashboard shows collections totals on the next load",
    why: "A rep can see overdue exposure and how much of the book was worked today.",
    pattern: "Operations",
    acceptance: [
      "Given the dashboard, When Avery opens it, Then one collections card shows the overdue balance across accounts via formatUsd, the overdue invoice count, the count of activities whose occurredOn is the demo day, and the count of activities in the 7 days ending that day.",
      "Given a note, nudge, or payment recorded in this session, When Avery loads the dashboard again, Then the card includes that change.",
    ],
    constraints:
      "One card on app/page.tsx through the existing kpi-card tokens (bg-indigo-soft, text-indigo, and the existing danger tone for overdue). Do not restyle the other KPI cards, add a hex color, or make the card configurable. Aggregates come from lib/dashboard.ts through getDashboard() in lib/data.ts. occurredOn is DEMO_AS_OF. Overdue total uses catalog cents only. Update on the next dashboard load. Update the shipped suite citations if this adds a passing test. The sole failure stays tests/suggested-credit-api.test.ts.",
    notInThisIssue: "Live updates, a second collections card, and masking the overdue total.",
    covers: ["FR-19", "FR-20", "FR-21"],
    ledgerlyPaths: [
      "app/page.tsx",
      "components/kpi-card.tsx",
      "lib/dashboard.ts",
      "lib/data.ts",
    ],
    ledgerlyUrls: ["http://127.0.0.1:43173/"],
  },
  {
    slug: "amount-mask",
    title: "Dollar amounts stay masked outside Starter, Growth, and Scale",
    why: "Amount displays stay on the paid catalog, and the rest of the collections flow still works.",
    pattern: "Business rules",
    acceptance: [
      "Given a plan id other than Starter, Growth, or Scale, When Avery opens the customers list, the Overdue Book, payment history, the activity feed, or the collections card, Then each dollar figure says “Upgrade to view amounts” and the invoice rows, notes, Nudge, status, and activity log still render.",
      "Given that same plan id, When Avery opens the payment confirmation, Then the amount being recorded is visible.",
      "Given a seeded Starter, Growth, or Scale account, When Avery opens those surfaces, Then dollar figures use formatUsd.",
    ],
    constraints:
      "amountsVisible lives next to the plan catalog and is true only for STARTER, GROWTH, and SCALE. Do not add Free, Trial, or Enterprise. Every seeded account stays on the catalog; a unit test passes a non-catalog id. The payment confirm is the data-entry exception. Recording a payment still stores the amount so PAID is correct. Update the shipped suite citations if this adds a passing test. The sole failure stays tests/suggested-credit-api.test.ts.",
    notInThisIssue: "Hiding the overdue list, notes, Nudge, or activity log on a non-catalog id, and a new price.",
    covers: ["FR-22", "FR-23", "FR-24"],
    ledgerlyPaths: [
      "lib/plans.ts",
      "app/customers/page.tsx",
      "app/customers/[id]/page.tsx",
      "app/invoices/[id]/page.tsx",
      "app/page.tsx",
    ],
    ledgerlyUrls: [
      "http://127.0.0.1:43173/customers",
      "http://127.0.0.1:43173/",
    ],
  },
] as const;

/** Linear description for one slice. Note first, then the split-prd fields. */
export function collectionsCommandCenterDescription(issue: CollectionsCommandCenterIssue): string {
  const index = COLLECTIONS_COMMAND_CENTER_ISSUES.findIndex((candidate) => candidate.slug === issue.slug);
  const position = `Slice ${index + 1} of ${COLLECTIONS_COMMAND_CENTER_ISSUES.length}`;
  // Non-breaking hyphen: Linear treats "FR-1" as an issue key on the FR team.
  const covers = issue.covers.map((id) => id.replaceAll("-", "\u2011")).join(", ");
  const bullets = (items: readonly string[]) => items.map((item) => `- ${item}`).join("\n");
  return [
    COLLECTIONS_COMMAND_CENTER_LINEAR.note,
    `${position} · ${issue.pattern} · Covers ${covers}`,
    "## Story",
    issue.why,
    "## Acceptance",
    bullets(issue.acceptance),
    "## Constraints",
    issue.constraints,
    "## Not in this issue",
    issue.notInThisIssue,
    "## Paths",
    bullets(issue.ledgerlyPaths.map((path) => `\`${path}\``)),
    "## Verify",
    bullets(issue.ledgerlyUrls),
  ].join("\n\n");
}

/**
 * WCAG audit already on a ce-field-demos board.
 * stage-linear updates this issue in place. It is not a Fieldnote beat and not
 * a Collections Command Center slice, and a clean board does not gain a copy.
 */
export const WCAG_KEYBOARD_WALKTHROUGH = {
  title: "UI changes need a WCAG 2.2 AA accessibility audit",
  state: "Todo",
  /** Linear: 3=Medium */
  priority: 3,
  description: `## Story

This issue is a manual keyboard walkthrough. That is the WCAG 2.2 Level AA audit. A static review of markup or tokens does not complete it.

Walk http://127.0.0.1:43173/invoices with the keyboard only: Tab, Shift+Tab, Enter, and Escape. The dev server is on port 43173. Cover the invoices page, the components it renders, the shared shell, and the tokens in \`app/globals.css\` in both themes. After each key, record tab order, whether focus is visible, whether focus can leave every region, whether Escape closes an open panel, and where focus lands after Enter.

A walkthrough of that page found serious failures in the shared shell, so they show on every page:

- No skip link to main content.
- Filter pills, nav links, and invoice row links have no visible focus.
- The notice bell menu opens on click and cannot be operated from the keyboard.
- Status badge text fails 4.5:1: light-theme Open and Paid, and dark-theme Overdue and Disputed.

## Acceptance

The manual keyboard walkthrough can show each of these. Reading the source without walking the page does not pass:

- The shell has a skip link to main content, and Tab reaches it.
- Links and filter pills show a visible focus ring.
- The notice bell menu opens from the keyboard, and focus returns to the bell on close.
- Status badge text meets 4.5:1 in light and dark themes, using existing tokens in \`app/globals.css\`.
- Filter pills and the active nav item expose their selected state during the walkthrough.
- Invoice table headers set \`scope="col"\`.
- The off-screen mobile sidebar is not in the tab order.
- Filter and search changes announce the result count.

## Paths

- \`components/app-chrome.tsx\`
- \`components/notice-bell.tsx\`
- \`components/filter-pills.tsx\`
- \`components/invoice-table.tsx\`
- \`components/ui/badge.tsx\`
- \`components/status-badge.tsx\`
- \`app/globals.css\`
- \`app/invoices/page.tsx\`

## Verify

- http://127.0.0.1:43173/invoices — manual keyboard walkthrough: skip link, focus rings, notice menu, and badge text in both themes.`,
} as const;
