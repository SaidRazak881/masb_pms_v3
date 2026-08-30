-- =====================================================================
-- 0009: Safe commit-engine support for generated net_profit (no DROP)
--
-- REPLACES the intent of the PR-#5 draft migration 0007
-- (0007_align_cost_of_sales_with_commit_engine.sql) without its destructive
-- step. 0007 drops + re-adds public.cost_of_sales.net_profit to make INSERT
-- possible when net_profit is a generated column (02-schema.sql shape).
-- For a production candidate, that DROP COLUMN is unsafe.
--
-- This migration is purely additive / create-or-replace:
--   1. Adds commit-engine columns if missing (invoice_no, invoice_value,
--      collection, profit_percentage).
--   2. Leaves net_profit untouched.
--   3. Replaces commit_import_batch() with a version that detects whether
--      net_profit is a GENERATED column and, if so, OMITS net_profit from the
--      INSERT so the generated expression computes it. If net_profit is a
--      plain column (the live shape), it is inserted as before.
--
-- Safe to run on:
--   * a database already seeded from migrations 0001-0007,
--   * the live shape (net_profit plain numeric),
--   * a fresh database built from 02-schema.sql (net_profit generated).
--
-- No DROP TABLE / DROP COLUMN / TRUNCATE / DISABLE RLS in this file.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Additive columns for the cost-of-sales commit path
-- ---------------------------------------------------------------------
alter table public.cost_of_sales
  add column if not exists invoice_no text,
  add column if not exists invoice_value numeric(14,2),
  add column if not exists collection numeric(14,2),
  add column if not exists profit_percentage numeric(5,2);

