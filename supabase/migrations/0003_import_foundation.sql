-- Sprint 2A: import foundation
-- Additive migration. Creates batch/staging boundaries for future import adapters.

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  file_name text not null,
  file_size_bytes bigint,
  content_type text,
  status text not null default 'UPLOADED' check (status in ('UPLOADED','PARSING','STAGED','VALIDATING','MATCHING','READY','COMMITTING','COMPLETED','PARSING_FAILED','VALIDATION_FAILED','MATCHING_FAILED','ROLLED_BACK','CANCELLED','FAILED')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  total_rows integer not null default 0 check (total_rows >= 0),
  staged_rows integer not null default 0 check (staged_rows >= 0),
  valid_rows integer not null default 0 check (valid_rows >= 0),
  warning_rows integer not null default 0 check (warning_rows >= 0),
  error_rows integer not null default 0 check (error_rows >= 0),
  imported_rows integer not null default 0 check (imported_rows >= 0),
  updated_rows integer not null default 0 check (updated_rows >= 0),
  skipped_rows integer not null default 0 check (skipped_rows >= 0),
  exception_rows integer not null default 0 check (exception_rows >= 0),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.import_staging (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  source_type text not null,
  source_row_number integer not null check (source_row_number > 0),
  raw_data jsonb not null default '{}'::jsonb,
  normalized_data jsonb not null default '{}'::jsonb,
  row_hash text not null,
  validation_status text not null default 'PENDING' check (validation_status in ('PENDING','VALID','WARNING','ERROR')),
  matching_status text not null default 'PENDING' check (matching_status in ('PENDING','EXACT','ALIAS','COMPOSITE','FUZZY_REVIEW','AMBIGUOUS','NONE')),
  target_table text,
  target_record_id uuid,
  error_message text,
  warning_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, row_hash)
);

create index if not exists idx_import_batches_status_created_at on public.import_batches(status, created_at desc);
create index if not exists idx_import_batches_source_type_created_at on public.import_batches(source_type, created_at desc);
create index if not exists idx_import_batches_created_by on public.import_batches(created_by);
create index if not exists idx_import_staging_batch_id on public.import_staging(batch_id);
create index if not exists idx_import_staging_source_row on public.import_staging(batch_id, source_row_number);
create index if not exists idx_import_staging_row_hash on public.import_staging(row_hash);
create index if not exists idx_import_staging_validation on public.import_staging(batch_id, validation_status);
create index if not exists idx_import_staging_matching on public.import_staging(batch_id, matching_status);

alter table public.import_batches enable row level security;
alter table public.import_staging enable row level security;

drop policy if exists import_batches_read on public.import_batches;
create policy import_batches_read on public.import_batches for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin','manager')));

drop policy if exists import_batches_insert on public.import_batches;
create policy import_batches_insert on public.import_batches for insert to authenticated
with check (created_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin','manager')));

drop policy if exists import_batches_update on public.import_batches;
create policy import_batches_update on public.import_batches for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin','manager')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin','manager')));

drop policy if exists import_staging_read on public.import_staging;
create policy import_staging_read on public.import_staging for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin','manager')));

drop policy if exists import_staging_insert on public.import_staging;
create policy import_staging_insert on public.import_staging for insert to authenticated
with check (exists (select 1 from public.profiles p join public.import_batches b on b.id = import_staging.batch_id where p.id = auth.uid() and p.role in ('super_admin','admin','manager') and b.created_by = auth.uid()));

drop policy if exists import_staging_update on public.import_staging;
create policy import_staging_update on public.import_staging for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin','manager')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin','manager')));

drop policy if exists import_staging_delete on public.import_staging;
create policy import_staging_delete on public.import_staging for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin','manager')));
