# FIND CS development checkpoint

## Scope and decisions (2026-09-22)

Only the `Preview` branch is authorized for deployment. Production is untouched.
The initial delivery uses existing React/Vite and Supabase Auth/Postgres/Data API.
No paid provider, background crawler, external AI call, or automatic telephone/chat
verification is enabled. No real customer account data is needed.

The admin task manager is an internal maintenance queue (todo/in_progress/blocked/done),
not a background execution engine. The initial workflow is intentionally manual:
create draft catalog entries, create maintenance tasks, record actual verification
evidence, then explicitly publish. Automatic research provider selection and live
execution require a separate source/API contract; they are not simulated.

## Implemented

- `#/admin`: password login, admin membership check, tasks, catalog editor,
  verification recording and read-only audit history.
- SQL migration: constraints, admin RLS, published-only public RPC,
  audit triggers, derived routing/verification state.
- `VITE_CATALOG_MODE=live`: public frontend reads the RPC, not the TS fixtures.
  A database failure shows an error and retry, never an unannounced mock fallback.
- `VITE_CATALOG_MODE=demo` (default): existing prototype content, explicitly labeled.
- Data validation and regression checks run before the Vite application build.
- Only publishable/anon keys may appear in frontend environment variables.

## Required human setup / integration gate

### Hosted checkpoint (2026-09-22)

- Created `find-cs-preview`, ref `nbvvzdinsmmqhwoasrla`, Singapore,
  after explicit US$0/month approval. Production unchanged.
- Applied initial schema and explicit-grant hardening migration. All eight tables
  have RLS. Hosted rollback SQL suite and local PGlite suite passed.
- Hosted default ACLs exposed a gap in the original local harness. The harness now
  reproduces permissive role defaults and runs every migration in order.
- No mock catalog/evidence imported. SQL fixtures roll back. No admin provisioned.
- Remaining security advisor warnings describe intentional public catalog RPC and
  authenticated membership-check RPC; both have fixed search paths and narrow
  return values. Membership table intentionally has no client policy.
  See https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
  and https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
  and https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy .
- Vercel connection returned an empty team list; Preview env setup is blocked on
  access to the existing find-cs team/project. No environment values changed.
- Real Auth/browser end-to-end verification remains blocked; browser smoke tests
  have not run successfully (missing Chromium), not a passing acceptance result.

### Current checkpoint (2026-09-28; supersedes the integration blockers above)

- Vercel access now works for team `team_Qb6Y2sKOpG9bby5FRMZwrFKj`, project
  `prj_COXhdhQblIrHcIM2xZPhihWeryVR`. The user configured Preview environment
  values and redeployed commit `012271e`; deployment reached READY.
- The user-selected Supabase account is an admin; database membership/RPC checks
  passed. No passwords or privileged keys were collected.
- Cloud browser reached the FIND CS admin login screen through the connected
  Vercel plugin's temporary preview access. Public Supabase configuration passes
  frontend initialization and demo mode is visible. Actual app account login and
  UI-to-API writes have NOT passed acceptance. Keep `VITE_CATALOG_MODE=demo` for now.
- Admin lists now paginate 50 records at a time with exact counts, deterministic
  ordering, stale-response suppression, retry, and recovery after last-page deletion.
  The overdue notice reports the current page only. Offset pagination is a live
  view, not a snapshot; concurrent inserts can move records between pages.
- Added observation timestamps in Hong Kong time. Database rejects future
  observations, date/time disagreement, and observations predating revised route
  content (including changes on the same day). Publication toggles preserve the
  server-owned revision start. Initial revision date-only imports remain supported.
- `verification_observation_time` migration is applied to preview. Local and hosted
  rollback SQL suites passed; no test rows remain. The database had zero routes,
  tasks, and verification records before this migration.
- Existing observations in other environments need review before this migration:
  it does not manufacture missing timestamps or retroactively validate old evidence.
- Security advisor still flags intentional SECURITY DEFINER RPCs and the sealed
  membership table, as documented above. It also reports leaked-password checking
  disabled. Supabase documents that feature as Pro-only; no paid plan was enabled.
  This is not a claim that credentials are safe: use a unique strong admin password,
  retain Vercel deployment authentication, and assess MFA before Production.
  Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

1. Install and authorize the Supabase and Vercel connections for this project.
2. Select/create an isolated FIND CS development Supabase project; do not point this
   initial migration at a populated or production database.
