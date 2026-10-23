---
name: draft-collection-email
description: Draft an on-voice customer email (dunning nudge or dispute reply) from Ledgerly seed data. Use when a demo asks for customer-facing copy — e.g. "write the overdue email for INV-1043" — so the model stays in the Fieldnote fiction and never invents a price or a real company.
---

# Draft a collection or dispute email

Write the email Avery Quinn (Billing ops, Fieldnote Workspace) would send. Ground every fact in the seed; invent nothing.

## Pull facts first

- Invoice/customer facts from `prisma/seed.ts` (or the running API: `http://127.0.0.1:43173/api/invoices/inv_1043`). Contact names and emails are in the seed. Use those addresses. The four Viewing as contacts use `@brightdesk-demo.co.uk`. Every other contact uses `.example`.
- Plan names and prices only from `lib/plans.ts`: Starter $49, Growth $99, Scale $249.
- Days overdue: compute against the frozen clock (23 Aug 2026, `lib/clock.ts`) — e.g. `inv_1043` due 9 Aug is 14 days past due.

## Voice (from .cursor/rules)

Calm, specific, short. "Invoice" and "credit", never "synergy". No exclamation marks, no discount offers, no legal threats.

## Hard rules

- Name the plan; quote the price only if it is one of the three catalog prices.
- Fictional parties only — seed customers and their seeded addresses, signed "Avery Quinn, Billing ops, Fieldnote Workspace".
- Dispute replies must not promise a credit above the plan price. Read the catalog from `lib/plans.ts`.

## Output shape

Subject line + body under 140 words + one clear ask (confirm payment date, or confirm the plan on the signed order). Offer to save it into the invoice's collection-note field (`app/invoices/[id]/page.tsx`) only if the user asks to persist it.
