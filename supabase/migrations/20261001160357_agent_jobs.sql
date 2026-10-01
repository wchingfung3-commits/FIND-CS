-- Preparation queue only: no executable state, provider calls or verification writes.
create table public.agent_jobs (
  id uuid primary key default gen_random_uuid(),
  route_id text not null references public.routes(id),
  kind text not null check (kind in ('browser', 'voice')),
  route_revision integer not null check (route_revision > 0),
  plan jsonb not null,
  status text not null default 'blocked_provider' check (status in ('blocked_provider', 'cancelled')),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index agent_jobs_created on public.agent_jobs(created_at desc, id desc);
create unique index agent_jobs_active_route on public.agent_jobs(route_id, kind, route_revision)
  where status = 'blocked_provider';
alter table public.agent_jobs enable row level security;
revoke all on public.agent_jobs from public, anon, authenticated;
grant select on public.agent_jobs to authenticated;
grant insert (route_id, kind) on public.agent_jobs to authenticated;
grant update (status) on public.agent_jobs to authenticated;
create policy agent_jobs_read on public.agent_jobs for select to authenticated using (public.is_admin());
create policy agent_jobs_create on public.agent_jobs for insert to authenticated with check (public.is_admin());
create policy agent_jobs_cancel on public.agent_jobs for update to authenticated using (public.is_admin()) with check (public.is_admin());

create function public.prepare_agent_job() returns trigger
language plpgsql set search_path = '' as $$
declare r public.routes%rowtype; target text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator required' using errcode = '42501';
  end if;
  select * into r from public.routes where id = new.route_id for share;
  if not found then raise exception 'Route unavailable'; end if;
  target := btrim(coalesce(r.action_url, ''));
  if new.kind = 'voice' then
    if r.channel_type <> 'phone' or target !~ '^tel:\+[1-9][0-9]{7,14}$' then
      raise exception 'Voice requires phone route with international tel target';
    end if;
  elsif new.kind = 'browser' then
    -- Conservative preparation validation, not a network/SSRF authorization boundary.
    if r.channel_type not in ('live_chat', 'whatsapp') or
       target !~ '^https://[A-Za-z0-9][A-Za-z0-9-]*(\.[A-Za-z0-9][A-Za-z0-9-]*)+([/?#][^[:space:]]*)?$' or
       target ~* '^https://[^/?#]*\.(localhost|local|internal|test|invalid|example)([/?#]|$)' or
       target ~ '^https://[0-9.]+([/?#]|$)' then
      raise exception 'Browser requires public HTTPS live_chat/whatsapp route';
    end if;
  else raise exception 'Unsupported agent kind'; end if;
  new.route_revision := r.revision;
  new.status := 'blocked_provider';
  new.created_by := auth.uid();
  new.created_at := clock_timestamp(); new.updated_at := new.created_at;
  new.plan := jsonb_build_object(
    'schemaVersion', 1, 'jobId', new.id, 'kind', new.kind,
    'routeId', r.id, 'routeRevision', r.revision,
    'revisionStartedAt', to_char(r.revision_started_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'target', target, 'steps', r.steps, 'timeoutSeconds', 180, 'maxAttempts', 1,
    'stopAt', jsonb_build_array('human_reached', 'account_verification', 'payment', 'captcha'),
    'execution', 'not_connected', 'publication', 'manual_review_required');
  return new;
end; $$;

create function public.cancel_agent_job() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.status <> 'blocked_provider' or new.status <> 'cancelled' then
    raise exception 'Only pending jobs can be cancelled';
  end if;
  if (new.id, new.route_id, new.kind, new.route_revision, new.plan, new.created_by, new.created_at)
      is distinct from
     (old.id, old.route_id, old.kind, old.route_revision, old.plan, old.created_by, old.created_at) then
    raise exception 'Job snapshot is immutable';
  end if;
  new.updated_at := clock_timestamp();
  return new;
end; $$;
revoke all on function public.prepare_agent_job() from public, anon, authenticated;
revoke all on function public.cancel_agent_job() from public, anon, authenticated;
create trigger agent_jobs_prepare before insert on public.agent_jobs for each row execute function public.prepare_agent_job();
create trigger agent_jobs_cancel before update on public.agent_jobs for each row execute function public.cancel_agent_job();
create trigger agent_jobs_audit after insert or update on public.agent_jobs for each row execute function public.write_audit_log();