3. Apply the reviewed migration and run SQL permission/constraint tests.
4. Create the administrator account and bootstrap membership using `docs/database.md`.
   Passwords and privileged keys must not be pasted into chat or committed.
5. Configure only Vercel **Preview** env values from `.env.example`.
6. Test real login, allowed admin writes, denied anonymous/non-admin writes,
   draft privacy, publication, content-change invalidation and audit history.
7. Set `VITE_CATALOG_MODE=live` only after those checks pass, then redeploy Preview.

Do not import the five prototype verification entries as evidence of real tests.
The existing 56 contact routes are mock data, not a verified contact database.

## Risk register / release gates

| Risk | Control/status | Gate |
| --- | --- | --- |
| Full integration not exercised | Hosted SQL/RLS tests passed; cloud browser reaches admin form with valid frontend configuration, account authentication pending | Block live release until end-to-end staging tests pass |
| Demo contact content inaccurate | Persistent demo banner; no automatic import or publishing | Actual sources/tests required before public live catalog |
| External API/provider scope unspecified | No paid or unattended calls; task queue is manual | Define provider contract and authorize access before execution |
| No scheduled maintenance worker | Due dates/overdue display support manual checks | Add scheduler only after required cadence/limits established |
| Database recovery not exercised | Immutable client audit and versioned migrations; audit is not a backup | Export/restore drill before Production |
| No production penetration/security assessment | RLS allow/deny tests and code review | No claim of zero vulnerabilities; high-risk findings block release |
| Concurrent maintenance | updated_at conflict detection for mutable records where supported | Multi-user workflow needs full concurrency acceptance tests |

The remaining work is an integration/permission gate, not a claim that the entire
product is finished. Vercel success alone proves neither database authorization nor
real-world correctness of contact details.

## Resume

Read this document, `docs/database.md`, package scripts, migration and tests.
Check the current Preview HEAD before changing anything. Run `npm ci` then
`npm run build`; run database and browser tests documented in their scripts.
Do not expand privileges, incur charges, or deploy Production implicitly.

## Build gate update (2026-09-29)

- Every standard build now also runs pagination regression and isolated database migration/RLS tests. These use no hosted credentials and create no hosted records.
- Pinned the React test renderer to 18.3.1 and excluded generated pagination bundles from version control.
- Real authenticated browser acceptance remains pending; local passing tests do not replace that gate.

## Authentication resilience (2026-09-29)

- Session restoration remains in a loading state until resolved. New auth events invalidate old session snapshots and permission responses, preventing stale results after logout/account switching.
- Auth RPC checks leave the synchronous auth callback before running. Errors fail closed; explicit retry restores service without requiring logout. Login exceptions release the busy button.
- `test:auth` is part of every build and covers stale snapshots, logout, account changes, denied permissions, transport/session failures, retry and listener cleanup using injected responses.
- Full build (typecheck/lint/data/auth/pagination/database/Vite) passed locally. These simulated auth tests are not real hosted login or browser write acceptance.

## Admin navigation and access review (2026-09-29)

- User screenshot confirms the authenticated dashboard is visible; task write/refresh acceptance is still pending.
- Fixed tab CSS specificity: generic button styling no longer overrides the transparent tab background, keeping the selected green label readable.
- Removed the admin link from the public footer. Administrators use the bookmarked `/#/admin` URL. Hiding navigation is not an authorization control.
- Read-only hosted review confirmed RLS on all eight public tables, admin-only policies, no anonymous task INSERT/route UPDATE privileges, and no authenticated INSERT privilege on admin_members. Local permission-denial tests remain in every build.

## Agent preparation checkpoint (2026-10-01)

- Hosted read confirmed the user-created acceptance task is done and has an UPDATE audit record. Login/task create/update are now exercised through the user's real browser; full catalog verification/publication flow remains pending.
- Added admin Agent verification tab for transient, read-only plans using actual route snapshots. No job is queued or executed, no evidence is fabricated, and no route is published.
- Added versioned Browser/Voice contracts and result validation, plus rejection-case tests in build. Read docs/agents.md for remaining server/provider requirements and limitations.
- API integration, execution worker, signed callbacks and external Browser/Voice verification remain unimplemented and are release blockers for automated operation.

## Durable Agent preparation checkpoint (2026-10-01)

