-- =====================================================================
-- 0017: Three-role RBAC model
-- Roles:
--   super_admin  = full system administration + bulk/raw-data import
--   masb_team    = full record-level create/update access
--   viewer       = read-only
--
-- Existing admin/manager/pic users are migrated to masb_team.
-- The legacy enum labels are retained internally for migration compatibility,
-- but profiles.role is constrained to the three supported application roles.
-- =====================================================================

alter type public.user_role add value if not exists 'masb_team';

update public.profiles
set role = 'masb_team'
where role in ('admin', 'manager', 'pic');

alter table public.profiles drop constraint if exists profiles_role_three_roles;
alter table public.profiles
  add constraint profiles_role_three_roles
  check (role::text in ('super_admin', 'masb_team', 'viewer'));

-- Reconcile all application RLS policies with the new model.  Viewer is
-- strictly read-only; MASB Team can create/update records; Super Admin can
-- additionally delete records and manage users/imports.
do $$
declare
  t text;
  p record;
begin
  foreach t in array array[
    'profiles','companies','company_alias_map','status_dictionary','programs',
    'pipeline_stage_history','quotations','purchase_orders','invoices','payments',
    'cost_of_sales','training_sessions','participant_counts','participant_roster',
    'data_quality_exceptions','audit_log','import_batches','import_staging','import_commit_log'
  ] loop
    if to_regclass('public.' || t) is not null then
      for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
        execute format('drop policy if exists %I on public.%I', p.policyname, t);
      end loop;
    end if;
  end loop;
end $$;

-- Profiles: everyone can see active user identity/role; only Super Admin can
-- change roles or account activation state.
create policy profiles_read on public.profiles
  for select to authenticated using (true);
create policy profiles_super_admin_update on public.profiles
  for update to authenticated
  using (public.current_user_role()::text = 'super_admin')
  with check (public.current_user_role()::text = 'super_admin');

-- Common source-data policy pattern: all authenticated users can read,
-- MASB Team/Super Admin can insert/update, Super Admin can delete.
create policy companies_read on public.companies for select to authenticated using (true);
create policy companies_insert on public.companies for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy companies_update on public.companies for update to authenticated
  using (public.current_user_role()::text in ('super_admin','masb_team'))
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy companies_delete on public.companies for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy aliases_read on public.company_alias_map for select to authenticated using (true);
create policy aliases_insert on public.company_alias_map for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy aliases_update on public.company_alias_map for update to authenticated
  using (public.current_user_role()::text in ('super_admin','masb_team'))
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy aliases_delete on public.company_alias_map for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy status_dictionary_read on public.status_dictionary for select to authenticated using (true);
create policy status_dictionary_insert on public.status_dictionary for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy status_dictionary_update on public.status_dictionary for update to authenticated
  using (public.current_user_role()::text in ('super_admin','masb_team'))
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy status_dictionary_delete on public.status_dictionary for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy programs_read on public.programs for select to authenticated using (true);
create policy programs_insert on public.programs for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy programs_update on public.programs for update to authenticated
  using (public.current_user_role()::text in ('super_admin','masb_team'))
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy programs_delete on public.programs for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy chain_read on public.pipeline_stage_history for select to authenticated using (true);
create policy chain_insert on public.pipeline_stage_history for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));

create policy quotation_read on public.quotations for select to authenticated using (true);
create policy quotation_insert on public.quotations for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy quotation_update on public.quotations for update to authenticated
  using (public.current_user_role()::text in ('super_admin','masb_team'))
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy quotation_delete on public.quotations for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy po_read on public.purchase_orders for select to authenticated using (true);
create policy po_insert on public.purchase_orders for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy po_update on public.purchase_orders for update to authenticated
  using (public.current_user_role()::text in ('super_admin','masb_team'))
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy po_delete on public.purchase_orders for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy invoice_read on public.invoices for select to authenticated using (true);
create policy invoice_insert on public.invoices for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy invoice_update on public.invoices for update to authenticated
  using (public.current_user_role()::text in ('super_admin','masb_team'))
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy invoice_delete on public.invoices for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy payment_read on public.payments for select to authenticated using (true);
create policy payment_insert on public.payments for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy payment_update on public.payments for update to authenticated
  using (public.current_user_role()::text in ('super_admin','masb_team'))
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy payment_delete on public.payments for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy cost_read on public.cost_of_sales for select to authenticated using (true);
create policy cost_insert on public.cost_of_sales for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy cost_update on public.cost_of_sales for update to authenticated
  using (public.current_user_role()::text in ('super_admin','masb_team'))
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy cost_delete on public.cost_of_sales for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy training_read on public.training_sessions for select to authenticated using (true);
create policy training_insert on public.training_sessions for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy training_update on public.training_sessions for update to authenticated
  using (public.current_user_role()::text in ('super_admin','masb_team'))
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy training_delete on public.training_sessions for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy participant_counts_read on public.participant_counts for select to authenticated using (true);
create policy participant_counts_insert on public.participant_counts for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy participant_counts_update on public.participant_counts for update to authenticated
  using (public.current_user_role()::text in ('super_admin','masb_team'))
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy participant_counts_delete on public.participant_counts for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy participant_roster_read on public.participant_roster for select to authenticated using (true);
create policy participant_roster_insert on public.participant_roster for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy participant_roster_update on public.participant_roster for update to authenticated
  using (public.current_user_role()::text in ('super_admin','masb_team'))
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy participant_roster_delete on public.participant_roster for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy dqe_read on public.data_quality_exceptions for select to authenticated using (true);
create policy dqe_insert on public.data_quality_exceptions for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy dqe_update on public.data_quality_exceptions for update to authenticated
  using (public.current_user_role()::text in ('super_admin','masb_team'))
  with check (public.current_user_role()::text in ('super_admin','masb_team'));
create policy dqe_delete on public.data_quality_exceptions for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy audit_read on public.audit_log for select to authenticated using (true);
create policy audit_insert on public.audit_log for insert to authenticated
  with check (public.current_user_role()::text in ('super_admin','masb_team'));

-- Bulk import is a Super Admin-only capability. Viewer and MASB Team cannot
-- create, mutate, or delete staging/batch records.
create policy import_batches_read on public.import_batches for select to authenticated
  using (public.current_user_role()::text = 'super_admin');
create policy import_batches_insert on public.import_batches for insert to authenticated
  with check (public.current_user_role()::text = 'super_admin' and created_by = auth.uid());
create policy import_batches_update on public.import_batches for update to authenticated
  using (public.current_user_role()::text = 'super_admin')
  with check (public.current_user_role()::text = 'super_admin');
create policy import_batches_delete on public.import_batches for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy import_staging_read on public.import_staging for select to authenticated
  using (public.current_user_role()::text = 'super_admin');
create policy import_staging_insert on public.import_staging for insert to authenticated
  with check (public.current_user_role()::text = 'super_admin');
create policy import_staging_update on public.import_staging for update to authenticated
  using (public.current_user_role()::text = 'super_admin')
  with check (public.current_user_role()::text = 'super_admin');
create policy import_staging_delete on public.import_staging for delete to authenticated
  using (public.current_user_role()::text = 'super_admin');

create policy import_commit_log_read on public.import_commit_log for select to authenticated
  using (public.current_user_role()::text = 'super_admin');
create policy import_commit_log_insert on public.import_commit_log for insert to authenticated
  with check (public.current_user_role()::text = 'super_admin');
