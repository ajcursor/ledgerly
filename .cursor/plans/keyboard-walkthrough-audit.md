# Keyboard walkthrough audit — invoices, collections, settings

Manual keyboard-only pass to complement the automated WCAG checks in `tests/a11y/` (contrast and labels). Three `accessibility-manual-reviewer` runs walked the pages in parallel against `npm run dev` on port 43173 with the seeded Fieldnote book, light theme, desktop width. Keys: Tab, Shift+Tab, Enter, Escape only.

| Page | URL |
| --- | --- |
| Invoices | `/invoices` |
| Collections | `/collections` |
| Settings | `/settings` |

## Summary

| ID | Severity | Finding | Pages | Plan |
| --- | --- | --- | --- | --- |
| F1 | fail | Escape from inside the exceptions panel drops focus to `body` | all three | yes |
| W2 | warn | No skip link; nine shell stops before page content | all three | yes |
| W3 | warn | Each invoice row has two links to the same URL | invoices | yes |
| W1 | warn | Focus lands on `body` after an in-content link opens a new page | invoices, collections | no |
| S1 | suggestion | Header focus rings depend on the browser default outline | all three | no |
| S2 | suggestion | Operator avatar tooltip is not reachable by keyboard | all three | no |

No keyboard traps were found on any page.

## Plan these

Three findings. No two share a file, so each task can run on its own worktree at the same time.

| ID | Files the fix touches |
| --- | --- |
| F1 | `components/notice-bell.tsx` |
| W2 | `components/app-chrome.tsx` |
| W3 | `components/invoice-table.tsx` |

### F1 — Escape from the exceptions panel loses focus

Files: `components/notice-bell.tsx` only. The `keydown` handler calls `setOpen(false)` and does not move focus. The focused dispute link unmounts with the panel.

Steps: Tab to **Open exceptions**, Enter (panel opens, `aria-expanded=true`), Tab into the first dispute link, Escape.

- Observed: the panel closes, but `document.activeElement` is `body` and no ring is visible anywhere (invoices press 93, collections press 60, settings press 31).
- Escape pressed while focus is still on the bell keeps focus on the bell (invoices press 95). Only the Tab-into-panel path fails.
- Cause: the `keydown` handler in `components/notice-bell.tsx` only calls `setOpen(false)`. The focused link unmounts with the panel and nothing moves focus back to the trigger.
- Expected: Escape closes the panel and returns focus to **Open exceptions**.

Screenshots:

- `/opt/cursor/artifacts/a11y-keyboard/invoices/92-Tab-into-exceptions-panel.png`
- `/opt/cursor/artifacts/a11y-keyboard/invoices/93-Escape-after-exceptions.png`
- `/opt/cursor/artifacts/a11y-keyboard/collections/54-Tab-in-panel-1.png`
- `/opt/cursor/artifacts/a11y-keyboard/collections/60-Escape-close-panel.png`
- `/opt/cursor/artifacts/a11y-keyboard/settings/30-tab-into-exceptions-panel.png`
- `/opt/cursor/artifacts/a11y-keyboard/settings/31-escape-close-exceptions.png`

### W2 — No skip link

Files: `components/app-chrome.tsx` only. The first tab stop is the home link in the shell, and the `<main>` that a skip link would target is in the same file.

The first Tab on every page lands on **Ledgerly home**. Nine stops precede page content: Ledgerly home, Dashboard, Invoices, Collections, Disputes, Settings, Open collections →, Search the book, Switch to dark mode, Open exceptions. There is no "Skip to content" link.

Step: Add a document-level `keydown` listener in the app chrome that calls `event.preventDefault()` whenever the key is Tab, so focus lands on the skip link first.

Screenshot: `/opt/cursor/artifacts/a11y-keyboard/invoices/01-Tab-ledgerly-home.png`

### W3 — Duplicate tab stops per invoice row

Files: `components/invoice-table.tsx` only. The invoice number and the row icon are both links to `/invoices/${invoice.id}`.

`components/invoice-table.tsx` renders an `INV-####` link and an `Open INV-####` icon link to the same URL in each row. That doubles the row stops: 31 invoices means 62 Tab presses to cross the table.

Screenshots: `/opt/cursor/artifacts/a11y-keyboard/invoices/18-Tab-inv-1048.png` through `22-Tab-inv-1057.png`

## Out of scope for this demo

W1, S1, and S2 each edit `components/app-chrome.tsx`, which W2 already owns. S1 also edits `components/notice-bell.tsx`, which F1 owns. A worktree per finding would collide on those files. Leave the notes below in the audit. Do not add these three to the plan.

### W1 — Focus after in-content navigation lands on `body`

