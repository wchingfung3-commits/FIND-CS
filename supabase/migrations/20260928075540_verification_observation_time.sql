-- Keep observation time separate from maintenance/publication time.
alter table public.routes add column revision_started_at timestamptz not null default clock_timestamp();
alter table public.verifications add column tested_at timestamptz;

create or replace function public.prepare_route_insert()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := 1;
  new.updated_at := clock_timestamp();
  new.revision_started_at := new.updated_at;
  return new;
end;
$$;

create or replace function public.prepare_route_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.company_id, new.issue_id, new.channel_type, new.category,
      new.is_human_support, new.opening_hours, new.steps, new.action_url, new.action_label)
     is distinct from
     (old.company_id, old.issue_id, old.channel_type, old.category,
      old.is_human_support, old.opening_hours, old.steps, old.action_url, old.action_label) then
    new.revision := old.revision + 1;
    new.published := false;
    new.revision_started_at := clock_timestamp();
  else
    new.revision := old.revision;
    new.revision_started_at := old.revision_started_at;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create or replace function public.prepare_verification_insert()
returns trigger language plpgsql set search_path = '' as $$
declare
  revision_start timestamptz;
  observed_now timestamptz := clock_timestamp();
begin
  select revision, revision_started_at into new.route_revision, revision_start
  from public.routes where id = new.route_id for share;

  if not isfinite(new.test_date)
     or new.test_date > (observed_now at time zone 'Asia/Hong_Kong')::date then
    raise exception using errcode = '23514', message = '測試日期不可在未來。';
  end if;
  if new.tested_at is not null then
    if not isfinite(new.tested_at) or new.tested_at > observed_now then
      raise exception using errcode = '23514', message = '測試時間不可在未來。';
    end if;
    if new.test_date is distinct from (new.tested_at at time zone 'Asia/Hong_Kong')::date then
      raise exception using errcode = '23514', message = '測試日期與香港時間不一致。';
    end if;
  end if;
  -- Initial catalog imports may retain genuine date-only observations. Once a
  -- route changes, exact observation time is required to rule out same-day reuse.
  if new.route_revision > 1 and (new.tested_at is null or new.tested_at < revision_start) then
    raise exception using errcode = '23514', message = '路線已修改，請提供修改後的實際測試時間。';
  end if;
  return new;
end;
$$;

revoke all on function public.prepare_route_insert(), public.prepare_route_update(),
  public.prepare_verification_insert() from public, anon, authenticated;

comment on column public.verifications.tested_at is
  'Actual observed time; not insertion time. Required for materially revised routes. test_date is its Hong Kong date.';
comment on column public.routes.revision_started_at is
  'Server-owned start of current material revision; publication toggles preserve it.';
