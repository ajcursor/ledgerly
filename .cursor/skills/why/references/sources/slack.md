# Slack Conversations — Ledgerly

Use Slack MCP `plugin-slack-slack`. Inspect tool schemas first (`slack_search_public_and_private`, `slack_read_thread`, etc.). Auth failures → stop and report the gap.

## What this source contains

- Discussions of Ledgerly bugs, demos, and design choices, including bug reports that started a fix
- PR and Linear links shared when work ships or is reviewed
- Questions that never made it into `AGENTS.md` or a Linear issue
- Post-merge "why did we…" threads
- DMs (usually not searchable — note as limitation)

This repo does not name a default Slack channel. Discover channels by search. Do not invent one.

## How to search it

1. **Author-bounded search.** Messages from the PR author around the merge date.
2. **Keyword search.** Feature names, symbols (`getSuggestedCredit`, `countOverdueInvoices`, `credit_v1`), user-visible copy, invoice and dispute ids (`INV-1043`, `dsp_1043`), "ledgerly".
3. **PR / Linear URL search.** `github.com/ajcursor/ledgerly`, `/pull/<number>`, `linear.app/xsi-linear/issue/AJC-`, `AJC-` keys.
4. **Error / symptom strings** from the target or linked bug ticket.
5. **Channel-scoped search** only after search shows a real channel. Don't invent channel names.
6. **Thread traversal.** Fetch the whole thread; decisions often live in replies.

## What good evidence looks like here

- A thread where tradeoffs were explicitly debated
- An incident thread describing the bug the code prevents
- A question from a reviewer and an authoritative answer from the author
- A message explaining a customer or product constraint

## Common pitfalls

- **Invented channels.** Only use channels that search finds. `#aj-ledgerly-qa` is where Ready for Review pings go; it is not a bug-report channel.
- **Channel archaeology limits.** Very old messages may be gone due to retention. If you can't find anything before a certain date, note the retention cliff.
- **Unsearched DMs.** Many decisions happen in DMs that aren't searchable. You'll miss them; that's a known limitation.
- **Speculative jokes as "decisions."** Slack is casual. Look for considered discussion.
- **Context collapse.** Always fetch threads.
- **Auth failures.** If the MCP isn't authenticated, stop. Don't make up findings. Report that Slack wasn't searchable.

## What to return

For each relevant thread:

- Channel name
- Permalink or thread ID
- Participants
- Date range of the discussion
- The key quotes (verbatim) with attribution
- Context: what thread or ticket this was part of
