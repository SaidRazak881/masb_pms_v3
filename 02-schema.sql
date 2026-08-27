-- =====================================================================
-- Sistem Pengurusan R1/R2/R3 MIMOS Academy — Production Schema
-- Target: Supabase (Postgres 15)
-- Run via: supabase db push   (place in supabase/migrations/0001_init.sql)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";    -- fuzzy company/title matching

-- ---------------------------------------------------------------------
-- 1. Enums (canonical vocabularies)
-- ---------------------------------------------------------------------
create type user_role as enum ('super_admin','admin','manager','pic','viewer');

create type client_category as enum ('GOVERNMENT','CORPORATE','INTERNAL','FOC','GLC','INDUSTRY');

create type pipeline_stage as enum (
  'LEAD_REGISTERED','PROPOSAL_SUBMITTED','QUOTATION_APPROVED',
  'PO_RECEIVED','INVOICED','PAID','TRAINING_COMPLETED','LOST'
);

create type quotation_status as enum ('DRAFT','SENT','PENDING','APPROVED','REJECTED','EXPIRED');

create type payment_status as enum ('UNPAID','PARTIAL','PAID','OVERDUE');

create type r2_status as enum ('COMPLETED','PENDING_DATA','UPCOMING');

create type participant_category as enum ('WAFER_FAB','FA_MA','AI','OTHERS');

create type training_type as enum ('PUBLIC','IN_HOUSE','CERT_PRINTING','SPACE_RENTAL');

create type import_batch_status as enum ('uploaded','parsing','staged','matching','ready_for_review','committed','failed');

create type staging_match_status as enum ('new','matched','low_confidence','exception');

create type exception_type as enum (
  'STATUS_MISMATCH','DUPLICATE_RECORD','UNMATCHED_INVOICE','MISSING_PO',
  'CLIENT_ALIAS','FORMULA_ERROR','COLUMN_SHIFT','LOW_CONFIDENCE_MATCH'
);

create type exception_status as enum ('OPEN','RESOLVED','IGNORED');

create type audit_action as enum ('INSERT','UPDATE','DELETE');

-- ---------------------------------------------------------------------
-- 2. Identity
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role user_role not null default 'viewer',
  pic_display_name text,              -- links to legacy "PIC - Full Name" strings
  is_active boolean not null default true,
  must_reset_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Extends auth.users. Seeded from User_Profiles_Mapping.xlsx — passwords are NEVER migrated, invite-only.';

-- ---------------------------------------------------------------------
-- 3. Master data / golden records
-- ---------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  aliases text[] not null default '{}',
  client_category client_category,
  sector text,
  is_merged_into uuid references public.companies(id),  -- non-null if this row was merged away
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_companies_name_trgm on public.companies using gin (canonical_name gin_trgm_ops);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  designation text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.status_dictionary (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,        -- 'r3' | 'office_funnel' | 'r1' | 'quotation_tracker' ...
  entity_type text not null,          -- 'funnel_stage' | 'payment_status' | 'quotation_status'
  raw_value text not null,
  canonical_value text not null,
  created_at timestamptz not null default now(),
  unique (source_system, entity_type, raw_value)
);

-- ---------------------------------------------------------------------
-- 4. The chain: programs (spine) + children
-- ---------------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  program_code text not null unique,          -- e.g. PRG-2026-0042
  title text not null,
  company_id uuid not null references public.companies(id),
  category text,                               -- Training / Consultancy / Service / MyDID / Others
  training_type training_type,
  current_stage pipeline_stage not null default 'LEAD_REGISTERED',
  client_category client_category,
  sector text,
  pic_user_id uuid references public.profiles(id),
  account_manager_user_id uuid references public.profiles(id),
  lead_date date,
  forecast_value numeric(14,2),
  probability numeric(4,3),                    -- 0.000 - 1.000
  weighted_value numeric(14,2) generated always as
    (round(coalesce(forecast_value,0) * coalesce(probability,0), 2)) stored,
  needs_review boolean not null default false,  -- set by low-confidence import matches
  source_file text,
  source_sheet text,
  source_row int,
  row_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_programs_company on public.programs(company_id);
