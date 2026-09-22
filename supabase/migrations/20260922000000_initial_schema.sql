-- Find CS initial schema.
-- Apply with the Supabase CLI or paste the complete file into the SQL editor.

create extension if not exists pgcrypto with schema extensions;

create table public.industries (
  id text primary key check (id = lower(id) and id ~ '^[a-z0-9][a-z0-9_-]*$'),
  name text not null check (btrim(name) <> ''),
  icon text not null check (btrim(icon) <> '')
);

create table public.companies (
  id text primary key check (id = lower(id) and id ~ '^[a-z0-9][a-z0-9_-]*$'),
  name text not null check (btrim(name) <> ''),
  industry text not null references public.industries(id) on update cascade on delete restrict,
  description text,
  official_url text,
  constraint companies_description_not_blank check (description is null or btrim(description) <> ''),
  constraint companies_official_url_not_blank check (official_url is null or btrim(official_url) <> '')
);

create table public.issues (
  id text not null check (id = lower(id) and id ~ '^[a-z0-9][a-z0-9_-]*$'),
  company_id text not null references public.companies(id) on update cascade on delete restrict,
  name text not null check (btrim(name) <> ''),
  description text,
  primary key (id),
  unique (company_id, id),
  constraint issues_description_not_blank check (description is null or btrim(description) <> '')
);

create function public.is_jsonb_string_array(value jsonb)
returns boolean
language sql
immutable
strict
set search_path = ''
as $$
  select jsonb_typeof(value) = 'array'
    and not exists (
      select 1
      from jsonb_array_elements(value) as element
      where jsonb_typeof(element) <> 'string'
    );
$$;

revoke all on function public.is_jsonb_string_array(jsonb) from public;
grant execute on function public.is_jsonb_string_array(jsonb) to authenticated;

create table public.routes (
  id text primary key check (id = lower(id) and id ~ '^[a-z0-9][a-z0-9_-]*$'),
  company_id text not null references public.companies(id) on update cascade on delete restrict,
  issue_id text,
  channel_type text not null check (
    channel_type in ('phone', 'live_chat', 'whatsapp', 'email', 'web_form', 'branch', 'postal', 'other')
  ),
  category text not null check (category in ('human', 'other')),
  is_human_support boolean not null,
  opening_hours text,
  steps jsonb not null default '[]'::jsonb,
  action_url text,
  action_label text,
  published boolean not null default false,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint routes_issue_same_company
    foreign key (company_id, issue_id)
    references public.issues(company_id, id)
    on update cascade on delete restrict,
  constraint routes_steps_string_array check (public.is_jsonb_string_array(steps)),
  constraint routes_opening_hours_not_blank check (opening_hours is null or btrim(opening_hours) <> ''),
  constraint routes_action_url_not_blank check (action_url is null or btrim(action_url) <> ''),
  constraint routes_action_label_not_blank check (action_label is null or btrim(action_label) <> ''),
  constraint routes_human_category_consistent check (is_human_support = (category = 'human'))
);

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  route_id text not null references public.routes(id) on update cascade on delete restrict,
  test_date date not null,
  test_period text not null check (test_period in ('service_hours', 'after_hours')),
  result text not null check (
    result in ('human_reached', 'human_not_available', 'verification_boundary', 'failed')
  ),
  evidence text,
  route_revision integer not null check (route_revision > 0),
  constraint verifications_evidence_not_blank check (evidence is null or btrim(evidence) <> ''),
  constraint verifications_success_requires_evidence check (
    result <> 'human_reached' or (evidence is not null and btrim(evidence) <> '')
  )
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (btrim(title) <> ''),
  route_id text references public.routes(id) on update cascade on delete set null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_at timestamptz,
  notes text,
  updated_at timestamptz not null default now(),
  constraint tasks_notes_not_blank check (notes is null or btrim(notes) <> '')
);

-- Deliberately has no client policies. Bootstrap and membership changes happen only
-- from the SQL editor/service-side administration, never from the public app.
create table public.admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade deferrable initially immediate,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index routes_company_id_idx on public.routes(company_id);
create index routes_issue_id_idx on public.routes(issue_id);
create index routes_published_idx on public.routes(company_id, published) where published;
create index verifications_latest_idx on public.verifications(route_id, test_date desc, id desc);
create index tasks_route_id_idx on public.tasks(route_id);
create index audit_logs_record_idx on public.audit_logs(table_name, record_id, created_at desc);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.admin_members
      where user_id = auth.uid()
    ),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create function public.prepare_route_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.revision := 1;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.prepare_route_insert() from public;

create trigger routes_prepare_insert
before insert on public.routes
for each row execute function public.prepare_route_insert();

create function public.prepare_route_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.company_id, new.issue_id, new.channel_type, new.category,
      new.is_human_support, new.opening_hours, new.steps,
      new.action_url, new.action_label)
     is distinct from
     (old.company_id, old.issue_id, old.channel_type, old.category,
      old.is_human_support, old.opening_hours, old.steps,
      old.action_url, old.action_label) then
    new.revision := old.revision + 1;
    new.published := false;
  else
    new.revision := old.revision;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.prepare_route_update() from public;

create trigger routes_prepare_update
before update on public.routes
for each row execute function public.prepare_route_update();

create function public.prepare_verification_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select revision into new.route_revision
  from public.routes
  where id = new.route_id
  for share;

  return new;
end;
$$;

revoke all on function public.prepare_verification_insert() from public;

