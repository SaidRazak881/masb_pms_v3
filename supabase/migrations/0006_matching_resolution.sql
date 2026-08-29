-- 0006: Matching Resolution Layer
-- Additive only. Stores the deterministic domain target selected from a matched
-- staging row. Existing target columns are retained for Sprint 3A compatibility.

alter table public.import_staging
  add column if not exists matching_confidence numeric(5,4),
  add column if not exists matching_rule text;

create index if not exists import_staging_target_idx
  on public.import_staging(target_table, target_record_id);

create index if not exists import_staging_matching_idx
  on public.import_staging(batch_id, matching_status, validation_status);

comment on column public.import_staging.matching_confidence is
  'Deterministic resolution confidence from 0.00 to 1.00.';
comment on column public.import_staging.matching_rule is
  'Deterministic matching/resolution rule used for the domain target.';