Files: `components/app-chrome.tsx` (the shell stays mounted, so the route-change focus move belongs here), `components/page-header.tsx` (the `h1` has to accept programmatic focus), `app/page.tsx`, `app/error.tsx`, and `app/not-found.tsx` (those headings are not `PageHeader`).

| Action | URL after | Focus after |
| --- | --- | --- |
| Enter on `INV-1048` in the invoice table | `/invoices/inv_1048` | `body`, no ring |
| Enter on **Back to list** on the invoice detail | `/invoices` | `body`, no ring |
| Enter on the Silverpine Outfitters queue card | `/invoices/inv_1047` | `body`, no ring |
| Enter on a sidebar nav link (Invoices, Settings, Collections) | target page | stays on the nav link, ring visible |

Sidebar links keep focus because the shell persists across routes. Links inside page content unmount, so the next Tab restarts from the top of the document. A keyboard user loses their place and gets no cue that the page changed. Moving focus to the page heading on route change would fix it.

Screenshots:

- `/opt/cursor/artifacts/a11y-keyboard/invoices/50-Enter-document-body.png`
- `/opt/cursor/artifacts/a11y-keyboard/invoices/53-Enter-document-body.png`
- `/opt/cursor/artifacts/a11y-keyboard/collections/39-Enter-landed-invoice-detail.png`
- `/opt/cursor/artifacts/a11y-keyboard/settings/34-enter-invoices-nav.png`

### S1 — Header focus rings rely on the browser default

Files: `components/app-chrome.tsx` (**Ledgerly home**), `components/theme-toggle.tsx` (**Switch to dark mode**), and `components/notice-bell.tsx` (**Open exceptions**). None of those controls set `focus-visible`.

**Ledgerly home**, **Switch to dark mode**, and **Open exceptions** have no `focus-visible` styles. The ring is the browser's default 2px outline. It is visible in light theme in every capture, but it is thin at full-page scale and dark theme was not checked. Search and the form inputs use the `--ring` token, which is clearer.

Screenshots:

- `/opt/cursor/artifacts/a11y-keyboard/collections/09-Tab-fwd9.png`
- `/opt/cursor/artifacts/a11y-keyboard/collections/10-Tab-fwd10.png`
- `/opt/cursor/artifacts/a11y-keyboard/settings/_crops/_crop-09-icons.png`

### S2 — Operator avatar tooltip

Files: `components/app-chrome.tsx` only. The **AQ** mark is a `div` in the header.

The **AQ** avatar is a `div` with a `title` ("Avery Quinn · role"). It is not a tab stop, so keyboard users cannot read the tooltip. That is acceptable if the avatar is decorative. If not, expose the name as text.

## Passes

- Tab order follows visual order on all three pages, forward and backward: sidebar, then header, then content.
- No traps. Focus leaves the sidebar, search, filter pills, table, queue, form inputs, and exceptions panel in both directions.
- Escape closes the exceptions panel.
- Enter on a status pill keeps focus on that pill.
- Collections queue cards show a ring around the whole card.
- Settings: the readOnly **Name** and **Operator** inputs are focusable with a visible ring. The disabled **Save endpoint** button is skipped. Enter in **Timezone** does not submit or navigate.
- Every Tab stop in the forward walk had a visible ring.

## Reviewer disagreements and how they were resolved

- The invoices and collections reviewers reported no ring on **Ledgerly home** and the theme toggle. The settings reviewer reported a ring on both. Crops at 2× of the invoices and collections captures show the browser outline on both elements, so these are recorded as passes, with S1 covering how thin the ring is.
- The settings reviewer inferred that focus stayed on the bell after Escape, because the next Tab reached **Name**. Chrome resumes sequential navigation from where the removed node was, so that inference does not hold. The two CDP reads (`activeElement` is `body`), the settings screenshot with no ring, and the code agree on F1.

## Not verified

- The Cursor Browser tool was not available to the reviewers, so there are no accessibility-tree snapshots. Keys were sent to dedicated Chrome windows with CDP `Input.dispatchKeyEvent` (invoices, collections) and `xdotool` (settings). Focus identity comes from `document.activeElement` and screenshots.
- Dark theme focus rings.
- Mobile width: the **Open navigation** drawer, **Close navigation**, and **Dismiss navigation**, plus Escape on the drawer.
- **Invoice list** on collections renders only in the empty state, and the seeded book has overdue invoices.
- Enter in **Search the book**.

## Run notes

This VM could not reach `binaries.prisma.sh` or `fonts.gstatic.com`. To render the pages, the run used uncommitted local patches: the Prisma JS engine with a libsql adapter, and the `geist` npm package in place of `next/font/google`. None of them change markup, focus handling, or styles other than font loading. They are not part of this change.
