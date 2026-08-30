-- 0006: Matching Resolution Layer
-- Additive only. Adds deterministic domain target columns used by
-- matching-resolution-service.ts (resolveMatchingTargets).
-- On a database where these already exist, this is a no-op.

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
