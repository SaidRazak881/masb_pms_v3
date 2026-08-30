-- =====================================================================
-- 0012: R2 participant roster commit engine
-- Applies staged R2 Attendance-list rows into participant_roster.
--
-- Left table  = certified list (No / Name / Cert No / Bumi / Non-Bumi).
-- Right table = actual attendance (Name for Week 1 / Week 2 / Bumi /
--               Non-Bumi).
--
-- When the Attendance-list program title already exists in `programs`
-- (e.g. it was imported from the R2 Overall sheet) the roster is attached
-- to that program/session. Otherwise a standalone session is created and
-- flagged in data_quality_exceptions as an orphan attendance program so it
-- can be reconciled later.
--
-- Additive and idempotent. No DROP TABLE / DROP COLUMN / TRUNCATE /
-- DISABLE RLS.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Provenance columns referenced by commit_r2_batch().
-- ---------------------------------------------------------------------
alter table public.training_sessions
  add column if not exists source_file text,
  add column if not exists source_sheet text,
  add column if not exists source_row int,
  add column if not exists row_hash text;

-- ---------------------------------------------------------------------
-- Additive roster columns + commit key used for idempotent upserts.
-- ---------------------------------------------------------------------
alter table public.participant_roster
  add column if not exists participation_type text not null default 'CERTIFIED'
    check (participation_type in ('CERTIFIED','ATTENDED')),
  add column if not exists week_label text
    check (week_label is null or week_label in ('week1','week2')),
  add column if not exists attendance_date date;

alter table public.participant_roster
  add column if not exists commit_key text
    -- training_session_id + normalized name + participation type + cert + week
    generated always as (
      training_session_id::text || '|' || lower(full_name) || '|' || participation_type || '|' || coalesce(cert_no,'') || '|' || coalesce(week_label,'')
    ) stored;

create unique index if not exists idx_participant_roster_commit_key
  on public.participant_roster(commit_key);

create index if not exists idx_participant_roster_type_week
  on public.participant_roster(participation_type, week_label);

