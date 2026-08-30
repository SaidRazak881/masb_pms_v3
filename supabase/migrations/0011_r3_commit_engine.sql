-- =====================================================================
-- 0011: R3 / Sales Pipeline commit engine
-- Applies staged R3 funnel, office_funnel, and sales_report rows into
-- companies -> programs -> pipeline_stage_history.
--
-- Security model: SECURITY DEFINER (trusted import/commit path). It still
-- rejects unauthenticated callers and non-import roles. Never disables RLS.
--
-- No DROP TABLE / DROP COLUMN / TRUNCATE / DISABLE RLS.
-- =====================================================================

create or replace function public.commit_r3_batch(p_batch_id uuid)
returns table(batch_id uuid, committed_at timestamptz, affected_records integer, inserted_companies integer, inserted_programs integer, inserted_stages integer, mismatches integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_companies integer := 0;
  v_programs integer := 0;
  v_stages integer := 0;
  v_mismatches integer := 0;
  v_affected integer := 0;
  r record;
  v_company_id uuid;
  v_program_id uuid;
  v_stage text;
  v_seq integer;
  v_title text;
  v_company text;
  v_forecast numeric;
  v_probability numeric;
  v_status text;
  v_source text;
  v_last_stage text;
  v_desc text;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if public.current_user_role() not in ('super_admin','admin','manager') then raise exception 'IMPORT_FORBIDDEN'; end if;

  perform 1 from public.import_batches where id=p_batch_id for update;
  if not found then raise exception 'IMPORT_BATCH_NOT_FOUND'; end if;

  update public.import_batches set status='COMMITTING', started_at=coalesce(started_at,v_now) where id=p_batch_id;
  v_seq := 0;

  for r in
    select id, source_type, source_row_number, normalized_data
    from public.import_staging
    where batch_id=p_batch_id
      and source_type in ('r3_funnel','office_funnel','sales_report')
      and validation_status='VALID'
    order by source_type, source_row_number
    for update
  loop
    v_title := nullif(trim(r.normalized_data->>'project_title'), '');
    v_company := nullif(trim(r.normalized_data->>'company_name'), '');
    if v_title is null then
      v_title := nullif(trim(r.normalized_data->>'action_item'), '');
    end if;
    if v_company is null then v_company := 'MIMOS Academy'; end if;
    if v_title is null then continue; end if;

    v_seq := v_seq + 1;
    v_source := r.source_type;
    v_status := r.normalized_data->>'status_raw';
    v_stage := r.normalized_data->>'stage';
    v_forecast := (r.normalized_data->>'forecast_value')::numeric;
    v_probability := nullif((r.normalized_data->>'probability')::numeric, 0);

    select id into v_company_id from public.companies
      where lower(canonical_name)=lower(v_company) limit 1;
    if v_company_id is null then
      insert into public.companies(canonical_name, aliases) values(trim(v_company), array[trim(v_company)]) returning id into v_company_id;
      v_companies := v_companies + 1;
    end if;

    select id, current_stage::text into v_program_id, v_last_stage from public.programs
      where lower(title)=lower(v_title) and company_id=v_company_id
      order by created_at desc limit 1;
    if v_program_id is null then
      insert into public.programs(program_code, title, company_id, category, current_stage, forecast_value, probability, sector, needs_review, source_file, source_row, row_hash)
      values(
        'R3-2026-' || lpad(v_seq::text, 4, '0'),
        trim(v_title),
        v_company_id,
        r.normalized_data->>'program_type',
        (r.normalized_data->>'stage')::public.pipeline_stage,
        v_forecast,
        nullif((r.normalized_data->>'probability')::numeric, 0),
        r.normalized_data->>'sector',
        false,
        r.source_type,
        null,
        r.row_hash
      ) returning id, current_stage::text into v_program_id, v_last_stage;
      v_programs := v_programs + 1;
    else
      if v_forecast is not null and v_forecast <> coalesce((select forecast_value from public.programs where id=v_program_id),0) then
        update public.programs set forecast_value=v_forecast,
          probability=coalesce(nullif((r.normalized_data->>'probability')::numeric,0), probability),
          sector=coalesce(r.normalized_data->>'sector', sector),
          updated_at=v_now
        where id=v_program_id;
      end if;
    end if;

    if v_status is not null and v_stage is not null and (v_last_stage is null or v_last_stage <> v_stage) then
      insert into public.pipeline_stage_history(program_id, stage, changed_at, changed_by, note, is_override, override_reason, source_system)
      values(v_program_id, v_stage::public.pipeline_stage, v_now, v_user,
        coalesce('Imported from ' || v_source || ': ' || v_status, null), false, null, v_source);
      v_stages := v_stages + 1;
      update public.programs set current_stage=v_stage::public.pipeline_stage, updated_at=v_now where id=v_program_id;
    end if;

    -- Cross-check from sales_report: compare forecast/weighted against R3.
    if v_source = 'sales_report' then
      v_desc := null;
      select p.forecast_value, p.current_stage::text into v_forecast, v_last_stage
        from public.programs p where p.id=v_program_id;
      if v_forecast is not null and (r.normalized_data->>'forecast_value')::numeric is not null
         and v_forecast <> (r.normalized_data->>'forecast_value')::numeric then
        v_desc := coalesce(v_desc || '; ', '') || 'FORECAST_MISMATCH expected=' || v_forecast || ' source=' || (r.normalized_data->>'forecast_value')::numeric;
      end if;
      if v_desc is not null then
        insert into public.data_quality_exceptions(type, severity, description, related_table, related_id, status)
        values('STATUS_MISMATCH', 'MEDIUM', v_desc, 'programs', v_program_id, 'OPEN');
        v_mismatches := v_mismatches + 1;
      end if;
    end if;

    update public.import_staging
    set matching_status='COMPOSITE', target_table='programs', target_record_id=v_program_id,
      matching_confidence=1, matching_rule=upper(v_source)
    where id=r.id;

    v_affected := v_affected + 1;
  end loop;

  update public.import_batches set status='COMPLETED', imported_rows=v_affected, completed_at=v_now,
    metadata=metadata || jsonb_build_object('commit_timestamp',v_now,'affected_records',v_affected)
  where id=p_batch_id;

  return query select p_batch_id, v_now, v_affected, v_companies, v_programs, v_stages, v_mismatches;
exception when others then
  update public.import_batches set status='FAILED', error_message=sqlerrm where id=p_batch_id;
  raise;
end;
$$;

grant execute on function public.commit_r3_batch(uuid) to authenticated;
