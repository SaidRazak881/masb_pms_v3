-- =====================================================================
-- 0016: Reconcile import engine with the three-role RBAC model.
-- Bulk upload/import is Super Admin-only.
-- =====================================================================

begin;

-- Import tables may be inspected by Super Admin and MASB Team, but only
-- Super Admin may create, mutate, delete, commit, or rollback an import.
drop policy if exists import_batches_read on public.import_batches;
drop policy if exists import_batches_insert on public.import_batches;
drop policy if exists import_batches_update on public.import_batches;
create policy import_batches_read on public.import_batches for select to authenticated
  using (public.current_user_role() in ('super_admin','masb_team'));
create policy import_batches_insert on public.import_batches for insert to authenticated
  with check (public.current_user_role()='super_admin' and created_by=auth.uid());
create policy import_batches_update on public.import_batches for update to authenticated
  using (public.current_user_role()='super_admin')
  with check (public.current_user_role()='super_admin');

drop policy if exists import_staging_read on public.import_staging;
drop policy if exists import_staging_insert on public.import_staging;
drop policy if exists import_staging_update on public.import_staging;
drop policy if exists import_staging_delete on public.import_staging;
create policy import_staging_read on public.import_staging for select to authenticated
  using (public.current_user_role() in ('super_admin','masb_team'));
create policy import_staging_insert on public.import_staging for insert to authenticated
  with check (public.current_user_role()='super_admin');
create policy import_staging_update on public.import_staging for update to authenticated
  using (public.current_user_role()='super_admin')
  with check (public.current_user_role()='super_admin');
create policy import_staging_delete on public.import_staging for delete to authenticated
  using (public.current_user_role()='super_admin');

drop policy if exists import_commit_log_select_import_roles on public.import_commit_log;
drop policy if exists import_commit_log_insert_import_roles on public.import_commit_log;
create policy import_commit_log_select_import_roles on public.import_commit_log for select to authenticated
  using (public.current_user_role() in ('super_admin','masb_team'));
create policy import_commit_log_insert_import_roles on public.import_commit_log for insert to authenticated
  with check (public.current_user_role()='super_admin');

-- Preserve the complete legacy import implementation while replacing only
-- its obsolete role guard. pg_get_functiondef() lets this migration retain
-- all existing import parsing/commit logic without duplicating it here.
do $$
declare
  v_sql text;
begin
  select pg_get_functiondef(p.oid)
    into v_sql
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='commit_import_batch'
    and pg_get_function_identity_arguments(p.oid)='p_batch_id uuid'
  limit 1;

  if v_sql is not null then
    v_sql := replace(
      v_sql,
      "if public.current_user_role() not in ('super_admin','admin','manager') then raise exception 'IMPORT_FORBIDDEN'; end if;",
      "if public.current_user_role() <> 'super_admin' then raise exception 'IMPORT_FORBIDDEN'; end if;"
    );
    execute v_sql;
  end if;
end $$;

-- Rollback is also a bulk-import mutation and must remain Super Admin-only.
do $$
declare
  v_sql text;
begin
  select pg_get_functiondef(p.oid)
    into v_sql
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='rollback_import_batch'
    and pg_get_function_identity_arguments(p.oid)='p_batch_id uuid'
  limit 1;

  if v_sql is not null then
    v_sql := replace(
      v_sql,
      "if public.current_user_role() not in ('super_admin','admin') then raise exception 'IMPORT_FORBIDDEN'; end if;",
      "if public.current_user_role() <> 'super_admin' then raise exception 'IMPORT_FORBIDDEN'; end if;"
    );
    execute v_sql;
  end if;
end $$;

grant execute on function public.commit_import_batch(uuid) to authenticated;
grant execute on function public.rollback_import_batch(uuid) to authenticated;

commit;