- Added `agent_jobs`: admin-only create/read/cancel, immutable server-built snapshots,
  duplicate prevention and audit history. The Agent tab now persists and paginates
  records rather than displaying only a transient plan.
- States are limited to blocked_provider/cancelled. No executable queue state,
  background execution, provider callbacks, new evidence or automatic publication.
- Local build and rollback tests pass, including anonymous/non-admin denial,
  client snapshot-edit denial, cancellation audit and duplicate rejection.
- Applied agent_jobs migration to isolated preview; both hosted rollback suites
  passed and no test jobs/routes/audits remain. Security advisor reports only the
  previously documented RPC/membership/Auth findings, no new queue findings.
  Authenticated browser acceptance of the new queue UI is still pending;
  previous login/task acceptance does not cover this new feature.
- Future execution must recheck route revisions, implement leases/callback security,
  official-target controls, cost limits and evidence review. These remain blockers
  before enabling any external Agent operation.

## Agent preflight checkpoint (2026-10-02, Hong Kong)

- Added an admin-only read-only RPC and UI check button to distinguish stale route
  plans, cancelled jobs, unavailable records and blocked provider connections.
  Every response has runnable=false; no external execution is enabled.
- Fixed result timestamp equality across Z/UTC/offset formats with microsecond
  comparison, including sub-millisecond stale/future observation rejection.
- Full local build passed; 37 Agent rejection cases and all SQL suites passed.
  Applied agent_job_preflight to isolated preview and passed hosted rollback tests.
  No preflight fixtures remain; anonymous EXECUTE is false. Security advisor findings
  are unchanged from the prior documented RPC/membership/Auth findings.
- Diagnostic output is a point-in-time snapshot, not a worker lease or authorization.
  Actual provider integration/atomic claims/callbacks/evidence acceptance remain
  blockers. New authenticated UI acceptance remains pending.

## Admin browser regression checkpoint (2026-10-05, Hong Kong)

- Ran actual Chromium against local Vite with mocked Supabase responses. Setup,
  failed login, non-admin denial (no private-data request), task creation/error,
  Agent save/duplicate rejection, snapshot display, all four preflight states,
  invalid ready responses, RPC/list failures and retry, failed/conflicting/successful
  cancellation, conditional PATCH filters and mobile overflow checks passed.
- Split the admin route from the public header/footer layout. The maintenance
  dashboard uses its own header; the public sticky home navigation is absent there.
  Public home navigation still renders and has no admin footer link.
- Added test:admin:required so a missing browser fails the acceptance command.
  Optional test:admin continues to report SKIP when Chromium is absent; SKIP is never
  a passing browser acceptance. Fixed the old task test's form-reset race and added
  mocked Content-Range exposure to match browser API behavior.
- Full build and existing contract/auth/pagination/database suites passed. No new
  application dependencies, hosted data writes, providers or charges.
- These are browser-to-mocked-API regressions, not authenticated hosted API writes
  or real provider acceptance. The temporary test browser lacks CJK fonts; text
  content/interaction assertions passed, but Chinese typography is not visually
  accepted from its screenshots. Hosted queue UI/provider release gates remain.

## Provider connection checkpoint (2026-10-05, Hong Kong)

- Added /api/agent-connections as a Vercel Node function. It validates the caller
  with Supabase Auth and is_admin before making fixed-host metadata requests to
  Browserbase and Retell. Responses disclose only connection state, never keys or
  upstream account data; all responses are private/no-store.
- The Agent panel now offers an explicit connection check. No sessions/calls/jobs
  are executed. executionEnabled remains false and the durable queue stays blocked.
- Provider regression tests are included in every build: denied/expired auth,
  missing configuration, provider errors, malformed responses, secret redaction
  and HTTP/cache boundaries. Chromium mocked API checks cover the panel's success,
  invalid execution response and denied permission.
- Real provider credentials are absent from Preview. Read docs/provider-setup.md
  for account-owner steps. API connectivity and real provider execution have not
  passed acceptance. Browserbase Free is the initial browser candidate; Retell
  managed international telephony does not list Hong Kong, requiring separately
  verified custom telephony for the voice path. No paid service is enabled.
- This supersedes earlier statements that all provider API integration is absent:
  read-only credential diagnostics now exist. Worker leases, callbacks, official
  target controls, costs and evidence acceptance remain execution blockers.
