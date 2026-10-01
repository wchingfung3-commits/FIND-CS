-- Read-only diagnostic snapshot. Never authorizes or starts external execution.
create function public.check_agent_job(p_job_id uuid) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare snapshot record; state text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator required' using errcode = '42501';
  end if;
  -- One SELECT gives a coherent job/route snapshot. No lock/lease is acquired.
  select j.status, j.route_revision, j.plan, r.revision as current_revision,
         r.revision_started_at
    into snapshot from public.agent_jobs j
    left join public.routes r on r.id = j.route_id
    where j.id = p_job_id;
  if not found then
    return jsonb_build_object('jobId', p_job_id, 'state', 'unavailable',
      'runnable', false, 'routeRevision', null, 'currentRouteRevision', null,
      'checkedAt', statement_timestamp());
  end if;
  if snapshot.status = 'cancelled' then state := 'cancelled';
  elsif snapshot.current_revision is null then state := 'unavailable';
  elsif snapshot.route_revision <> snapshot.current_revision or
      (snapshot.plan->>'revisionStartedAt')::timestamptz is distinct from snapshot.revision_started_at then
    state := 'stale_route';
  else state := 'blocked_provider';
  end if;
  return jsonb_build_object('jobId', p_job_id, 'state', state, 'runnable', false,
    'routeRevision', snapshot.route_revision, 'currentRouteRevision', snapshot.current_revision,
    'checkedAt', statement_timestamp());
end; $$;
revoke all on function public.check_agent_job(uuid) from public, anon, authenticated;
grant execute on function public.check_agent_job(uuid) to authenticated;
comment on function public.check_agent_job(uuid) is 'Admin diagnostic only; runnable is always false, not an execution lease or authorization.';
