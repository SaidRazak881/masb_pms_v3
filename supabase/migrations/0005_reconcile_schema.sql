-- =====================================================================
-- 0005: Reconcile schema with the application code
-- Additive + idempotent. Safe to run on top of 0001-0004.
--
-- Why: several tables/views referenced by the app and by the
-- commit_import_batch() + rollback_import_batch() functions (migration
-- 0004) were never created in the applied migration set:
--   * cost_of_sales           — insert target of commit_import_batch()
--   * company_alias_map       — joined by commit_import_batch()
--   * participant_counts      — rows for vw_r2_overall_report
--   * participant_roster      — individual attendee rows for R2
--   * contacts                — master-data contacts (blueprint 2.2)
--   * status_dictionary       — controlled vocabulary (blueprint 2.2)
--   * vw_r1_income_statement  — generated R1 read-model (blueprint 2.5)
--   * vw_r2_overall_report    — generated R2 read-model (blueprint 2.5)
-- =====================================================================

-- ---------------------------------------------------------------------
-- cost_of_sales: one row per invoice. Column names match the INSERT in
-- public.commit_import_batch() and the CostOfSalesParser normalized shape.
-- ---------------------------------------------------------------------
create table if not exists public.cost_of_sales (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  invoice_no text,
  invoice_value numeric(14,2),
  collection numeric(14,2),
  cost_of_sales_amount numeric(14,2) not null default 0,
  mimos_academy_cost numeric(14,2) not null default 0,
  commission numeric(14,2) not null default 0,
  bro_incentive numeric(14,2) not null default 0,
  net_profit numeric(14,2),
  profit_percentage numeric(5,2),
  had_formula_error boolean not null default false,
  source_file text,
  source_row int,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_cost_of_sales_invoice on public.cost_of_sales(invoice_id);
create index if not exists idx_cost_of_sales_invoice_no on public.cost_of_sales(invoice_no);

-- ---------------------------------------------------------------------
-- company_alias_map: alias -> canonical company (used by commit engine)
-- ---------------------------------------------------------------------
create table if not exists public.company_alias_map (
  id uuid primary key default gen_random_uuid(),
  alias_text text not null unique,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_company_alias_map_company on public.company_alias_map(company_id);

-- ---------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  designation text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);
create index if not exists idx_contacts_company on public.contacts(company_id);

-- ---------------------------------------------------------------------
-- status_dictionary: canonical status mapping per source system/entity
-- ---------------------------------------------------------------------
create table if not exists public.status_dictionary (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,
  entity_type text not null,
  raw_value text not null,
  canonical_value text not null,
  created_at timestamptz not null default now(),
  unique (source_system, entity_type, raw_value)
);

-- ---------------------------------------------------------------------
-- participant_counts: Bumi / Non-Bumi per R2 category per session
-- ---------------------------------------------------------------------
create table if not exists public.participant_counts (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references public.training_sessions(id) on delete cascade,
  category text not null default 'OTHERS',
  bumiputera_count int not null default 0 check (bumiputera_count >= 0),
  non_bumiputera_count int not null default 0 check (non_bumiputera_count >= 0),
  total_count int generated always as (bumiputera_count + non_bumiputera_count) stored,
  source_file text,
  source_sheet text,
  source_row int,
  row_hash text,
  created_at timestamptz not null default now(),
  unique (training_session_id, category)
);
create index if not exists idx_participant_counts_session on public.participant_counts(training_session_id);

-- ---------------------------------------------------------------------
-- participant_roster: individual attendee rows for certificate tracking
-- ---------------------------------------------------------------------
create table if not exists public.participant_roster (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references public.training_sessions(id) on delete cascade,
  full_name text not null,
  cert_no text,
  is_bumiputera boolean,
  source_file text,
  source_sheet text,
  source_row int,
  row_hash text,
  created_at timestamptz not null default now()
);
create index if not exists idx_participant_roster_session on public.participant_roster(training_session_id);

-- ---------------------------------------------------------------------
-- Row Level Security on the new tables
-- ---------------------------------------------------------------------
alter table public.cost_of_sales enable row level security;
alter table public.company_alias_map enable row level security;
alter table public.contacts enable row level security;
alter table public.status_dictionary enable row level security;
alter table public.participant_counts enable row level security;
alter table public.participant_roster enable row level security;

-- cost_of_sales: read by elevated roles (needed for the security-invoker
-- commit function and the R1 view); write restricted to admin+.
drop policy if exists cost_of_sales_read on public.cost_of_sales;
create policy cost_of_sales_read on public.cost_of_sales for select to authenticated
  using (public.current_user_role() in ('super_admin','admin','manager','viewer'));
drop policy if exists cost_of_sales_write on public.cost_of_sales;
create policy cost_of_sales_write on public.cost_of_sales for all to authenticated
  using (public.current_user_role() in ('super_admin','admin'))
  with check (public.current_user_role() in ('super_admin','admin'));

-- company_alias_map: readable by elevated roles (commit engine runs as the
-- invoking admin/manager); write restricted to admin+.
drop policy if exists company_alias_map_read on public.company_alias_map;
create policy company_alias_map_read on public.company_alias_map for select to authenticated
  using (public.current_user_role() in ('super_admin','admin','manager'));
drop policy if exists company_alias_map_write on public.company_alias_map;
create policy company_alias_map_write on public.company_alias_map for all to authenticated
  using (public.current_user_role() in ('super_admin','admin'))
  with check (public.current_user_role() in ('super_admin','admin'));

-- contacts: readable by all authenticated; write by admin/pic.
drop policy if exists contacts_read on public.contacts;
create policy contacts_read on public.contacts for select to authenticated using (auth.role() = 'authenticated');
drop policy if exists contacts_write on public.contacts;
create policy contacts_write on public.contacts for all to authenticated
  using (public.current_user_role() in ('super_admin','admin','pic'))
  with check (public.current_user_role() in ('super_admin','admin','pic'));

-- status_dictionary: readable by all authenticated; write by admin+.
drop policy if exists status_dictionary_read on public.status_dictionary;
create policy status_dictionary_read on public.status_dictionary for select to authenticated using (auth.role() = 'authenticated');
drop policy if exists status_dictionary_write on public.status_dictionary;
create policy status_dictionary_write on public.status_dictionary for all to authenticated
  using (public.current_user_role() in ('super_admin','admin'))
  with check (public.current_user_role() in ('super_admin','admin'));

-- participant_counts / participant_roster: read by elevated roles + pic;
-- write restricted to admin/pic.
drop policy if exists participant_counts_read on public.participant_counts;
create policy participant_counts_read on public.participant_counts for select to authenticated
  using (public.current_user_role() in ('super_admin','admin','manager','viewer','pic'));
drop policy if exists participant_counts_write on public.participant_counts;
create policy participant_counts_write on public.participant_counts for all to authenticated
  using (public.current_user_role() in ('super_admin','admin','pic'))
  with check (public.current_user_role() in ('super_admin','admin','pic'));

drop policy if exists participant_roster_read on public.participant_roster;
create policy participant_roster_read on public.participant_roster for select to authenticated
  using (public.current_user_role() in ('super_admin','admin','manager','pic'));
drop policy if exists participant_roster_write on public.participant_roster;
create policy participant_roster_write on public.participant_roster for all to authenticated
  using (public.current_user_role() in ('super_admin','admin','pic'))
  with check (public.current_user_role() in ('super_admin','admin','pic'));

-- ---------------------------------------------------------------------
-- Generated read-model views (R1 / R2) that the app & reports consume.
-- Only reference columns that exist in the applied migration schema.
-- ---------------------------------------------------------------------
create or replace view public.vw_r1_income_statement
with (security_invoker=true) as
select
  p.program_code,
  c.canonical_name as company_name,
  p.title,
  i.invoice_no,
  i.invoice_date,
  i.total_value,
  i.payment_status,
  i.due_date,
  case when i.payment_status = 'PAID' then 0 else greatest(0, current_date - i.due_date) end as days_outstanding,
  i.pic,
  cos.cost_of_sales_amount,
  cos.net_profit,
  case when i.invoice_value_excl_sst > 0 then round(cos.net_profit / i.invoice_value_excl_sst * 100, 2) else null end as profit_pct
from public.invoices i
join public.programs p on p.id = i.program_id
join public.companies c on c.id = p.company_id
left join public.cost_of_sales cos on cos.invoice_id = i.id;

create or replace view public.vw_r2_overall_report
with (security_invoker=true) as
select
  p.program_code,
  ts.session_title,
  c.canonical_name as company_name,
  ts.session_type,
  ts.start_date,
  ts.end_date,
  ts.r2_status,
  pc.category,
  pc.bumiputera_count,
  pc.non_bumiputera_count,
  pc.total_count
from public.training_sessions ts
join public.programs p on p.id = ts.program_id
join public.companies c on c.id = p.company_id
left join public.participant_counts pc on pc.training_session_id = ts.id;
