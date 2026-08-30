-- =====================================================================
-- 0013: R2 roster consistency audit
-- Compares committed participant_roster against the Overall report
-- (participant_counts) for the sessions touched by an R2 batch and
-- creates OPEN data_quality_exceptions when counts or Bumi/Non-Bumi
-- demographics disagree.
--
-- Additive and idempotent. Does not change commit_r2_roster(), which keeps
-- its existing return contract.
-- =====================================================================

create or replace function public.audit_r2_roster(p_batch_id uuid)
returns table(
  batch_id uuid,
  audited_at timestamptz,
  checked_sessions integer,
  mismatch_sessions integer,
  created_exceptions integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_checked integer := 0;
  v_mismatch integer := 0;
  v_created integer := 0;
  v_session_id uuid;
  v_title text;
  v_baseline_total integer;
  v_baseline_bumi integer;
  v_baseline_non integer;
  v_cert integer;
  v_att integer;
  v_roster_total integer;
  v_roster_bumi integer;
  v_roster_non integer;
  v_count_mismatch boolean;
  v_demo_mismatch boolean;
  r record;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if public.current_user_role() not in ('super_admin','admin','manager') then raise exception 'IMPORT_FORBIDDEN'; end if;

  perform 1 from public.import_batches where id = p_batch_id;
  if not found then raise exception 'IMPORT_BATCH_NOT_FOUND'; end if;

  -- Only sessions whose roster rows were committed through this batch.
  for r in
    select distinct ts.id as session_id
    from public.import_commit_log cl
    join public.participant_roster pr on pr.id = cl.target_record_id
    join public.training_sessions ts on ts.id = pr.training_session_id
    where cl.batch_id = p_batch_id
      and cl.target_table = 'participant_roster'
  loop
    v_session_id := r.session_id;

    select
      ts.session_title,
      coalesce(sum(pc.workshop_count + pc.training_count), 0),
      coalesce(sum(pc.bumiputera_count), 0),
      coalesce(sum(pc.non_bumiputera_count), 0)
    into v_title, v_baseline_total, v_baseline_bumi, v_baseline_non
    from public.training_sessions ts
    left join public.participant_counts pc on pc.training_session_id = ts.id
    where ts.id = v_session_id
    group by ts.session_title;

    -- Sessions with no Overall baseline are already covered by
    -- R2_ATTENDANCE_SESSION_NOT_IN_OVERALL; do not double-report here.
    if v_baseline_total = 0 then
      continue;
    end if;

    select
      count(*) filter (where participation_type = 'CERTIFIED'),
      count(*) filter (where participation_type = 'ATTENDED'),
      count(*) filter (where is_bumiputera = true),
      count(*) filter (where is_bumiputera = false)
    into v_cert, v_att, v_roster_bumi, v_roster_non
    from public.participant_roster
    where training_session_id = v_session_id;

    -- Certified list is the primary roster. If a session only tracked actual
    -- attendance records, use those as the comparable set.
    v_roster_total := case when coalesce(v_cert, 0) > 0 then v_cert else coalesce(v_att, 0) end;

    v_checked := v_checked + 1;
    v_count_mismatch := v_roster_total > 0 and v_roster_total <> v_baseline_total;
    v_demo_mismatch := v_roster_total > 0
      and (coalesce(v_roster_bumi, 0) + coalesce(v_roster_non, 0)) > 0
      and (coalesce(v_roster_bumi, 0) <> v_baseline_bumi or coalesce(v_roster_non, 0) <> v_baseline_non);

    if v_count_mismatch then
      v_mismatch := v_mismatch + 1;
      if not exists (
        select 1 from public.data_quality_exceptions
        where type = 'R2_ROSTER_COUNT_MISMATCH'
          and related_id = v_session_id
          and status = 'OPEN'
      ) then
        insert into public.data_quality_exceptions(
          type, severity, description, related_table, related_id, status
        )
        values (
          'R2_ROSTER_COUNT_MISMATCH',
          'MED',
          'R2 roster count mismatch: ' || v_title || ' (expected ' || v_baseline_total || ', roster ' || v_roster_total || ')',
          'training_sessions',
          v_session_id,
          'OPEN'
        );
        v_created := v_created + 1;
      end if;
    end if;

    if v_demo_mismatch then
      if not v_count_mismatch then
        v_mismatch := v_mismatch + 1;
      end if;
      if not exists (
        select 1 from public.data_quality_exceptions
        where type = 'R2_ROSTER_DEMOGRAPHIC_MISMATCH'
          and related_id = v_session_id
          and status = 'OPEN'
      ) then
        insert into public.data_quality_exceptions(
          type, severity, description, related_table, related_id, status
        )
        values (
          'R2_ROSTER_DEMOGRAPHIC_MISMATCH',
          'MED',
          'R2 roster demographic mismatch: ' || v_title || ' (expected Bumi/Non-Bumi ' || v_baseline_bumi || '/' || v_baseline_non || ', roster ' || coalesce(v_roster_bumi,0) || '/' || coalesce(v_roster_non,0) || ')',
          'training_sessions',
          v_session_id,
          'OPEN'
        );
        v_created := v_created + 1;
      end if;
    end if;
  end loop;

  update public.import_batches
    set metadata = metadata || jsonb_build_object(
      'audit_timestamp', v_now,
      'audit_engine', 'audit_r2_roster',
      'checked_sessions', v_checked,
      'mismatch_sessions', v_mismatch,
      'audit_exceptions', v_created
    )
    where id = p_batch_id;

  return query select p_batch_id, v_now, v_checked, v_mismatch, v_created;
end;
$$;

grant execute on function public.audit_r2_roster(uuid) to authenticated;
