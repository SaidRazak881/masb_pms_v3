-- =====================================================================
-- 0015: Three-role RBAC enforcement
-- Roles: super_admin | masb_team | viewer
--
-- This migration reconciles legacy RLS policies that still referenced
-- admin / manager / pic. It does not change application data tables.
-- =====================================================================

begin;

-- Replace the legacy enum with the authoritative three-role enum.
do $$
begin
  if exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role_v2 as enum ('super_admin','masb_team','viewer');
    alter table public.profiles
      alter column role drop default;
    alter table public.profiles
      alter column role type user_role_v2
      using (
        case role::text
          when 'super_admin' then 'super_admin'
          when 'admin' then 'super_admin'
          when 'manager' then 'masb_team'
          when 'pic' then 'masb_team'
          else 'viewer'
        end
      )::user_role_v2;
    alter table public.profiles
      alter column role set default 'viewer'::user_role_v2;
    drop type user_role;
    alter type user_role_v2 rename to user_role;
  end if;
end $$;

create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path=public
as $$
  select role from public.profiles
  where id=auth.uid() and is_active=true limit 1
$$;

-- Profiles: everyone may read their own profile; only Super Admin may manage profiles.
drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using ((select auth.uid())=id or (select public.current_user_role())='super_admin');
create policy profiles_admin_update on public.profiles for update to authenticated
  using ((select public.current_user_role())='super_admin')
  with check ((select public.current_user_role())='super_admin');

-- Helper block: operational data is editable by Super Admin + MASB Team;
-- Viewer is read-only. Delete remains Super Admin-only.
drop policy if exists companies_insert on public.companies;
drop policy if exists companies_update on public.companies;
drop policy if exists companies_delete on public.companies;
create policy companies_insert on public.companies for insert to authenticated
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy companies_update on public.companies for update to authenticated
  using ((select public.current_user_role()) in ('super_admin','masb_team'))
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy companies_delete on public.companies for delete to authenticated
  using ((select public.current_user_role())='super_admin');

drop policy if exists programs_insert on public.programs;
drop policy if exists programs_update on public.programs;
drop policy if exists programs_delete on public.programs;
create policy programs_insert on public.programs for insert to authenticated
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy programs_update on public.programs for update to authenticated
  using ((select public.current_user_role()) in ('super_admin','masb_team'))
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy programs_delete on public.programs for delete to authenticated
  using ((select public.current_user_role())='super_admin');

drop policy if exists chain_insert on public.pipeline_stage_history;
create policy chain_insert on public.pipeline_stage_history for insert to authenticated
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));

drop policy if exists quotation_insert on public.quotations;
drop policy if exists quotation_update on public.quotations;
drop policy if exists quotation_delete on public.quotations;
create policy quotation_insert on public.quotations for insert to authenticated
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy quotation_update on public.quotations for update to authenticated
  using ((select public.current_user_role()) in ('super_admin','masb_team'))
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy quotation_delete on public.quotations for delete to authenticated
  using ((select public.current_user_role())='super_admin');

drop policy if exists po_insert on public.purchase_orders;
drop policy if exists po_update on public.purchase_orders;
drop policy if exists po_delete on public.purchase_orders;
create policy po_insert on public.purchase_orders for insert to authenticated
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy po_update on public.purchase_orders for update to authenticated
  using ((select public.current_user_role()) in ('super_admin','masb_team'))
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy po_delete on public.purchase_orders for delete to authenticated
  using ((select public.current_user_role())='super_admin');

-- Financial tables: both editors may create/update; only Super Admin may delete.
drop policy if exists invoice_insert on public.invoices;
drop policy if exists invoice_update on public.invoices;
drop policy if exists invoice_delete on public.invoices;
create policy invoice_insert on public.invoices for insert to authenticated
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy invoice_update on public.invoices for update to authenticated
  using ((select public.current_user_role()) in ('super_admin','masb_team'))
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy invoice_delete on public.invoices for delete to authenticated
  using ((select public.current_user_role())='super_admin');

drop policy if exists payment_insert on public.payments;
drop policy if exists payment_update on public.payments;
drop policy if exists payment_delete on public.payments;
create policy payment_insert on public.payments for insert to authenticated
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy payment_update on public.payments for update to authenticated
  using ((select public.current_user_role()) in ('super_admin','masb_team'))
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy payment_delete on public.payments for delete to authenticated
  using ((select public.current_user_role())='super_admin');

do $$
begin
  if exists (select 1 from pg_tables where schemaname='public' and tablename='cost_of_sales') then
    execute 'drop policy if exists cost_of_sales_insert on public.cost_of_sales';
    execute 'drop policy if exists cost_of_sales_update on public.cost_of_sales';
    execute 'drop policy if exists cost_of_sales_delete on public.cost_of_sales';
    execute 'create policy cost_of_sales_insert on public.cost_of_sales for insert to authenticated with check ((select public.current_user_role()) in (''super_admin'',''masb_team''))';
    execute 'create policy cost_of_sales_update on public.cost_of_sales for update to authenticated using ((select public.current_user_role()) in (''super_admin'',''masb_team'')) with check ((select public.current_user_role()) in (''super_admin'',''masb_team''))';
    execute 'create policy cost_of_sales_delete on public.cost_of_sales for delete to authenticated using ((select public.current_user_role())=''super_admin'')';
  end if;
end $$;

drop policy if exists training_insert on public.training_sessions;
drop policy if exists training_update on public.training_sessions;
drop policy if exists training_delete on public.training_sessions;
create policy training_insert on public.training_sessions for insert to authenticated
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy training_update on public.training_sessions for update to authenticated
  using ((select public.current_user_role()) in ('super_admin','masb_team'))
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy training_delete on public.training_sessions for delete to authenticated
  using ((select public.current_user_role())='super_admin');

drop policy if exists dqe_insert on public.data_quality_exceptions;
drop policy if exists dqe_update on public.data_quality_exceptions;
drop policy if exists dqe_delete on public.data_quality_exceptions;
create policy dqe_insert on public.data_quality_exceptions for insert to authenticated
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy dqe_update on public.data_quality_exceptions for update to authenticated
  using ((select public.current_user_role()) in ('super_admin','masb_team'))
  with check ((select public.current_user_role()) in ('super_admin','masb_team'));
create policy dqe_delete on public.data_quality_exceptions for delete to authenticated
  using ((select public.current_user_role())='super_admin');

-- Audit log remains read-only to Super Admin; writes should be trigger/system driven.
drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select to authenticated
  using ((select public.current_user_role())='super_admin');

commit;
