begin;
set constraints admin_members_user_id_fkey deferred;
insert into public.admin_members(user_id) values ('10000000-0000-0000-0000-000000000001');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
insert into public.industries(id,name,icon) values ('queue-industry','Queue test','Building');
insert into public.companies(id,name,industry) values ('queue-company','Queue test','queue-industry');
insert into public.routes(id,company_id,channel_type,category,is_human_support,steps,action_url)
values ('queue-phone','queue-company','phone','human',true,'["Call"]','tel:+85221234567'),
 ('queue-chat','queue-company','live_chat','human',true,'["Chat"]','https://support.vendor.com/chat'),
 ('queue-private','queue-company','live_chat','human',true,'[]','https://127.0.0.1/');
insert into public.agent_jobs(route_id,kind) values ('queue-phone','voice'), ('queue-chat','browser');
do $$
declare j public.agent_jobs%rowtype;
begin
 select * into j from public.agent_jobs where route_id='queue-phone';
 if j.status <> 'blocked_provider' or j.created_by <> auth.uid() or j.route_revision <> 1 or
    j.plan->>'jobId' <> j.id::text or j.plan->>'execution' <> 'not_connected' or
    j.plan->>'target' <> 'tel:+85221234567' then raise exception 'Snapshot incorrect'; end if;
 if (select count(*) from public.verifications where route_id in ('queue-phone','queue-chat')) <> 0 then raise exception 'Job fabricated evidence'; end if;
 begin insert into public.agent_jobs(route_id,kind) values ('queue-phone','voice');
  raise exception 'Duplicate allowed'; exception when unique_violation then null; end;
 begin insert into public.agent_jobs(route_id,kind) values ('queue-phone','browser');
  raise exception 'Wrong channel allowed'; exception when raise_exception then
   if sqlerrm='Wrong channel allowed' then raise; end if; end;
 begin insert into public.agent_jobs(route_id,kind) values ('queue-private','browser');
  raise exception 'Private target allowed'; exception when raise_exception then
   if sqlerrm='Private target allowed' then raise; end if; end;
 begin update public.agent_jobs set plan='{}';
  raise exception 'Plan writable'; exception when insufficient_privilege then null; end;
 begin delete from public.agent_jobs;
  raise exception 'Deletion allowed'; exception when insufficient_privilege then null; end;
 begin insert into public.agent_jobs(route_id,kind,route_revision,plan) values ('queue-phone','voice',100,'{}');
  raise exception 'Client snapshot allowed'; exception when insufficient_privilege then null; end;
 begin update public.agent_jobs set status='done';
  raise exception 'Execution state allowed'; exception when raise_exception then
   if sqlerrm='Execution state allowed' then raise; end if; end;
end; $$;
update public.agent_jobs set status='cancelled' where route_id='queue-phone';
do $$
begin
 if not exists(select 1 from public.audit_logs where table_name='agent_jobs' and operation='UPDATE' and actor_id=auth.uid()) then raise exception 'Cancellation not audited'; end if;
 begin update public.agent_jobs set status='blocked_provider' where route_id='queue-phone';
  raise exception 'Reactivation allowed'; exception when raise_exception then
   if sqlerrm='Reactivation allowed' then raise; end if; end;
end; $$;
insert into public.agent_jobs(route_id,kind) values ('queue-phone','voice');
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
do $$
begin
 if exists(select 1 from public.agent_jobs) then raise exception 'Nonadmin read allowed'; end if;
 begin insert into public.agent_jobs(route_id,kind) values ('queue-phone','voice');
  raise exception 'Nonadmin insert allowed'; exception when insufficient_privilege then null; end;
 update public.agent_jobs set status='cancelled';
 if found then raise exception 'Nonadmin cancellation allowed'; end if;
end; $$;
set local role anon;
do $$
begin
 begin perform * from public.agent_jobs;
  raise exception 'Anonymous read allowed'; exception when insufficient_privilege then null; end;
 begin insert into public.agent_jobs(route_id,kind) values ('queue-phone','voice');
  raise exception 'Anonymous insert allowed'; exception when insufficient_privilege then null; end;
 begin update public.agent_jobs set status='cancelled';
  raise exception 'Anonymous cancellation allowed'; exception when insufficient_privilege then null; end;
end; $$;
rollback;
