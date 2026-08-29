-- =====================================================================
-- 0007: Align public.cost_of_sales with the commit engine (convergent)
--
-- WHY: Migration 0005 created cost_of_sales ONLY IF NOT EXISTS. On databases
-- whose cost_of_sales was already created from 02-schema.sql (net_profit is a
-- GENERATED column, no invoice_no / invoice_value / collection /
-- profit_percentage columns, unique(invoice_id, source_file)), that CREATE was
-- a NO-OP. But public.commit_import_batch() (migration 0004) INSERTs those
-- columns explicitly, so on such databases the cost_of_sales commit step would
-- fail with "column does not exist" and "cannot insert into generated column".
--
-- This migration reconciles an existing table to the commit-engine shape
-- additively and idempotently. Safe to run on a fresh DB too.
-- =====================================================================

begin;

-- 1) Add the columns the commit engine writes that 02-schema.sql lacks.
alter table public.cost_of_sales
  add column if not exists invoice_no text,
  add column if not exists invoice_value numeric(14,2),
  add column if not exists collection numeric(14,2),
  add column if not exists profit_percentage numeric(5,2);

-- 2) In 02-schema.sql net_profit is `generated always as (...) stored`, which
--    cannot receive an explicit INSERT. Drop + re-add as a plain mutable column
--    so commit_import_batch() can write it. Views that reference cost_of_sales
--    by column name tolerate this because the column name is preserved.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cost_of_sales'
      and column_name = 'net_profit'
      and is_generated = 'ALWAYS'
  ) then
    alter table public.cost_of_sales drop column net_profit;
    alter table public.cost_of_sales add column net_profit numeric(14,2);
  end if;
end $$;

-- 3) Convergent index matching the commit engine's per-invoice dedupe.
create unique index if not exists idx_cost_of_sales_invoice
  on public.cost_of_sales(invoice_id);

commit;
