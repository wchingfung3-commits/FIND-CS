# Agent integration contract

Current stage: durable preparation queue and validation only. No provider SDK,
background worker, webhook endpoint or external contact is enabled. The maintenance
task table remains manual. The admin Agent tab saves, paginates, inspects and cancels
`agent_jobs`; preparation records cannot execute, claim verification, or publish.

The server builds the immutable plan under a route row lock, using the current
revision and target. Authenticated admins may INSERT only `kind` and `route_id`,
UPDATE only `status` to cancel, and SELECT private jobs. Non-admin RLS denies access;
anonymous users have no grants. Duplicate pending route/kind/revision jobs are
prevented by a unique index. Cancelled records remain in audit/history and may be
recreated as a new job. Foreign keys prevent deleting a route with job history.

The only states are `blocked_provider` and `cancelled`. There is no ready/running/
succeeded state. The future worker must recheck route revision and revision start,
authorized official targets and limits before execution. Route edits do not mutate
stored history; cancel old plans and prepare anew. Planning checks are conservative
and do not replace DNS/redirect checks. Limits remain specifications, not running
provider controls.

`src/agents/contracts.ts` defines versioned plans and validates untrusted result
objects. Plans pin route ID, revision and revision start. Browser targets must be
HTTPS chat/WhatsApp routes; voice targets must be international tel: phone routes.
Limits are 180 seconds and one attempt. They are specification fields, not enforced
runtime controls until a server worker is implemented.

Result validation checks job/route identity, current revision, observed timestamp,
result and period enums, and non-empty evidence. Human success requires an explicit
observation indicator; that indicator alone is not proof and must be checked
against authenticated provider evidence by a reviewer. Valid results are review
candidates only. No verification insert or publication follows validation today.

## Required before provider execution

- Select a provider with documented regional/billing support and approve costs.
- Server-side worker authorization, leased jobs, bounded retry,
  idempotent provider callbacks and signed webhook verification.
- Store credentials server-side. Do not trust frontend plans/limits/approval flags.
  Rebuild plans from the database and check revision again before accepting results.
- Browser: approved official-host allowlist, DNS/IP checks on every navigation and
  redirect, private-network denial, isolated browser and transcript/screenshot storage.
  The planning URL check is not an SSRF defense for an actual network executor.
- Voice: allowed destinations, cost/time/concurrency caps, call termination and
  observed IVR evidence; stop at human/account verification/payment boundaries.
- Human/CAPTCHA/account/payment boundary handling, private evidence retention and
  redaction, manual review, then explicit publication.
- End-to-end provider tests, permission-denial tests and a duplicate callback test.

Tests: `npm run test:agents`; included in standard build. Tests are local contract
checks and do not prove any external provider integration works.

Queue tests: `npm run test:db` runs every SQL suite against all migrations. Hosted
rollback tests exercise admin creation/cancellation/audit, duplicate blocking,
immutable snapshots, invalid targets and anonymous/non-admin denial. No fixtures persist.