create index idx_programs_pic on public.programs(pic_user_id);
create index idx_programs_stage on public.programs(current_stage);
create index idx_programs_title_trgm on public.programs using gin (title gin_trgm_ops);

create table public.pipeline_stage_history (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  stage pipeline_stage not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references public.profiles(id),
  note text,
  is_override boolean not null default false,
  override_reason text,
  source_system text                            -- 'r3' | 'office_funnel' | 'manual'
);
create index idx_stage_history_program on public.pipeline_stage_history(program_id);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  quotation_no_raw text not null,
  quotation_series text,                        -- MSSB / MASB / MA
  quotation_year int,
  quotation_seq int,
  revision_no int not null default 0,
  quotation_no_normalized text generated always as
    (coalesce(quotation_series,'') || '/' || coalesce(quotation_year::text,'') || '/' ||
     coalesce(quotation_seq::text,'') || '/REV' || revision_no::text) stored,
  quotation_date date,
  duration_days numeric(6,2),
  no_of_unit numeric(10,2),
  unit_price_excl_sst numeric(14,2),
  unit_price_incl_sst numeric(14,2),
  total_price_excl_sst numeric(14,2),
  sst_amount numeric(14,2),
  total_price_incl_sst numeric(14,2),
  discount_pct numeric(5,2),
  final_price numeric(14,2),
  status quotation_status not null default 'DRAFT',
  prepared_by text,
  source_file text, source_sheet text, source_row int, row_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quotation_no_raw, revision_no, source_file)
);
create index idx_quotations_program on public.quotations(program_id);
create index idx_quotations_normalized on public.quotations(quotation_no_normalized);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  quotation_id uuid references public.quotations(id),
  po_no text,
  po_date date,
  po_value numeric(14,2),
  source_file text, source_sheet text, source_row int, row_hash text,
  created_at timestamptz not null default now()
);
create index idx_po_program on public.purchase_orders(program_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  quotation_id uuid references public.quotations(id),
  po_id uuid references public.purchase_orders(id),
  invoice_no text not null,
  invoice_date date,
  invoice_value_excl_sst numeric(14,2) not null default 0,
  sst_amount numeric(14,2) not null default 0,
  total_value numeric(14,2) generated always as (invoice_value_excl_sst + sst_amount) stored,
  payment_terms_days int default 30,
  due_date date generated always as (invoice_date + (coalesce(payment_terms_days,30) || ' days')::interval) stored,
  payment_status payment_status not null default 'UNPAID',
  payment_method text,
  account text,                                  -- MSSB / MASB
  days_outstanding int generated always as (
    case
      when payment_status = 'PAID' then 0
      else greatest(0, (current_date - due_date))
    end
  ) stored,
  account_manager text,
  pic text,
  remark text,
  source_file text, source_sheet text, source_row int, row_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invoice_no, source_file)
);
create index idx_invoices_program on public.invoices(program_id);
create index idx_invoices_payment_status on public.invoices(payment_status);
create index idx_invoices_due_date on public.invoices(due_date);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(14,2) not null,
  payment_date date not null default current_date,
  method text,
  reference_no text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index idx_payments_invoice on public.payments(invoice_id);

create table public.cost_of_sales (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  cost_of_sales_amount numeric(14,2) not null default 0,
  mimos_academy_cost numeric(14,2) not null default 0,
  commission numeric(14,2) not null default 0,
  bro_incentive numeric(14,2) not null default 0,
  net_profit numeric(14,2) generated always as (
    coalesce((select i.invoice_value_excl_sst from public.invoices i where i.id = invoice_id), 0)
    - cost_of_sales_amount - mimos_academy_cost - commission - bro_incentive
  ) stored,
  had_formula_error boolean not null default false,   -- true if source had #REF!/#NAME?
  source_file text, source_sheet text, source_row int, row_hash text,
  created_at timestamptz not null default now(),
  unique (invoice_id, source_file)
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  session_title text not null,
  session_type training_type,
  start_date date,
  end_date date,
  venue text,
  duration_days numeric(6,2),
  r2_status r2_status not null default 'UPCOMING',
  source_file text, source_sheet text, source_row int, row_hash text,
  created_at timestamptz not null default now()
);
create index idx_training_program on public.training_sessions(program_id);