create trigger verifications_prepare_insert
before insert on public.verifications
for each row execute function public.prepare_verification_insert();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id text;
begin
  target_id := case when tg_op = 'DELETE' then old.id::text else new.id::text end;

  insert into public.audit_logs (
    table_name, record_id, operation, actor_id, before_data, after_data
  ) values (
    tg_table_name,
    target_id,
    tg_op,
    auth.uid(),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.write_audit_log() from public;

create trigger industries_audit after insert or update or delete on public.industries
for each row execute function public.write_audit_log();
create trigger companies_audit after insert or update or delete on public.companies
for each row execute function public.write_audit_log();
create trigger issues_audit after insert or update or delete on public.issues
for each row execute function public.write_audit_log();
create trigger routes_audit after insert or update or delete on public.routes
for each row execute function public.write_audit_log();
create trigger verifications_audit after insert or update or delete on public.verifications
for each row execute function public.write_audit_log();
create trigger tasks_audit after insert or update or delete on public.tasks
for each row execute function public.write_audit_log();

alter table public.industries enable row level security;
alter table public.companies enable row level security;
alter table public.issues enable row level security;
alter table public.routes enable row level security;
alter table public.verifications enable row level security;
alter table public.tasks enable row level security;
alter table public.admin_members enable row level security;
alter table public.audit_logs enable row level security;

create policy industries_admin_all on public.industries
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy companies_admin_all on public.companies
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy issues_admin_all on public.issues
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy routes_admin_all on public.routes
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy verifications_admin_read on public.verifications
for select to authenticated using ((select public.is_admin()));
create policy verifications_admin_insert on public.verifications
for insert to authenticated with check ((select public.is_admin()));
create policy tasks_admin_all on public.tasks
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy audit_logs_admin_read on public.audit_logs
for select to authenticated using ((select public.is_admin()));

-- No admin_members policy is intentional: even an existing admin cannot grant
-- admin access through the browser client. audit_logs has no mutation policy.

revoke all on table public.industries, public.companies, public.issues, public.routes,
  public.verifications, public.tasks, public.admin_members, public.audit_logs from anon;
revoke all on table public.admin_members, public.audit_logs from authenticated;
grant select, insert, update, delete on table public.industries, public.companies,
  public.issues, public.routes, public.tasks to authenticated;
grant select, insert on table public.verifications to authenticated;
grant select on table public.audit_logs to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;

-- Anonymous callers receive a JSON object whose arrays use the src/types names.
-- Verification evidence and internal objects are never included. Among records on
-- the newest test date, a negative result wins so insertion order cannot turn a
-- same-day failure into a verified result.
create function public.get_public_catalog()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with published_routes as (
    select r.*
    from public.routes r
    where r.published
  ),
  visible_companies as (
    select distinct r.company_id
    from published_routes r
  ),
  visible_issues as (
    select distinct r.issue_id
    from published_routes r
    where r.issue_id is not null
  ),
  latest_verification as (
    select distinct on (v.route_id)
      v.route_id,
      v.test_date,
      v.result
    from public.verifications v
    join published_routes r
      on r.id = v.route_id
     and r.revision = v.route_revision
    order by
      v.route_id,
      v.test_date desc,
      case v.result
        when 'failed' then 1
        when 'human_not_available' then 2
        when 'verification_boundary' then 3
        when 'human_reached' then 4
      end,
      v.id desc
  )
  select jsonb_build_object(
    'industries', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', i.id, 'name', i.name, 'icon', i.icon)
        order by i.name, i.id
      )
      from public.industries i
      where exists (
        select 1
        from public.companies c
        join visible_companies vc on vc.company_id = c.id
        where c.industry = i.id
      )
    ), '[]'::jsonb),
    'companies', coalesce((
      select jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'industry', c.industry,
          'description', c.description,
          'officialUrl', c.official_url,
          'supportModel', case
            when exists (
              select 1
              from public.issues x
              join visible_issues vi on vi.issue_id = x.id
              where x.company_id = c.id
            )
              then 'router'
            else 'simple'
          end
        )) order by c.name, c.id
      )
      from public.companies c
      join visible_companies vc on vc.company_id = c.id
    ), '[]'::jsonb),
    'issues', coalesce((
      select jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'id', i.id,
          'companyId', i.company_id,
          'name', i.name,
          'description', i.description
        )) order by i.name, i.id
      )
      from public.issues i
      join visible_issues vi on vi.issue_id = i.id
    ), '[]'::jsonb),
    'routes', coalesce((
      select jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'id', r.id,
          'companyId', r.company_id,
          'issueId', r.issue_id,
          'channelType', r.channel_type,
          'category', r.category,
          'isHumanSupport', r.is_human_support,
          'openingHours', r.opening_hours,
          'steps', r.steps,
          'verificationStatus', case
            when lv.result = 'human_reached' then 'verified'
            when lv.result in ('failed', 'human_not_available') then 'needs_review'
            when lv.result = 'verification_boundary' then 'unverified'
            when exists (
              select 1 from public.verifications previous
              where previous.route_id = r.id
            ) then 'needs_review'
            else 'unverified'
          end,
          'lastVerified', case
            when lv.result = 'human_reached' then lv.test_date::text
            else null
          end,
          'actionUrl', r.action_url,
          'actionLabel', r.action_label
        )) order by r.id
      )
      from published_routes r
      left join latest_verification lv on lv.route_id = r.id
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_public_catalog() from public;
grant execute on function public.get_public_catalog() to anon, authenticated;

comment on function public.get_public_catalog() is
  'Published public catalog only. Excludes verification evidence, tasks, audit logs, and memberships.';
