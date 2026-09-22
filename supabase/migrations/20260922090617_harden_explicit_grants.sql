-- Supabase projects may grant roles privileges directly through default ACLs.
-- Revoking from PUBLIC alone does not remove those role-specific grants.
revoke all on table public.industries, public.companies, public.issues,
  public.routes, public.verifications, public.tasks, public.admin_members,
  public.audit_logs from public, anon, authenticated;
grant select, insert, update, delete on public.industries, public.companies,
  public.issues, public.routes, public.tasks to authenticated;
grant select, insert on public.verifications to authenticated;
grant select on public.audit_logs to authenticated;

revoke all on sequence public.audit_logs_id_seq from public, anon, authenticated;

revoke all on function public.prepare_route_insert(), public.prepare_route_update(),
  public.prepare_verification_insert(), public.set_updated_at(),
  public.write_audit_log(), public.is_jsonb_string_array(jsonb),
  public.is_admin(), public.get_public_catalog() from public, anon, authenticated;
grant execute on function public.is_jsonb_string_array(jsonb), public.is_admin()
  to authenticated;
grant execute on function public.get_public_catalog() to anon, authenticated;

create index companies_industry_idx on public.companies(industry);
create index routes_company_issue_idx on public.routes(company_id, issue_id);