create table public.participant_counts (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references public.training_sessions(id) on delete cascade,
  category participant_category not null default 'OTHERS',
  bumiputera_count int not null default 0,
  non_bumiputera_count int not null default 0,
  total_count int generated always as (bumiputera_count + non_bumiputera_count) stored,
  source_file text, source_sheet text, source_row int, row_hash text,
  unique (training_session_id, category, source_file)
);

create table public.participant_roster (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references public.training_sessions(id) on delete cascade,
  full_name text not null,
  cert_no text,
  is_bumiputera boolean,
  source_file text, source_sheet text, source_row int, row_hash text
);

-- ---------------------------------------------------------------------
-- 5. Import engine & data quality
-- ---------------------------------------------------------------------
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles(id),
  status import_batch_status not null default 'uploaded',
  total_rows int not null default 0,
  new_records int not null default 0,
  updated_records int not null default 0,
  rejected_rows int not null default 0,
  error_summary jsonb,
  created_at timestamptz not null default now(),
  committed_at timestamptz
);

create table public.import_staging (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  source_sheet text not null,
  source_row int not null,
  raw_json jsonb not null,
  normalized_json jsonb,
  row_hash text not null,
  match_status staging_match_status not null default 'new',
  match_confidence numeric(4,3),
  target_table text,
  target_id uuid,
  error_message text,
  created_at timestamptz not null default now(),
  unique (import_batch_id, source_sheet, source_row, row_hash)
);
create index idx_staging_batch on public.import_staging(import_batch_id);
create index idx_staging_match_status on public.import_staging(match_status);

create table public.data_quality_exceptions (
  id uuid primary key default gen_random_uuid(),
  type exception_type not null,
  severity text not null default 'MED',        -- HIGH / MED / LOW
  description text not null,
  related_table text,
  related_id uuid,
  status exception_status not null default 'OPEN',
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);
create index idx_exceptions_status on public.data_quality_exceptions(status);

