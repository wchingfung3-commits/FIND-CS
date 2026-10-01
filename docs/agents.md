# Agent integration contract

Current stage: planning and validation only. No provider SDK, background worker,
webhook endpoint or external contact is enabled. The maintenance task table is
still manual. The new admin Agent tab reads an RLS-protected route and renders a
transient plan; it does not enqueue or persist it, claim verification, or publish.

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
- Server-side auth/admin authorization, durable queue, leased jobs, bounded retry,
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
