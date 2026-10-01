begin;
set constraints admin_members_user_id_fkey deferred;
insert into public.admin_members(user_id) values ('10000000-0000-0000-0000-000000000001');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
insert into public.industries(id,name,icon) values ('preflight-industry','Preflight test','Building');
insert into public.companies(id,name,industry) values ('preflight-company','Preflight test','preflight-industry');
insert into public.routes(id,company_id,channel_type,category,is_human_support,steps,action_url)
values ('preflight-phone','preflight-company','phone','human',true,'["Call"]','tel:+85221234567');
insert into public.agent_jobs(route_id,kind) values ('preflight-phone','voice');
do $$
declare job_key uuid; result jsonb; audits bigint; snapshot jsonb;
begin
 select j.id,j.plan into job_key,snapshot from public.agent_jobs j where route_id='preflight-phone';
 select count(*) into audits from public.audit_logs;
 result := public.check_agent_job(job_key);
 if result->>'state' <> 'blocked_provider' or result->>'runnable' <> 'false' or
    (result->>'currentRouteRevision')::int <> 1 then raise exception 'Valid plan diagnostic incorrect'; end if;
 if public.check_agent_job('30000000-0000-0000-0000-000000000003')->>'state' <> 'unavailable' then raise exception 'Missing job diagnostic incorrect'; end if;
 -- Publication alone keeps the snapshot current.
 update public.routes set published=true where routes.id='preflight-phone';
 if public.check_agent_job(job_key)->>'state' <> 'blocked_provider' then raise exception 'Publication invalidated plan'; end if;
 update public.routes set steps='["Call", "Press 2"]' where routes.id='preflight-phone';
 result := public.check_agent_job(job_key);
 if result->>'state' <> 'stale_route' or (result->>'currentRouteRevision')::int <> 2 or
    result->>'runnable' <> 'false' then raise exception 'Stale plan accepted'; end if;
 if (select j.plan from public.agent_jobs j where j.id=job_key) <> snapshot then raise exception 'Diagnostic changed snapshot'; end if;
 update public.agent_jobs set status='cancelled' where agent_jobs.id=job_key;
 if public.check_agent_job(job_key)->>'state' <> 'cancelled' then raise exception 'Cancelled plan accepted'; end if;
 select count(*) into audits from public.audit_logs;
 perform public.check_agent_job(job_key);
 if (select count(*) from public.audit_logs) <> audits then raise exception 'Diagnostic wrote data'; end if;
 if exists(select 1 from public.verifications where route_id='preflight-phone') then raise exception 'Diagnostic fabricated evidence'; end if;
end; $$;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
do $$
begin
 begin perform public.check_agent_job('30000000-0000-0000-0000-000000000003');
  raise exception 'Nonadmin diagnostic allowed'; exception when insufficient_privilege then null; end;
end; $$;
select set_config('request.jwt.claims', '{}', true);
do $$
begin
 begin perform public.check_agent_job('30000000-0000-0000-0000-000000000003');
  raise exception 'Missing UID allowed'; exception when insufficient_privilege then null; end;
end; $$;
set local role anon;
do $$
begin
 begin perform public.check_agent_job('30000000-0000-0000-0000-000000000003');
  raise exception 'Anonymous diagnostic allowed'; exception when insufficient_privilege then null; end;
end; $$;
rollback;
