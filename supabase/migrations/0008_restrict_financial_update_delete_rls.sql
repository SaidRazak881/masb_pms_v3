-- =====================================================================
-- 0008: Restrict financial UPDATE/DELETE to super_admin/admin
--
-- WHY:
-- Blueprint 01-ARCHITECTURE.md §5.2 requires financial mutation tables
-- (invoices, payments, cost_of_sales) to restrict UPDATE/DELETE to
-- super_admin/admin only. Migration 0002 (and legacy 0001 policies) still
-- allow manager and pic to UPDATE these tables, which the Phase 1 live
-- RLS audit (2026-08-30) confirmed as the top security deviation:
--   invoice_update      allows manager,pic
--   payment_update      allows manager,pic
--   cost_of_sales_update allows manager,pic
--
-- This migration is additive and idempotent. It is guarded so it can run
-- safely on a fresh database that only has migrations 0001-0004 (where
-- cost_of_sales may not exist yet), and it also reconciles live databases
-- where cost_of_sales already exists.
--
-- Scope:
--   * UPDATE/DELETE on invoices, payments, cost_of_sales -> super_admin/admin
--   * PIC/manager INSERT on payments is PRESERVED (payment_insert policy).
--   * SELECT policies are PRESERVED.
--   * Ownership predicates are not needed on UPDATE/DELETE because those
--     commands are now admin-only; read/pic behavior stays unchanged.
-- =====================================================================

begin;

do $$
begin
  -- ---------------------------------------------------------------
  -- invoices
  -- ---------------------------------------------------------------
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'invoices') then
    -- Drop the legacy broad "for all" policy from 0001 if present.
    execute 'drop policy if exists invoice_write on public.invoices';
    execute 'drop policy if exists invoice_update on public.invoices';
    execute 'drop policy if exists invoice_delete on public.invoices';

    execute 'create policy invoice_update on public.invoices for update to authenticated
      using (public.current_user_role() in (''super_admin'',''admin''))
      with check (public.current_user_role() in (''super_admin'',''admin''))';

    execute 'create policy invoice_delete on public.invoices for delete to authenticated
      using (public.current_user_role() in (''super_admin'',''admin''))';
  end if;
end $$;

do $$
begin
  -- ---------------------------------------------------------------
  -- payments
  -- ---------------------------------------------------------------
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'payments') then
    execute 'drop policy if exists payment_write on public.payments';
    execute 'drop policy if exists payment_update on public.payments';
    execute 'drop policy if exists payment_delete on public.payments';

    execute 'create policy payment_update on public.payments for update to authenticated
      using (public.current_user_role() in (''super_admin'',''admin''))
      with check (public.current_user_role() in (''super_admin'',''admin''))';

    execute 'create policy payment_delete on public.payments for delete to authenticated
      using (public.current_user_role() in (''super_admin'',''admin''))';
  end if;
end $$;

do $$
begin
  -- ---------------------------------------------------------------
  -- cost_of_sales
  -- ---------------------------------------------------------------
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'cost_of_sales') then
    execute 'drop policy if exists cost_of_sales_write on public.cost_of_sales';
    execute 'drop policy if exists cost_of_sales_update on public.cost_of_sales';
    execute 'drop policy if exists cost_of_sales_delete on public.cost_of_sales';

    execute 'create policy cost_of_sales_update on public.cost_of_sales for update to authenticated
      using (public.current_user_role() in (''super_admin'',''admin''))
      with check (public.current_user_role() in (''super_admin'',''admin''))';

    execute 'create policy cost_of_sales_delete on public.cost_of_sales for delete to authenticated
      using (public.current_user_role() in (''super_admin'',''admin''))';
  end if;
end $$;

commit;