-- ---------------------------------------------------------------------
-- commit_r2_roster(p_batch_id uuid)
-- ---------------------------------------------------------------------
create or replace function public.commit_r2_roster(p_batch_id uuid)
returns table(
  batch_id uuid,
  committed_at timestamptz,
  affected_records integer,
  inserted_roster integer,
  matched_sessions integer,
  created_sessions integer,
  created_programs integer,
  created_exceptions integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_affected integer := 0;
  v_inserted integer := 0;
  v_matched integer := 0;
  v_created_sessions integer := 0;
  v_created_programs integer := 0;
  v_created_exceptions integer := 0;
  r record;
  v_title text;
  v_full_name text;
  v_cert text;
  v_participation text;
  v_week text;
  v_bumi boolean;
  v_company_id uuid;
  v_program_id uuid;
  v_session_id uuid;
  v_roster_id uuid;
  v_sequence integer := 0;
  v_found_in_programs boolean;
  v_was_insert boolean;
  v_program_code text;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if public.current_user_role() not in ('super_admin','admin','manager') then raise exception 'IMPORT_FORBIDDEN'; end if;

  perform 1 from public.import_batches where id = p_batch_id for update;
  if not found then raise exception 'IMPORT_BATCH_NOT_FOUND'; end if;

  update public.import_batches
    set status='COMMITTING', started_at=coalesce(started_at, v_now)
    where id = p_batch_id;

  for r in
    select id, source_type, source_row_number, normalized_data, row_hash
    from public.import_staging
    where batch_id = p_batch_id
      and source_type = 'r2_attendance'
      and validation_status in ('VALID','WARNING')
    order by source_row_number
    for update
  loop
    v_title := nullif(trim(r.normalized_data->>'session_title'), '');
    v_full_name := nullif(trim(r.normalized_data->>'full_name'), '');
    if v_title is null or v_full_name is null then
      update public.import_staging
        set matching_status='NONE', error_message='R2_ATTENDANCE_MISSING_TITLE_OR_NAME'
        where id = r.id;
      continue;
    end if;

    v_cert := nullif(trim(r.normalized_data->>'cert_no'), '');
    v_participation := case
      when r.normalized_data->>'participation_type' = 'ATTENDED' then 'ATTENDED'
      else 'CERTIFIED'
    end;
    v_week := nullif(r.normalized_data->>'week_label', '');
    v_bumi := coalesce((r.normalized_data->>'is_bumiputera')::boolean, false);

    -- Find an existing program/session by title (it may have been created by
    -- commit_r2_batch from the Overall sheet).
    v_found_in_programs := false;
    select p.id, ts.id into v_program_id, v_session_id
    from public.training_sessions ts
    join public.programs p on p.id = ts.program_id
    where lower(ts.session_title) = lower(v_title)
    order by ts.created_at desc, p.created_at desc
    limit 1;

    if found then
      v_found_in_programs := true;
      v_matched := v_matched + 1;
    else
      select id into v_company_id from public.companies
        where lower(canonical_name) = lower('MIMOS Academy')
        limit 1;
      if v_company_id is null then
        insert into public.companies(canonical_name, aliases)
        values ('MIMOS Academy', array['MIMOS Academy'])
        returning id into v_company_id;
      end if;

      v_sequence := v_sequence + 1;
      v_program_code := 'R2-ATT-' || lpad(v_sequence::text, 4, '0');
      insert into public.programs(
        program_code, title, company_id, category, current_stage, needs_review,
        source_sheet, source_row, row_hash
      )
      values (
        v_program_code,
        trim(v_title),
        v_company_id,
        'Training',
        'TRAINING_COMPLETED',
        true,
        'Attendance list',
        r.source_row_number,
        r.row_hash
      )
      returning id into v_program_id;
      v_created_programs := v_created_programs + 1;

      insert into public.training_sessions(
        program_id, session_title, session_type, r2_status, source_sheet, source_row, row_hash
      )
      values (
        v_program_id,
        trim(v_title),
        'Training',
        'PENDING_DATA',
        'Attendance list',
        r.source_row_number,
        r.row_hash
      )
      returning id into v_session_id;
      v_created_sessions := v_created_sessions + 1;

      if not exists (
        select 1 from public.data_quality_exceptions
        where type = 'R2_ATTENDANCE_SESSION_NOT_IN_OVERALL'
          and description = v_title
          and status = 'OPEN'
      ) then
        insert into public.data_quality_exceptions(
          type, severity, description, related_table, related_id, status
        )
        values (
          'R2_ATTENDANCE_SESSION_NOT_IN_OVERALL',
          'WARNING',
          trim(v_title),
          'training_sessions',
          v_session_id,
          'OPEN'
        );
        v_created_exceptions := v_created_exceptions + 1;
      end if;
    end if;

    -- Idempotent upsert keyed on (session, normalized name, type, cert, week).
    insert into public.participant_roster(
      training_session_id, full_name, cert_no, is_bumiputera,
      participation_type, week_label, attendance_date,
      source_sheet, source_row, row_hash
    )
    values (
      v_session_id,
      trim(v_full_name),
      v_cert,
      v_bumi,
      v_participation,
      v_week,
      null,
      'Attendance list',
      r.source_row_number,
      r.row_hash
    )
    on conflict (commit_key) do update set
      full_name = excluded.full_name,
      cert_no = excluded.cert_no,
      is_bumiputera = excluded.is_bumiputera,
      week_label = excluded.week_label,
      source_row = excluded.source_row,
      row_hash = excluded.row_hash
    returning id, (xmax = 0) into v_roster_id, v_was_insert;

    if v_was_insert then
      v_inserted := v_inserted + 1;
    end if;
    v_affected := v_affected + 1;

    insert into public.import_commit_log(
      batch_id, staging_id, target_table, target_record_id, action, committed_at, metadata
    ) values (
      p_batch_id,
      r.id,
      'participant_roster',
      v_roster_id,
      case when v_was_insert then 'INSERT' else 'UPDATE' end,
      v_now,
      jsonb_build_object(
        'source_type', 'r2_attendance',
        'participation_type', v_participation,
        'week_label', v_week,
        'session_title', v_title,
        'matched_to_existing_program', v_found_in_programs
      )
    );

    update public.import_staging
      set matching_status='COMPOSITE',
          target_table='participant_roster',
          target_record_id=v_roster_id,
          matching_confidence=1,
          matching_rule='R2_ATTENDANCE_ROSTER',
          metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
            'committed_at', v_now,
            'participation_type', v_participation,
            'week_label', v_week,
            'session_title', v_title
          )
      where id = r.id;
  end loop;

  update public.import_batches
    set status='COMPLETED',
        imported_rows = imported_rows + v_inserted,
        exception_rows = exception_rows + v_created_exceptions,
        completed_at=v_now,
        metadata = metadata || jsonb_build_object(
          'commit_timestamp', v_now,
          'commit_engine', 'commit_r2_roster',
          'affected_records', v_affected,
          'inserted_roster', v_inserted,
          'matched_sessions', v_matched,
          'created_sessions', v_created_sessions,
          'created_programs', v_created_programs,
          'created_exceptions', v_created_exceptions
        )
    where id = p_batch_id;

  return query select p_batch_id, v_now, v_affected, v_inserted, v_matched,
    v_created_sessions, v_created_programs, v_created_exceptions;

exception when others then
  update public.import_batches set status='FAILED', error_message=sqlerrm where id=p_batch_id;
  raise;
end;
$$;

grant execute on function public.commit_r2_roster(uuid) to authenticated;