-- ---------------------------------------------------------------------
-- 2. Replace commit_import_batch() with generated-net_profit aware version
-- ---------------------------------------------------------------------
create or replace function public.commit_import_batch(p_batch_id uuid)
returns table(batch_id uuid, committed_at timestamptz, affected_records integer, inserted_quotations integer, inserted_invoices integer, inserted_cost_of_sales integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_quotations integer := 0;
  v_invoices integer := 0;
  v_costs integer := 0;
  v_affected integer := 0;
  v_net_profit_is_generated boolean := false;
  r record;
  v_id uuid;
  v_company_id uuid;
  v_program_id uuid;
  v_quotation_id uuid;
  v_invoice_id uuid;
  v_po_id uuid;
  v_d text;
  v_status text;
  v_amount numeric;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if public.current_user_role() not in ('super_admin','admin','manager') then raise exception 'IMPORT_FORBIDDEN'; end if;

  select is_generated = 'ALWAYS'
    into v_net_profit_is_generated
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cost_of_sales'
      and column_name = 'net_profit'
    limit 1;
  v_net_profit_is_generated := coalesce(v_net_profit_is_generated, false);

  perform 1 from public.import_batches where id=p_batch_id for update;
  if not found then raise exception 'IMPORT_BATCH_NOT_FOUND'; end if;

  update public.import_batches set status='COMMITTING', started_at=coalesce(started_at,v_now) where id=p_batch_id;

  for r in
    select id, source_type, normalized_data
    from public.import_staging
    where batch_id=p_batch_id
      and validation_status='VALID'
      and matching_status in ('EXACT','ALIAS','COMPOSITE','FUZZY_REVIEW')
      and target_record_id is not null
      and target_table in ('quotations','invoices','cost_of_sales')
    order by source_row_number
    for update
  loop
    if r.target_table='quotations' then
      v_d := r.normalized_data->>'quotation_number';
      if v_d is null or v_d='' then continue; end if;
      v_company_id := null;
      select c.id into v_company_id from public.companies c join public.company_alias_map a on a.company_id=c.id where lower(a.alias_text)=lower(r.normalized_data->>'company_name') limit 1;
      if v_company_id is null then select id into v_company_id from public.companies where lower(canonical_name)=lower(r.normalized_data->>'company_name') limit 1; end if;
      select p.id into v_program_id from public.programs p where lower(p.title)=lower(r.normalized_data->>'project_title') and (v_company_id is null or p.company_id=v_company_id) order by p.created_at desc limit 1;
      if v_program_id is null then continue; end if;
      select id into v_id from public.quotations where quotation_no_raw=v_d order by created_at desc limit 1;
      if v_id is null then
        insert into public.quotations(program_id,quotation_no_raw,quotation_date,final_price,status,prepared_by) values (v_program_id,v_d,(r.normalized_data->>'quotation_date')::date,coalesce((select value::numeric from jsonb_each_text(r.normalized_data->'price_values') limit 1),null),coalesce((r.normalized_data->>'quotation_status')::quotation_status,'DRAFT'::quotation_status),null) returning id into v_id;
        v_quotations := v_quotations+1; v_affected := v_affected+1;
        insert into public.import_commit_log(batch_id,staging_id,target_table,target_record_id,action,committed_at,metadata) values(p_batch_id,r.id,'quotations',v_id,'INSERT',v_now,jsonb_build_object('source_type',r.source_type));
      end if;
      update public.import_staging set target_table='quotations', target_record_id=v_id where id=r.id;

    elsif r.target_table='invoices' then
      v_d := r.normalized_data->>'invoice_number';
      if v_d is null or v_d='' then continue; end if;
      select id into v_id from public.invoices where invoice_no=v_d limit 1;
      if v_id is null then
        select p.id into v_program_id from public.programs p where lower(p.program_code)=lower(r.normalized_data->>'program_code') limit 1;
        if v_program_id is null then
          select p.id into v_program_id from public.programs p join public.companies c on c.id=p.company_id where lower(c.canonical_name)=lower(r.normalized_data->>'company_name') order by p.created_at desc limit 1;
        end if;
        if v_program_id is null then continue; end if;
        select q.id into v_quotation_id from public.quotations q where q.quotation_no_raw=r.normalized_data->>'quotation_number' limit 1;
        select po.id into v_po_id from public.purchase_orders po where po.po_no=r.normalized_data->>'po_number' limit 1;
        v_status := upper(coalesce(r.normalized_data->>'payment_status','UNPAID'));
        if v_status not in ('UNPAID','PARTIAL','PAID','OVERDUE') then v_status := 'UNPAID'; end if;
        v_amount := coalesce((select value::numeric from jsonb_each_text(r.normalized_data->'monetary_values') where key in ('invoice value','invoice amount','invoice value excl sst') limit 1),0);
        insert into public.invoices(program_id,quotation_id,po_id,invoice_no,invoice_date,invoice_value_excl_sst,sst_amount,payment_status,pic) values(v_program_id,v_quotation_id,v_po_id,v_d,(r.normalized_data->>'invoice_date')::date,v_amount,0,v_status::payment_status,null) returning id into v_id;
        v_invoices := v_invoices+1; v_affected := v_affected+1;
        insert into public.import_commit_log(batch_id,staging_id,target_table,target_record_id,action,committed_at,metadata) values(p_batch_id,r.id,'invoices',v_id,'INSERT',v_now,jsonb_build_object('source_type',r.source_type));
      end if;
      update public.import_staging set target_table='invoices', target_record_id=v_id where id=r.id;

    elsif r.target_table='cost_of_sales' then
      v_d := r.normalized_data->>'invoice_number';
      if v_d is null or v_d='' then continue; end if;
      select id into v_invoice_id from public.invoices where invoice_no=v_d limit 1;
      if v_invoice_id is null then continue; end if;
      select id into v_id from public.cost_of_sales where invoice_id=v_invoice_id limit 1;
      if v_id is null then
        if v_net_profit_is_generated then
          -- net_profit is GENERATED: omit it from the INSERT so the generated
          -- expression computes net profit from invoice value and costs.
          insert into public.cost_of_sales(invoice_id,invoice_no,invoice_value,collection,cost_of_sales_amount,mimos_academy_cost,commission,bro_incentive,profit_percentage,had_formula_error,source_file,source_row)
          values(v_invoice_id,v_d,(r.normalized_data->>'invoice_value')::numeric,(r.normalized_data->>'collection')::numeric,(r.normalized_data->>'cost_of_sales_amount')::numeric,(r.normalized_data->>'mimos_academy_cost')::numeric,(r.normalized_data->>'commission')::numeric,(r.normalized_data->>'bro_incentive')::numeric,(r.normalized_data->>'profit_percentage')::numeric,(r.normalized_data->>'had_formula_error')::boolean,coalesce(r.normalized_data->>'source_file',null),null)
          returning id into v_id;
        else
          -- net_profit is a plain mutable column: insert it as before.
          insert into public.cost_of_sales(invoice_id,invoice_no,invoice_value,collection,cost_of_sales_amount,mimos_academy_cost,commission,bro_incentive,net_profit,profit_percentage,had_formula_error,source_file,source_row)
          values(v_invoice_id,v_d,(r.normalized_data->>'invoice_value')::numeric,(r.normalized_data->>'collection')::numeric,(r.normalized_data->>'cost_of_sales_amount')::numeric,(r.normalized_data->>'mimos_academy_cost')::numeric,(r.normalized_data->>'commission')::numeric,(r.normalized_data->>'bro_incentive')::numeric,(r.normalized_data->>'net_profit')::numeric,(r.normalized_data->>'profit_percentage')::numeric,(r.normalized_data->>'had_formula_error')::boolean,coalesce(r.normalized_data->>'source_file',null),null)
          returning id into v_id;
        end if;
        v_costs := v_costs+1; v_affected := v_affected+1;
        insert into public.import_commit_log(batch_id,staging_id,target_table,target_record_id,action,committed_at,metadata) values(p_batch_id,r.id,'cost_of_sales',v_id,'INSERT',v_now,jsonb_build_object('source_type',r.source_type));
      end if;
      update public.import_staging set target_table='cost_of_sales', target_record_id=v_id where id=r.id;
    end if;
  end loop;

  update public.import_batches set status='COMPLETED', imported_rows=v_affected, completed_at=v_now, metadata=metadata || jsonb_build_object('commit_timestamp',v_now,'affected_records',v_affected) where id=p_batch_id;
  return query select p_batch_id,v_now,v_affected,v_quotations,v_invoices,v_costs;
exception when others then
  update public.import_batches set status='FAILED', error_message=sqlerrm where id=p_batch_id;
  raise;
end;
$$;

commit;
