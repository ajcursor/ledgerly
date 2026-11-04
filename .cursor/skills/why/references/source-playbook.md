# Source playbooks (Ledgerly)

Spawn one investigator per available evidence category. Each reads a single playbook below.

| Category | Playbook | Tool / MCP |
| --- | --- | --- |
| Source control history | [`sources/code-archaeology.md`](./sources/code-archaeology.md) | git, `gh` (`ajcursor/ledgerly`) |
| Issue / ticket tracker | [`sources/linear.md`](./sources/linear.md) | Linear (Brightdesk / Ledgerly, team AJCursor, key `AJC`) |
| Long-form documents | [`sources/docs.md`](./sources/docs.md) | `AGENTS.md`, `README.md`, `.cursor/rules/ledgerly.mdc`, `demo-howto.md`, `prds/`, `.cursor/plans/` |
| Real-time team chat | [`sources/slack.md`](./sources/slack.md) | Slack |
| Error / exception tracking | [`sources/sentry.md`](./sources/sentry.md) | Sentry |

Cross-cutting:

- [`sources/incident-postmortem.md`](./sources/incident-postmortem.md) — add when the target looks defensive.

Usually skipped in this demo (document in Sources Consulted):

- Meeting notes / Granola — not relevant for this repo
- Confluence — not relevant for this repo
- Infrastructure observability — no Datadog/Grafana/etc for this app
- Product analytics warehouse — no Databricks/warehouse MCP
