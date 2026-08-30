-- =====================================================================
-- 0010: R2 commit engine
-- Applies staged R2 Overall rows into companies -> programs ->
-- training_sessions -> participant_counts.
--
-- Security model: SECURITY DEFINER is intentional. This is the trusted Phase 1
-- import/commit path (same pattern as an import worker). It still rejects
-- unauthenticated callers and non-import roles. It never disables RLS.
--
-- No DROP TABLE / DROP COLUMN / TRUNCATE / DISABLE RLS.
-- =====================================================================

create or replace function public.commit_r2_batch(p_batch_id uuid)
returns table(batch_id uuid, committed_at timestamptz, affected_records integer, inserted_companies integer, inserted_programs integer, inserted_sessions integer, inserted_categories integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_companies integer := 0;
  v_programs integer := 0;
  v_sessions integer := 0;
  v_categories integer := 0;
  v_affected integer := 0;
  r record;
  k record;
  v_company_id uuid;
  v_program_id uuid;
  v_session_id uuid;
  v_title text;
  v_company text;
  v_session_type text;
  v_start text;
  v_end text;
  v_duration numeric;
  v_bumi integer;
  v_non integer;
  v_seq integer;
  v_max_total integer;
  v_max_cat text;
  v_cat text;
  v_ws integer;
  v_tr integer;
  v_total integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if public.current_user_role() not in ('super_admin','admin','manager') then raise exception 'IMPORT_FORBIDDEN'; end if;

  perform 1 from public.import_batches where id=p_batch_id for update;
  if not found then raise exception 'IMPORT_BATCH_NOT_FOUND'; end if;

  update public.import_batches set status='COMMITTING', started_at=coalesce(started_at,v_now) where id=p_batch_id;

  v_seq := 0;

  for r in
    select id, source_row_number, normalized_data
    from public.import_staging
    where batch_id=p_batch_id
      and source_type='r2_overall'
      and validation_status='VALID'
    order by source_row_number
    for update
  loop
    v_title := nullif(trim(r.normalized_data->>'training_title'), '');
    v_company := nullif(trim(r.normalized_data->>'company_name'), '');
    v_session_type := nullif(trim(r.normalized_data->>'session_type'), '');
    v_start := nullif(r.normalized_data->>'start_date', '');
    v_end := nullif(r.normalized_data->>'end_date', '');
    v_duration := (r.normalized_data->>'duration_days')::numeric;
    v_bumi := coalesce((r.normalized_data->>'bumiputera_count')::int, 0);
    v_non := coalesce((r.normalized_data->>'non_bumiputera_count')::int, 0);
    v_seq := v_seq + 1;

    if v_title is null then continue; end if;
    if v_company is null then v_company := 'MIMOS Academy'; end if;

    select id into v_company_id from public.companies where lower(canonical_name)=lower(v_company) limit 1;
    if v_company_id is null then
      insert into public.companies(canonical_name, aliases) values(trim(v_company), array[trim(v_company)]) returning id into v_company_id;
      v_companies := v_companies + 1;
    end if;

    select id into v_program_id from public.programs
      where lower(title)=lower(v_title) and company_id=v_company_id
      order by created_at desc limit 1;
    if v_program_id is null then
      insert into public.programs(program_code, title, company_id, category, current_stage, needs_review, source_file, source_row, row_hash)
      values(
        'R2-2026-' || lpad(v_seq::text, 4, '0'),
        trim(v_title),
        v_company_id,
        'Training',
        'TRAINING_COMPLETED',
        false,
        r.normalized_data->>'source_file',
        null,
        r.row_hash
      ) returning id into v_program_id;
      v_programs := v_programs + 1;
    end if;

    select id into v_session_id from public.training_sessions
      where program_id=v_program_id and lower(session_title)=lower(v_title)
      order by created_at desc limit 1;
    if v_session_id is null then
      insert into public.training_sessions(program_id, session_title, session_type, start_date, end_date, duration_days, r2_status, source_file, source_row, row_hash)
      values(v_program_id, trim(v_title), v_session_type, v_start::date, v_end::date, v_duration, 'COMPLETED', r.normalized_data->>'source_file', null, r.row_hash) returning id into v_session_id;
      v_sessions := v_sessions + 1;
    end if;

    -- Find the category with the largest count; assign the overall Bumi/Non
    -- split to that category so vw_r2_overall_report totals stay correct while
    -- retaining per-category workshop/training counts.
    v_max_total := -1;
    v_max_cat := null;
    for k in select * from jsonb_array_elements(coalesce(r.normalized_data->'categories', '[]'::jsonb)) loop
      v_cat := k->>'category';
      v_ws := coalesce((k->>'workshop_count')::int, 0);
      v_tr := coalesce((k->>'training_count')::int, 0);
      v_total := v_ws + v_tr;
      if v_total > v_max_total then v_max_total := v_total; v_max_cat := v_cat; end if;
    end loop;

    for k in select * from jsonb_array_elements(coalesce(r.normalized_data->'categories', '[]'::jsonb)) loop
      v_cat := k->>'category';
      v_ws := coalesce((k->>'workshop_count')::int, 0);
      v_tr := coalesce((k->>'training_count')::int, 0);
      insert into public.participant_counts(training_session_id, category, workshop_count, training_count, bumiputera_count, non_bumiputera_count, source_file, source_row, row_hash)
      values(
        v_session_id,
        v_cat,
        v_ws,
        v_tr,
        case when v_cat=v_max_cat then v_bumi else 0 end,
        case when v_cat=v_max_cat then v_non else 0 end,
        r.normalized_data->>'source_file',
        null,
        r.row_hash
      )
      on conflict (training_session_id, category)
      do update set workshop_count=excluded.workshop_count, training_count=excluded.training_count,
        bumiputera_count=excluded.bumiputera_count, non_bumiputera_count=excluded.non_bumiputera_count,
        row_hash=excluded.row_hash;
      v_categories := v_categories + 1;
      v_affected := v_affected + 1;
    end loop;

    update public.import_staging
    set matching_status='COMPOSITE',
        target_table='training_sessions',
        target_record_id=v_session_id,
        matching_confidence=1,
        matching_rule='R2_SESSION'
    where id=r.id;
  end loop;

  update public.import_batches set status='COMPLETED', imported_rows=v_affected, completed_at=v_now,
    metadata=metadata || jsonb_build_object('commit_timestamp',v_now,'affected_records',v_affected)
  where id=p_batch_id;

  return query select p_batch_id, v_now, v_affected, v_companies, v_programs, v_sessions, v_categories;
exception when others then
  update public.import_batches set status='FAILED', error_message=sqlerrm where id=p_batch_id;
  raise;
end;
$$;

grant execute on function public.commit_r2_batch(uuid) to authenticated;