create table public.company_alias_map (
  id uuid primary key default gen_random_uuid(),
  alias_text text not null unique,
  company_id uuid not null references public.companies(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. Audit log (generic, trigger-populated)
-- ---------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action audit_action not null,
  old_value jsonb,
  new_value jsonb,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now(),
  source text default 'app'                    -- 'app' | 'import' | 'system'
);
create index idx_audit_table_record on public.audit_log(table_name, record_id);

create or replace function public.fn_audit_trigger() returns trigger as $$
begin
  if (tg_op = 'UPDATE') then
    insert into public.audit_log(table_name, record_id, action, old_value, new_value, changed_by)
    values (tg_table_name, new.id, 'UPDATE', to_jsonb(old), to_jsonb(new), auth.uid());
    return new;
  elsif (tg_op = 'INSERT') then
    insert into public.audit_log(table_name, record_id, action, new_value, changed_by)
    values (tg_table_name, new.id, 'INSERT', to_jsonb(new), auth.uid());
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.audit_log(table_name, record_id, action, old_value, changed_by)
    values (tg_table_name, old.id, 'DELETE', to_jsonb(old), auth.uid());
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

do $$
declare t text;
begin
  foreach t in array array['programs','quotations','purchase_orders','invoices','payments',
                            'cost_of_sales','training_sessions','companies']
  loop
    execute format('create trigger trg_audit_%1$s after insert or update or delete on public.%1$s
                     for each row execute function public.fn_audit_trigger();', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7. Generated report views (R1 / R2 / R3 / Action Center)
-- ---------------------------------------------------------------------
create or replace view public.vw_r1_income_statement as
select
  p.program_code, c.canonical_name as company_name, p.title,
  i.invoice_no, i.invoice_date, i.total_value, i.payment_status,
  i.due_date, i.days_outstanding, i.account, i.pic,
  cos.cost_of_sales_amount, cos.net_profit,
  case when i.invoice_value_excl_sst > 0
       then round(cos.net_profit / i.invoice_value_excl_sst * 100, 2)
       else null end as profit_pct
from public.invoices i
join public.programs p on p.id = i.program_id
join public.companies c on c.id = p.company_id
left join public.cost_of_sales cos on cos.invoice_id = i.id;

create or replace view public.vw_r2_overall_report as
select
  p.program_code, ts.session_title, c.canonical_name as company_name,
  ts.session_type, ts.start_date, ts.end_date, ts.r2_status,
  pc.category, pc.bumiputera_count, pc.non_bumiputera_count, pc.total_count
from public.training_sessions ts
join public.programs p on p.id = ts.program_id
join public.companies c on c.id = p.company_id
left join public.participant_counts pc on pc.training_session_id = ts.id;

create or replace view public.vw_r3_sales_funnel as
select
  p.program_code, c.canonical_name as company_name, p.title,
  p.current_stage, p.forecast_value, p.probability, p.weighted_value,
  p.pic_user_id, p.sector, p.lead_date,
  (select po.po_value from public.purchase_orders po where po.program_id = p.id limit 1) as secured_value
from public.programs p
join public.companies c on c.id = p.company_id
where p.current_stage <> 'LOST';

create or replace view public.vw_action_required as
select 'OVERDUE_INVOICE' as category, i.id as record_id, p.program_code,
       c.canonical_name as company_name, i.total_value as amount,
       i.days_outstanding, i.pic, 'HIGH' as priority
from public.invoices i
join public.programs p on p.id = i.program_id
join public.companies c on c.id = p.company_id
where i.payment_status <> 'PAID' and i.days_outstanding > 30
union all
select 'PENDING_QUOTATION', q.id, p.program_code, c.canonical_name,
       q.final_price, (current_date - q.quotation_date)::int, q.prepared_by,
       case when (current_date - q.quotation_date) > 30 then 'HIGH' else 'MED' end
from public.quotations q
join public.programs p on p.id = q.program_id
join public.companies c on c.id = p.company_id
where q.status in ('SENT','PENDING') and (current_date - q.quotation_date) > 14
union all
select 'INCOMPLETE_R2', ts.id, p.program_code, c.canonical_name, null,
       (current_date - ts.end_date)::int, null, 'MED'
from public.training_sessions ts
join public.programs p on p.id = ts.program_id
join public.companies c on c.id = p.company_id
where ts.r2_status = 'PENDING_DATA' and ts.end_date < current_date
union all
select 'DATA_EXCEPTION', dqe.id, null, null, null, null, null,
       dqe.severity
from public.data_quality_exceptions dqe
where dqe.status = 'OPEN';

-- ---------------------------------------------------------------------
-- 8. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.status_dictionary enable row level security;
alter table public.programs enable row level security;
alter table public.pipeline_stage_history enable row level security;
alter table public.quotations enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.cost_of_sales enable row level security;
alter table public.training_sessions enable row level security;
alter table public.participant_counts enable row level security;
alter table public.participant_roster enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_staging enable row level security;
alter table public.data_quality_exceptions enable row level security;
alter table public.company_alias_map enable row level security;
alter table public.audit_log enable row level security;

-- helper: current user's role from JWT claim (set via custom_access_token_hook)
create or replace function public.current_role() returns text as $$
  select coalesce(auth.jwt() ->> 'role', 'viewer');
$$ language sql stable;

-- profiles: users see themselves; admins see all
create policy "profiles_self_or_admin" on public.profiles for select
  using (id = auth.uid() or public.current_role() in ('super_admin','admin','manager'));
create policy "profiles_admin_write" on public.profiles for update
  using (public.current_role() in ('super_admin','admin') or id = auth.uid());

-- companies / contacts / status_dictionary: readable by all authenticated, write by admin+
create policy "companies_read_all" on public.companies for select using (auth.role() = 'authenticated');
create policy "companies_write_admin" on public.companies for insert with check (public.current_role() in ('super_admin','admin'));
create policy "companies_update_admin" on public.companies for update using (public.current_role() in ('super_admin','admin'));

create policy "contacts_read_all" on public.contacts for select using (auth.role() = 'authenticated');
create policy "contacts_write_admin" on public.contacts for all using (public.current_role() in ('super_admin','admin','pic'));

create policy "status_dict_read_all" on public.status_dictionary for select using (auth.role() = 'authenticated');
create policy "status_dict_write_admin" on public.status_dictionary for all using (public.current_role() in ('super_admin','admin'));

-- programs: PIC scoping pattern (applied consistently across the chain)
create policy "programs_read" on public.programs for select
  using (
    public.current_role() in ('super_admin','admin','manager','viewer')
    or pic_user_id = auth.uid() or account_manager_user_id = auth.uid()
  );
create policy "programs_write_admin_or_owner" on public.programs for insert
  with check (public.current_role() in ('super_admin','admin','pic'));
create policy "programs_update_admin_or_owner" on public.programs for update
  using (public.current_role() in ('super_admin','admin') or pic_user_id = auth.uid());

create policy "stage_history_read" on public.pipeline_stage_history for select using (auth.role() = 'authenticated');
create policy "stage_history_write" on public.pipeline_stage_history for insert
  with check (public.current_role() in ('super_admin','admin','pic','manager'));

-- quotations / PO: PIC can manage their own program's docs; read is broad
create policy "quotations_read" on public.quotations for select using (auth.role() = 'authenticated');
create policy "quotations_write" on public.quotations for all
  using (
    public.current_role() in ('super_admin','admin')
    or exists (select 1 from public.programs p where p.id = program_id and p.pic_user_id = auth.uid())
  );

create policy "po_read" on public.purchase_orders for select using (auth.role() = 'authenticated');
create policy "po_write" on public.purchase_orders for all
  using (public.current_role() in ('super_admin','admin','pic'));

-- financial tables: read broad, write restricted to admin (PIC can only insert payments via action)
create policy "invoices_read" on public.invoices for select using (auth.role() = 'authenticated');
create policy "invoices_write_admin" on public.invoices for all
  using (public.current_role() in ('super_admin','admin'));

create policy "payments_read" on public.payments for select using (auth.role() = 'authenticated');
create policy "payments_insert_pic_or_admin" on public.payments for insert
  with check (public.current_role() in ('super_admin','admin','pic'));
create policy "payments_update_admin" on public.payments for update
  using (public.current_role() in ('super_admin','admin'));

create policy "cos_read_admin_manager" on public.cost_of_sales for select
  using (public.current_role() in ('super_admin','admin','manager'));
create policy "cos_write_admin" on public.cost_of_sales for all
  using (public.current_role() in ('super_admin','admin'));

-- training / R2
create policy "training_read" on public.training_sessions for select using (auth.role() = 'authenticated');
create policy "training_write" on public.training_sessions for all
  using (public.current_role() in ('super_admin','admin','pic'));

create policy "participant_counts_read" on public.participant_counts for select using (auth.role() = 'authenticated');
create policy "participant_counts_write" on public.participant_counts for all
  using (public.current_role() in ('super_admin','admin','pic'));

create policy "roster_read" on public.participant_roster for select
  using (public.current_role() in ('super_admin','admin','manager','pic'));
create policy "roster_write" on public.participant_roster for all
  using (public.current_role() in ('super_admin','admin','pic'));

-- import & data quality
create policy "import_batches_rw" on public.import_batches for all
  using (public.current_role() in ('super_admin','admin','pic'));
create policy "import_staging_rw" on public.import_staging for all
  using (public.current_role() in ('super_admin','admin','pic'));
create policy "exceptions_read" on public.data_quality_exceptions for select using (auth.role() = 'authenticated');
create policy "exceptions_write" on public.data_quality_exceptions for all
  using (public.current_role() in ('super_admin','admin','manager'));
create policy "alias_map_rw" on public.company_alias_map for all
  using (public.current_role() in ('super_admin','admin'));

-- audit log: read-only, admin+manager
create policy "audit_read_admin" on public.audit_log for select
  using (public.current_role() in ('super_admin','admin','manager'));

-- =====================================================================
-- End of schema
-- =====================================================================
