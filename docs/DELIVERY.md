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
| Full integration not exercised | Hosted SQL/RLS tests passed; real Auth/browser workflow still pending | Block live release until end-to-end staging tests pass |
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
