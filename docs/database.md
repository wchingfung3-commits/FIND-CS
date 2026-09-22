# Database setup and security

The initial schema lives at `supabase/migrations/20260922000000_initial_schema.sql`. It is designed for a Supabase project but does not create or modify any external project by itself.

## Bootstrap

1. Create or select the intended Supabase project yourself. Do not enable a public admin-registration flow.
2. In the Supabase SQL editor, run the complete initial migration as the project database owner. Alternatively, apply it with the Supabase CLI from a trusted operator machine.
3. Provision the first admin through Supabase Dashboard authentication (for example, invite the operator). Copy that authenticated user's UUID from Authentication > Users.
4. In the SQL editor, add the UUID. This operation is intentionally unavailable to browser clients:

   ```sql
   insert into public.admin_members (user_id)
   values ('00000000-0000-0000-0000-000000000000');
   ```

5. Set the frontend's Supabase URL and anon key. Never put the service-role key in the frontend. The public app should call `supabase.rpc('get_public_catalog')`; it should not query base tables.
6. Add catalog records through a separately authenticated admin UI or SQL editor. New routes default to `published = false`; review them before publishing.

Do not import the TypeScript mock verification evidence as real verification records. A `human_reached` record requires non-empty evidence, and should only be created after an actual test.

## Public response

`get_public_catalog()` returns a JSON object with `industries`, `companies`, `issues`, and `routes` arrays. Keys inside those arrays use the camelCase names in `src/types/index.ts`.

- Only published routes are returned. A company and its industry become visible only when that company has at least one published route; an issue is visible only when a published route references it.
- `supportModel` is `router` when a published route references one of the company's issues, otherwise `simple`.
- `verificationStatus` comes from the newest verification date. A same-day `failed`, `human_not_available`, or `verification_boundary` record takes precedence over `human_reached`; this avoids an insertion-order-dependent verified result.
- `human_reached` maps to `verified`; `failed` and `human_not_available` map to `needs_review`; missing/boundary-only evidence maps to `unverified`.
- `lastVerified` is emitted only when the winning newest result is `human_reached`.
- Verification records capture the route revision automatically under a row lock. Editing material route content increments its revision, makes earlier evidence stale, and automatically unpublishes the route. If an operator explicitly republishes it before retesting, it appears as `needs_review`; toggling publication alone does not invalidate evidence. Client-side verification rows are append-only.
- Raw verification evidence, verification records, tasks, memberships, and audit logs are never returned.

## Authorization model

- Anonymous users have no base-table privileges. They can execute only the safe public catalog RPC (and `is_admin()`, which returns false for them).
- Authenticated admins are recognized by `admin_members` through the fixed-search-path, security-definer `is_admin()` function. RLS permits admins to manage catalog records, verifications, and maintenance tasks.
- Authenticated non-admins have no visible base rows and cannot write them.
- `admin_members` has no client policy or client grant. Membership changes require an owner/service-side administrative context.
- `audit_logs` can be read by admins, but clients cannot insert, update, or delete it. Security-definer triggers write actor, operation, and private before/after snapshots for catalog, verification, and task changes.
- Route/issue composite integrity prevents a route from referencing another company's issue. `steps` must be a JSON string array, enum-like fields are checked, and successful verification claims require evidence.
- Parent catalog deletes use restrictive foreign keys so one deletion cannot silently cascade through routes and evidence. Operators must review and remove dependent rows explicitly; maintenance tasks keep their history but clear a deleted route link.

## Tests

After applying the migration to a disposable local Supabase database, run:

```sh
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
  -f supabase/tests/initial_schema_test.sql
```

The test runs in one transaction and rolls back all fixtures. It checks constraints, admin/non-admin RLS behavior, anonymous RPC filtering, private-evidence exclusion, failure precedence, membership/audit immutability, and audit attribution.

## Operational caveats

- SQL-editor owners and the Supabase service role bypass RLS. Restrict those credentials and use them only in trusted server/operator environments.
- Audit rows record the authenticated `auth.uid()`. SQL-editor or service jobs without an end-user JWT can legitimately produce a null actor; use separate infrastructure logs to identify those operators. Snapshots can contain private verification evidence and must never be exposed publicly.
- Audit logs are application audit history, not tamper-proof forensic storage: a database owner can alter them. Export or stream logs to append-only storage if stronger guarantees are required.
- Date-only verification ordering cannot distinguish two tests on the same date. The conservative precedence prevents a same-day success from hiding a negative result; add a tested-at timestamp in a later migration if exact chronology becomes necessary. Operators should put the dated official source or reproducible observation details in `evidence`; it remains private.
- The migration does not seed catalog or verification data. This intentionally avoids presenting mock content as observed evidence.
