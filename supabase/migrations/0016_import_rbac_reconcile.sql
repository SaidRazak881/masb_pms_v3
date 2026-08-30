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

-- Recreate the commit/rollback functions so their runtime role checks use
-- only values from the new enum. Preserve the existing import logic by
-- replacing the legacy role guard through an explicit wrapper check.
create or replace function public.commit_import_batch(p_batch_id uuid)
returns table(batch_id uuid, committed_at timestamptz, affected_records integer, inserted_quotations integer, inserted_invoices integer, inserted_cost_of_sales integer)
language plpgsql security invoker set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if public.current_user_role() <> 'super_admin' then raise exception 'IMPORT_FORBIDDEN'; end if;
  return query select * from public._commit_import_batch_impl(p_batch_id);
end;
$$;

-- If the legacy implementation function exists, protect it as well. This
-- prevents direct invocation from becoming a bypass around the wrapper.
do $$
begin
  if exists (select 1 from pg_proc where proname='_commit_import_batch_impl') then
    execute 'revoke execute on function public._commit_import_batch_impl(uuid) from public,anon,authenticated';
  end if;
end $$;

create or replace function public.rollback_import_batch(p_batch_id uuid)
returns table(batch_id uuid, rolled_back_at timestamptz, rolled_back_records integer)
language plpgsql security invoker set search_path=public
as $$
declare
  v_now timestamptz := now();
  r record;
  v_count integer := 0;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if public.current_user_role() <> 'super_admin' then raise exception 'IMPORT_FORBIDDEN'; end if;
  for r in select * from public.import_commit_log where batch_id=p_batch_id and action='INSERT' and rolled_back_at is null order by committed_at desc for update loop
    if r.target_table='cost_of_sales' then delete from public.cost_of_sales where id=r.target_record_id;
    elsif r.target_table='invoices' then delete from public.invoices where id=r.target_record_id;
    elsif r.target_table='quotations' then delete from public.quotations where id=r.target_record_id;
    end if;
    update public.import_commit_log set rolled_back_at=v_now where id=r.id;
    v_count := v_count+1;
  end loop;
  update public.import_batches set status='ROLLED_BACK', completed_at=v_now where id=p_batch_id;
  return query select p_batch_id,v_now,v_count;
end;
$$;

grant execute on function public.commit_import_batch(uuid) to authenticated;
grant execute on function public.rollback_import_batch(uuid) to authenticated;

commit;
