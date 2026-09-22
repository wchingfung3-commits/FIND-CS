-- Run against a migrated local Supabase database:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/initial_schema_test.sql
-- Every fixture and assertion is rolled back.

begin;

set constraints admin_members_user_id_fkey deferred;

insert into public.admin_members (user_id)
values ('10000000-0000-0000-0000-000000000001');

-- Seed through an authenticated admin so RLS, is_admin(), and audit triggers run.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

do $$
begin
  if not public.is_admin() then
    raise exception 'admin fixture was not recognized';
  end if;
end;
$$;

insert into public.industries (id, name, icon)
values ('test-industry', 'Test industry', 'Building');

insert into public.companies (id, name, industry)
values
  ('test-company', 'Visible Co', 'test-industry'),
  ('hidden-company', 'Hidden Co', 'test-industry');

insert into public.issues (id, company_id, name)
values ('test-issue', 'test-company', 'Billing');

insert into public.routes (
  id, company_id, issue_id, channel_type, category, is_human_support,
  steps, action_url, published
) values
  (
    'published-route', 'test-company', 'test-issue', 'phone', 'human', true,
    '["Call", "Ask for an agent"]', 'tel:+85200000000', true
  ),
  (
    'hidden-route', 'hidden-company', null, 'email', 'other', false,
    '["Email support"]', 'mailto:hidden@example.invalid', false
  );

do $$
begin
  if (select revision from public.routes where id = 'published-route') <> 1 then
    raise exception 'route did not start at revision 1';
  end if;
end;
$$;

insert into public.verifications (route_id, test_date, test_period, result, evidence)
values
  ('published-route', '2026-09-20', 'service_hours', 'human_reached', 'private success evidence'),
  ('published-route', '2026-09-21', 'service_hours', 'failed', 'private failure evidence');

-- A route cannot point at an issue owned by another company.
do $$
begin
  begin
    insert into public.routes (
      id, company_id, issue_id, channel_type, category, is_human_support, steps
    ) values (
      'wrong-company-route', 'hidden-company', 'test-issue', 'phone', 'human', true, '[]'
    );
    raise exception 'expected same-company foreign key violation';
  exception when foreign_key_violation then
    null;
  end;
end;
$$;

-- Steps must contain strings only.
do $$
begin
  begin
    insert into public.routes (
      id, company_id, channel_type, category, is_human_support, steps
    ) values (
      'invalid-steps-route', 'test-company', 'phone', 'human', true, '[1]'
    );
    raise exception 'expected steps check violation';
  exception when check_violation then
    null;
  end;
end;
$$;

-- A successful verification cannot be asserted without evidence.
do $$
begin
  begin
    insert into public.verifications (route_id, test_date, test_period, result)
    values ('published-route', '2026-09-22', 'service_hours', 'human_reached');
    raise exception 'expected evidence check violation';
  exception when check_violation then
    null;
  end;
end;
$$;

reset role;

do $$
begin
  if not exists (
    select 1 from public.audit_logs
    where table_name = 'routes'
      and record_id = 'published-route'
      and operation = 'INSERT'
      and actor_id = '10000000-0000-0000-0000-000000000001'::uuid
      and before_data is null
      and after_data->>'id' = 'published-route'
  ) then
    raise exception 'route insert was not audited with its actor';
  end if;

  if has_table_privilege('anon', 'public.routes', 'SELECT') then
    raise exception 'anon unexpectedly has direct routes SELECT';
  end if;

  if has_table_privilege('authenticated', 'public.admin_members', 'SELECT') then
    raise exception 'authenticated unexpectedly has membership SELECT';
  end if;

  if has_table_privilege('authenticated', 'public.audit_logs', 'INSERT') then
    raise exception 'authenticated unexpectedly has audit INSERT';
  end if;

  if has_table_privilege('authenticated', 'public.verifications', 'UPDATE')
     or has_table_privilege('authenticated', 'public.verifications', 'DELETE') then
    raise exception 'authenticated unexpectedly can mutate verification evidence';
  end if;
end;
$$;

-- The anonymous RPC sees only published catalog data and no private evidence.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
declare
  catalog jsonb := public.get_public_catalog();
  route jsonb;
begin
  if jsonb_array_length(catalog->'routes') <> 1 then
    raise exception 'anon catalog did not filter unpublished routes: %', catalog;
  end if;

  if catalog::text like '%private % evidence%' or catalog ? 'verifications' then
    raise exception 'catalog leaked verification data: %', catalog;
  end if;

  route := catalog->'routes'->0;
  if route->>'id' <> 'published-route'
     or route->>'verificationStatus' <> 'needs_review'
     or route ? 'lastVerified' then
    raise exception 'newer failure did not override old success: %', route;
  end if;

  if catalog->'companies'->0->>'supportModel' <> 'router' then
    raise exception 'supportModel was not derived from issues: %', catalog->'companies';
  end if;
end;
$$;

-- A material content edit bumps the revision and makes older evidence stale.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
update public.routes
set steps = '["Call", "Use the revised menu", "Ask for an agent"]'
where id = 'published-route';

do $$
begin
  if (select revision from public.routes where id = 'published-route') <> 2
     or (select published from public.routes where id = 'published-route') then
    raise exception 'content revision did not invalidate and unpublish the route';
  end if;
end;
$$;

-- Re-publication is explicit; stale prior evidence yields needs_review.
update public.routes set published = true where id = 'published-route';
do $$
declare
  route jsonb := public.get_public_catalog()->'routes'->0;
begin
  if route->>'verificationStatus' <> 'needs_review' or route ? 'lastVerified' then
    raise exception 're-published route reused stale evidence: %', route;
  end if;
end;
$$;

insert into public.verifications (route_id, test_date, test_period, result, evidence)
values (
  'published-route', '2026-09-22', 'service_hours', 'human_reached',
  'dated private source observation for revised route'
);

do $$
declare
  route jsonb := public.get_public_catalog()->'routes'->0;
begin
  if route->>'verificationStatus' <> 'verified'
     or route->>'lastVerified' <> '2026-09-22' then
    raise exception 'current-revision success was not verified: %', route;
  end if;
end;
$$;

-- An authenticated non-admin has table grants but RLS exposes no rows/writes.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

do $$
begin
  if public.is_admin() then
    raise exception 'non-admin was recognized as admin';
  end if;

  if (select count(*) from public.routes) <> 0 then
    raise exception 'non-admin read base-table rows through RLS';
  end if;

  begin
    insert into public.tasks (title) values ('Must be rejected');
    raise exception 'expected non-admin task insert to fail';
  exception when insufficient_privilege or check_violation then
    null;
  end;
end;
$$;

rollback;
