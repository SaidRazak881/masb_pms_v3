# Sistem Pengurusan R1/R2/R3 — MIMOS Academy
## Production Architecture Blueprint (Next.js 15 + Supabase)

**Version:** 2.0.0 — Production Rebuild
**Supersedes:** Hostinger/PHP+MySQL "no-capital" plan (source MD report) and the static `mimos-academy-system.jsx` prototype
**Inputs reviewed:** UI/UX Spec (PDF v1.0.0), Expert Panel Report (MD), JSX prototype, and 9 real MIMOS Academy datasets (Quotation Tracker, R1 Income Statement, R2 Overall Report, R3 Funnel Tracker, invoice_2026, cost_of_sales_2026, office_funnel, sales_report, User Profiles Mapping)

---

## 0. What changed vs. the original plan, and why

The MD expert-panel report was written under a **zero-budget constraint** (Hostinger shared hosting, PHP + MySQL, WordPress/Google Sheets fallback). That constraint no longer applies — the target stack is **Next.js 15 + TypeScript + Tailwind + ShadCN + Supabase**, deployed on **Vercel**. Every recommendation from the panel that was tied to *infrastructure poverty* (no queues, no background jobs, no managed auth, no RLS, custom hashing tables for change detection) is replaced by a managed-platform equivalent. Every recommendation that was about **data modeling and business logic** (central Program/Opportunity entity, event-log thinking, layered matching keys, canonical status dictionary, idempotent import, audit trail, phased rollout) is **kept and formalized**, because that reasoning is stack-independent and is confirmed correct by inspecting the real files.

Confirmed from the raw data (not assumptions):

| Finding | Evidence |
|---|---|
| Quotation numbers use inconsistent prefixes for the same legal entity | `MSSB/QT/TRA/2026/0001` vs `MASB/QT/TRA/2026/0038` vs `MA/QT/2026(0001)` vs raw PO numbers used as quotation refs (`PO260000000210123`) |
| Client name is not a stable key | "MIMOS Berhad", "MIMOS Services Sdn Bhd", "MIMOS Solutions Sdn Bhd", "mimos solutions" all appear as distinct strings |
| Payment status contradicts across sources | MINDEF: `PAID` in R1 Income Statement vs `UNPAID` in `invoice_2026.xlsx` |
| Case inconsistency in controlled fields | Payment Status contains both `PAID` and `paid`; Quotation Status contains both `Sent` and `sent` |
| Formula corruption in source cost data | `cost_of_sales_2026` / R1 "Cost of Sale" sheet contains `#REF!`, `#NAME?` literal strings in numeric columns |
| Column-shift corruption | Quotation Tracker's "Quotation Type" column contains quotation numbers on some rows (`MASB/QT/TRA/2026/0005Rev1`) instead of `Training`/`Service` |
| R2 is structurally different from R1/R3 | Multi-header, merged-cell layout (`WAFER FAB`, `FA / MA`, `AI`, `OTHERS` category blocks over Bumi/Non-Bumi sub-columns) — cannot be parsed with a flat header row |
| Roles today are coarse | `User_Profiles_Mapping.xlsx` only has `Super Admin` and `MASB_Team`, with a **shared default password** (`masb.12345`) — a hard security requirement for the rebuild |
| office_funnel and R3 use different status vocabularies for what is the same pipeline concept | office_funnel: `Pending / In Progress / Done / KIV`; R3: `Early engagement / Qualified lead.../ Proposal.../ Negotiation stage / Verbal commitment / Contract signed/PO issued / Lost/No-go` |

This confirms the panel's central thesis and the PDF's `Program360Record` intent: **R1, R2, R3 must become read-models generated from one normalized database, not three files that are reconciled by hand.**

---

## 1. Complete Architecture

### 1.1 High-level system diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                            │
│   Next.js 15 App Router · React Server Components · ShadCN/Tailwind      │
└───────────────┬────────────────────────────────────────────┬────────────┘
                │ Server Actions / fetch                      │ Realtime (WS)
                ▼                                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     VERCEL (Next.js 15 runtime)                          │
│  ─ Route Handlers (app/api/**)         ─ Server Actions (mutations)      │
│  ─ Middleware (session refresh, RBAC route guard)                        │
│  ─ Vercel Cron (nightly aging recalculation, exception scan, digests)    │
└───────────────┬───────────────────────────────┬──────────────────────────┘
                │ supabase-js (service/anon)      │ Storage upload (signed URL)
                ▼                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE PROJECT                            │
│  ─ Postgres 15 (source of truth, RLS on every table)                     │
│  ─ Supabase Auth (email/password + magic link, JWT role claim)           │
│  ─ Storage (raw Excel uploads, generated PDF/Excel exports)              │
│  ─ Edge Functions (import parsing worker, matching engine, digest email) │
│  ─ Realtime (Action Center live badge counts)                            │
│  ─ pg_cron (scheduled aging/status recompute inside Postgres)            │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Why this replaces the Hostinger plan directly

| MD Report concern (PHP/MySQL constraint) | Supabase/Vercel equivalent |
|---|---|
| Build password hashing, sessions, RBAC by hand | Supabase Auth + JWT custom claims + RLS |
| "Avoid background jobs, process Excel at upload time" | Edge Functions / Vercel background functions handle this properly — no longer a constraint given MIMOS Academy's data volume (hundreds, not millions, of rows) |
| Custom row-hash table for idempotent import | `import_staging` table + Postgres unique constraint on `(source_file, source_sheet, source_row, row_hash)` |
| "Notifications can be deferred, use login-time checks" | Vercel Cron + pg_cron for scheduled recompute; Realtime channel for live badge; email digest via Resend/Supabase SMTP as an additive, not a blocker |
| Manual audit trail tables | Postgres triggers writing to `audit_log`, automatic on every mutating table |
| Shared/self-hosted DB backups | Supabase automatic PITR backups |

### 1.3 Core architectural principle (unchanged from the panel, now formalized)

**One entity — `programs` — is the spine.** Every quotation, PO, invoice, payment, and training session is a **child record that references `program_id`**. R1 (financial statement), R2 (training report), and R3 (funnel report) are **views/materialized views computed from these child tables**, never separate storage. This directly implements what the PDF's `Program360Record` TypeScript interface (section 7.3) was already gesturing at — this blueprint makes it the literal database schema instead of a flattened UI-only type.

---

## 2. Database Schema (Supabase / Postgres)

Full runnable schema is provided in the companion file **`02-schema.sql`**. Summary of entity groups:

### 2.1 Identity & governance
- `profiles` (extends `auth.users`) — `full_name`, `role`, `pic_display_name` (maps legacy "PIC - Full Name" strings), `is_active`
- `role` enum: `super_admin | admin | manager | pic | viewer` — maps directly to the PDF's RBAC column (§3) and replaces the flat `Super Admin` / `MASB_Team` split found in `User_Profiles_Mapping.xlsx`
- `audit_log` — generic `(table_name, record_id, action, old_value jsonb, new_value jsonb, changed_by, changed_at, source)`, populated by triggers on every business table

### 2.2 Master data / golden records
- `companies` — canonical client record. `aliases text[]` absorbs "MIMOS Berhad" / "MIMOS Services Sdn Bhd" / "mimos solutions" style variants until merged by an admin in the Data Quality Center
- `contacts` — linked to `companies`
- `status_dictionary` — controlled vocabulary mapping `raw_value → canonical_value` per `entity_type` and `source_system`, seeded from the exact raw values discovered above (`Sent`/`sent`, `PAID`/`paid`, R3's 7-stage funnel, office_funnel's 4-stage funnel, R1's `DONE`/`FOLLOW UP`)

### 2.3 The chain (spine + children)
- `programs` — the central Program/Opportunity entity (`program_code`, `title`, `company_id`, `category`, `training_type`, `current_stage`, `pic_user_id`, `account_manager_user_id`, `client_category`, `sector`)
- `pipeline_stage_history` — every stage transition, timestamped, with `is_override boolean` + `override_reason` for the "PO without quotation" case the panel and PDF both flag as a legitimate non-linear path
- `quotations` — includes `quotation_no_raw` (exact string as imported) **and** `quotation_no_normalized` (parsed series/year/sequence/revision) so MSSB/MASB/MA prefixes and `Rev1`/`rev2` suffixes don't fracture identity
- `purchase_orders`
- `invoices` — `payment_status` canonical enum, `days_outstanding` **generated column**, not stored/stale
- `payments` — supports partial payments (one invoice → many payments), closing the "amount collected" ambiguity in the source files
- `cost_of_sales` — one row per invoice; `net_profit` and `%_profit` are **generated columns**, never hand-entered, which directly fixes the "100% profit is an illusion because cost is hardcoded to 0" problem the Financial Analyst panelist raised
- `training_sessions` — one row per delivered session
- `participant_counts` — Bumiputera/Non-Bumiputera counts per session per category (`WAFER_FAB / FA_MA / AI / OTHERS`), replacing R2's merged-cell matrix with real rows
- `participant_roster` — optional individual attendee rows (from the "Attendance list" sheet), for certificate tracking

### 2.4 Import & data-quality engine
- `import_batches` — one row per file upload (`file_name`, `uploaded_by`, `status`, `total_rows`, `new_records`, `updated_records`, `rejected_rows`)
- `import_staging` — one row per source row: `raw_json`, `row_hash`, `match_status`, `match_confidence`, `target_table`, `target_id`
- `data_quality_exceptions` — `type` (`STATUS_MISMATCH | DUPLICATE_RECORD | UNMATCHED_INVOICE | MISSING_PO | CLIENT_ALIAS | FORMULA_ERROR | COLUMN_SHIFT`), `severity`, `related_table`, `related_id`, `status`

### 2.5 Views (R1 / R2 / R3 / Action Center are generated, not stored)
- `vw_r1_income_statement`
- `vw_r2_overall_report`
- `vw_r3_sales_funnel`
- `vw_action_required` — unions overdue invoices (>30d), pending quotations (>14d), missing PO, incomplete R2, open data-quality exceptions — this is the query that powers Screen 2 (Action Center) directly

All financial and status tables carry `source_file`, `source_sheet`, `source_row`, `row_hash`, `imported_at` — required by the panel's provenance requirement and by the PDF's audit-log expectations (§2 §8.5, §11).

---

## 3. Folder Structure (Next.js 15 App Router, feature-based)

```
mimos-academy/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/                      # authenticated layout group
│   │   ├── layout.tsx                    # Sidebar + Topbar (PDF §3)
│   │   ├── page.tsx                      # 0.0 Dashboard Utama
│   │   ├── action-center/page.tsx        # 1.0 ★ KEYPAGE
│   │   ├── executive/                    # 2.0
│   │   │   ├── page.tsx
│   │   │   └── risk-matrix/page.tsx
│   │   ├── funnel/                       # 3.0 R3
│   │   │   ├── page.tsx                  # master list
│   │   │   ├── forecast/page.tsx
│   │   │   └── kanban/page.tsx
│   │   ├── quotations/                   # 4.0
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── purchase-orders/              # 5.0
│   │   │   ├── page.tsx
│   │   │   └── matching/page.tsx
│   │   ├── financials/                   # 6.0 R1
│   │   │   ├── invoices/page.tsx
│   │   │   ├── aging/page.tsx
│   │   │   ├── payments/page.tsx
│   │   │   └── cost-of-sales/page.tsx
│   │   ├── training/                     # 7.0 R2
│   │   │   ├── programs/page.tsx
│   │   │   ├── calendar/page.tsx
│   │   │   └── demographics/page.tsx
│   │   ├── programs/[id]/page.tsx        # 8.0 ★ Program 360 View
│   │   ├── reports/                      # 9.0
│   │   │   ├── page.tsx
│   │   │   └── board-pack/page.tsx
│   │   ├── data-quality/                 # 10.0
│   │   │   ├── import/page.tsx
│   │   │   ├── logs/page.tsx
│   │   │   ├── mismatches/page.tsx
│   │   │   └── duplicates/page.tsx
│   │   └── settings/                     # 11.0
│   │       ├── users/page.tsx
│   │       ├── data-dictionary/page.tsx
│   │       └── pipeline-mapping/page.tsx
│   └── api/
│       ├── import/upload/route.ts
│       ├── import/[batchId]/commit/route.ts
│       ├── reports/[type]/export/route.ts
│       ├── webhooks/supabase/route.ts
│       └── cron/aging-recalc/route.ts
│
├── components/
│   ├── ui/                # ShadCN primitives (button, badge, dialog, table…)
│   ├── charts/             # Recharts wrappers themed to PDF palette
│   ├── layout/             # Sidebar, Topbar, PageHeader
│   ├── status/StatusBadge.tsx      # ports PDF §6.1 component 1:1
│   └── chain/ChainStepper.tsx      # ports PDF §6.1 component 2:1
│
├── features/
│   ├── action-center/{components,hooks,queries}
│   ├── program-360/{components,hooks,queries}
│   ├── r1-financials/{components,hooks,queries}
│   ├── r2-training/{components,hooks,queries}
│   ├── r3-funnel/{components,hooks,queries}
│   ├── import-engine/{parsers,matchers,components}
│   │   ├── parsers/quotationTracker.parser.ts
│   │   ├── parsers/r1Invoice.parser.ts
│   │   ├── parsers/r2Overall.parser.ts     # merged-header parser (special case)
│   │   ├── parsers/r3Funnel.parser.ts
│   │   ├── parsers/costOfSales.parser.ts
│   │   ├── matchers/documentChainMatcher.ts
│   │   └── matchers/companyFuzzyMatcher.ts
│   ├── data-quality/{components,rules}
│   └── executive/{components,queries}
│
├── lib/
│   ├── supabase/{client.ts,server.ts,middleware.ts,admin.ts}
│   ├── rbac/{roles.ts,guards.ts,policies.ts}
│   ├── validation/                # Zod schemas mirroring Postgres constraints
│   ├── status/canonicalMap.ts     # status_dictionary client mirror
│   └── utils/{currency.ts,dates.ts,hash.ts}
│
├── stores/                # Zustand (filters, active program, upload progress)
├── types/                 # generated via `supabase gen types typescript`
├── supabase/
│   ├── migrations/*.sql
│   ├── functions/import-worker/index.ts   # Edge Function
│   └── seed.sql
└── middleware.ts
```

This is a direct evolution of the PDF's §7.2 structure (`src/features/*`) into Next.js's route-group convention, with the PDF's `mock-data/` replaced entirely by live Supabase queries and `routes/` replaced by the App Router's own file-based routing.

---

## 4. API Design

Two mutation surfaces are used deliberately, per Next.js 15 conventions:

- **Server Actions** for form-bound mutations inside a page (creating a follow-up note, updating a payment status, resolving an exception) — colocated with the feature, no separate endpoint needed, automatically CSRF-protected.
- **Route Handlers (`app/api/**`)** for anything called from outside a React tree: file upload, exports, cron jobs, and future integrations.

### 4.1 Route Handler surface

| Method & Path | Purpose | RBAC |
|---|---|---|
| `POST /api/import/upload` | Accepts multipart Excel file, stores in Supabase Storage, creates `import_batches` row, triggers Edge Function | Admin, PIC |
| `GET /api/import/[batchId]` | Poll batch status (`parsing → staged → matched → committed / failed`) | Admin, PIC |
| `POST /api/import/[batchId]/commit` | Commits staged rows to production tables after review | Admin |
| `POST /api/import/[batchId]/rows/[rowId]/fix` | Inline fix + re-stage a single rejected row | Admin, PIC |
| `GET /api/programs/[id]/chain` | Full Program 360 payload (quotation→PO→invoice→payment→training) | All roles (RLS-scoped) |
| `GET /api/reports/r1/export` `?format=xlsx\|pdf` | Streams generated R1 statement | All roles |
| `GET /api/reports/r2/export` | Streams generated R2 report | All roles |
| `GET /api/reports/r3/export` | Streams generated R3 funnel report | All roles |
| `GET /api/reports/board-pack/export` | One-click PDF board pack (PDF §9 item 5) | Management, Admin |
| `POST /api/exceptions/[id]/resolve` | Resolve a data-quality exception | Admin, Manager |
| `POST /api/companies/merge` | Merge alias company records into one golden record | Admin |
| `GET /api/action-center/summary` | Counts for sidebar badge + Action Center tabs | All roles |
| `GET /api/cron/aging-recalc` | Vercel Cron target — recomputes overdue flags, fires digest | System (Vercel Cron secret header) |

### 4.2 Server Actions (examples, colocated under `features/*/actions.ts`)

```ts
// features/r1-financials/actions.ts
'use server'
export async function logPaymentReceived(input: LogPaymentInput) { ... }
export async function markFollowUpSent(invoiceId: string, note: string) { ... }

// features/program-360/actions.ts
'use server'
export async function updateProgramStage(programId: string, next: PipelineStage, opts?: { override?: boolean; reason?: string }) { ... }

// features/data-quality/actions.ts
'use server'
export async function resolveMismatch(exceptionId: string, resolution: 'accept_a'|'accept_b'|'manual', value?: unknown) { ... }
```

Every Server Action and Route Handler validates input with a **Zod schema shared with the Postgres constraint definitions** (`lib/validation/*`), then relies on **Postgres RLS as the final authority** — the API layer is a convenience/validation layer, not the security boundary.

---

## 5. RBAC (Role-Based Access Control)

### 5.1 Roles (supersedes the 2-role reality in `User_Profiles_Mapping.xlsx`)

Directly implements the PDF §3 sidebar RBAC table:

| Role | Maps from legacy | Scope |
|---|---|---|
| `super_admin` | `Super Admin` | Full access incl. user management, RLS bypass for support |
| `admin` | subset of `Super Admin` | Full business data + import + data-quality + settings, no auth/user deletion |
| `manager` | new (was implicit) | Executive Dashboard, all reports, resolve exceptions, cannot import or manage users |
| `pic` | `MASB_Team` | CRUD on programs/quotations/invoices/training **they are assigned to** (`pic_user_id = auth.uid()` or `account_manager_user_id = auth.uid()`), import own files |
| `viewer` | new | Read-only: Reports Hub, Participant Analytics |

### 5.2 Enforcement layers (defense in depth)

1. **Supabase Auth** issues a JWT with a custom claim `role`, synced from `profiles.role` via a Postgres trigger + `auth.hook` (or a `custom_access_token_hook`).
2. **Next.js Middleware** (`middleware.ts`) refreshes the session on every request and redirects unauthenticated users; it also does coarse route-group gating (e.g., `/settings/*` requires `admin`+) before the page even renders, for UX speed — **not** as the security boundary.
3. **Row Level Security (Postgres)** is the actual boundary. Pattern used on every business table:

```sql
create policy "pic_own_or_elevated_read"
on public.programs for select
using (
  auth.jwt() ->> 'role' in ('super_admin','admin','manager','viewer')
  or pic_user_id = auth.uid()
  or account_manager_user_id = auth.uid()
);

create policy "pic_own_write"
on public.programs for update
using (
  auth.jwt() ->> 'role' in ('super_admin','admin')
  or pic_user_id = auth.uid()
);
```

Financial mutation tables (`invoices`, `payments`, `cost_of_sales`) restrict `update`/`delete` to `super_admin`/`admin` only — `pic` can `insert` follow-up notes and mark "payment received" via a **Server Action that inserts into `payments`**, but cannot edit historical invoice amounts, satisfying the panel's "financial data is sensitive, not everyone can edit" requirement.

4. **Storage RLS** on the `imports` bucket: only `admin`/`pic` can upload; only `admin`/`super_admin` can delete.

### 5.3 First-login security fix (mandatory, from the audit finding)

The default password `masb.12345` found in `User_Profiles_Mapping.xlsx` must **never** be migrated as a literal password. Migration path:
- Seed `profiles` rows only (no passwords) with `must_reset_password = true`.
- Send Supabase invite links (`supabase.auth.admin.inviteUserByEmail`) — each user sets their own password on first login.
- Enforce password policy (min length, breach-list check) via Supabase Auth settings.

---

## 6. Import Engine Design

### 6.1 Pipeline

```
Upload (drag-drop, .xlsx/.xls/.csv)
   │
   ▼
[1] File Integrity Check          — mime/type check, size limit, virus-scan hook (optional)
   │
   ▼
[2] Sheet Router                  — matches file signature to a known parser
   │   (Quotation Tracker / R1 Invoice / R1 Cost of Sale / R2 Overall /
   │    R2 Attendance / R3 Funnel / invoice_2026 / cost_of_sales_2026 /
   │    office_funnel / sales_report / unknown → generic column-mapper UI)
   ▼
[3] Parse & Normalize             — per-parser: trim whitespace, normalize dates,
   │                                 coerce numbers, uppercase enums, strip currency
   │                                 symbols, flag #REF!/#NAME!/#DIV/0! literals
   ▼
[4] Row Hashing                   — sha256(normalized_row_json) → row_hash
   │                                 idempotency key = (source_file, sheet, row_no, row_hash)
   ▼
[5] Stage                         — insert into import_staging (status = 'staged')
   │
   ▼
[6] Matching Engine (§7)          — assign match_status + confidence per row
   │
   ▼
[7] Review UI (Screen 4, PDF)     — Import Audit Summary + Error Reconciliation Table
   │                                 admin/PIC can Inline Fix before commit
   ▼
[8] Commit                        — upsert into target tables inside a single transaction;
                                     unmatched/low-confidence rows → data_quality_exceptions,
                                     never silently dropped
```

### 6.2 Per-file parser contracts (concrete, from the actual headers found)

| Source file | Parser target | Key normalization rules |
|---|---|---|
| `00__Quotation_Tracker__1_.xlsx` | `quotations` | Detect column-shift: if "Quotation Type" cell matches `/^[A-Z]{2,4}\/QT\//`, treat it as a misplaced `quotation_no` and re-derive `quotation_type` from `Category`; parse `quotation_no_raw` into series/year/seq/rev via regex `^(MSSB|MASB|MA)\/QT\/(?:TRA\/)?(\d{4})\/?\(?(\d+)\)?(?:Rev(\d))?$` |
| `R1_MIMOS_Academy_INCOME_STATEMENT.xlsx` (Invoice sheet) | `invoices` + `programs` (create-if-missing) | Parse `Days Outstanding` text (`"Overdue by 123 days"`) into a signed integer; ignore it as *display-only legacy text* — the DB recomputes `days_outstanding` from `due_date` |
| `R1_MIMOS_Academy_INCOME_STATEMENT.xlsx` (Cost of Sale sheet) | `cost_of_sales` | Reject rows whose numeric columns literally equal `#REF!`/`#NAME?` string values into `data_quality_exceptions` (type `FORMULA_ERROR`) instead of coercing to 0 |
| `cost_of_sales_2026.xlsx` | `cost_of_sales` | Same target table as above — treated as a **later, cleaner snapshot**; matched to invoices by `Invoice No`, newer `imported_at` wins on hash conflict |
| `invoice_2026.xlsx` | `invoices` | Same target as R1 Invoice sheet; used as the **cross-check source** — a mismatch vs R1 on `Payment Status` for the same `Invoice No` auto-creates a `STATUS_MISMATCH` exception (this is exactly the MINDEF case found in the data) |
| `R2_Overall_Report_2026__1_.xlsx` (Overall sheet) | `training_sessions` + `participant_counts` | **Special two-pass parser**: row 3 defines merged category groups (`WAFER FAB`, `FA/MA`, `AI`, `OTHERS`) spanning 3 sub-columns each (`Bumi`, `Non-Bumi`, `Total`) — parser reads the merged-cell map from `ws.merged_cells.ranges` before iterating data rows |
| `R2_Overall_Report_2026__1_.xlsx` (Attendance list) | `participant_roster` | One participant per row; `Bumi`/`Non-Bumi` presence columns are mutually exclusive booleans |
| `R3_Group_2026_Funnel_Tracker.xlsx` | `programs` + `pipeline_stage_history` | Map `Status` free text against `status_dictionary(entity_type='funnel', source_system='r3')`; `Probability of success (%)` stored as fraction (÷100 if >1) |
| `office_funnel_2026-08-19.xlsx` | `pipeline_stage_history` (secondary/operational funnel) | Different vocabulary (`Pending/In Progress/Done/KIV`) mapped via `status_dictionary(source_system='office_funnel')` to the same canonical stage enum |
| `sales_report_2026-08-19.xlsx` | `programs` (cross-check) | Same shape as R3; used as validation source for `weighted_value = forecast_value × probability` |
| `User_Profiles_Mapping.xlsx` | `profiles` (one-time seed only) | Never imports the password column into any persisted field |

### 6.3 Idempotency & change tracking

- Unique constraint: `(source_file, source_sheet, source_row, row_hash)` on `import_staging` — re-uploading an unchanged file is a full no-op.
- If `row_hash` differs for the same `(source_file, source_sheet, source_row)`, the row is treated as an **update**: old values are snapshotted to `audit_log` before overwrite.
- Every committed row keeps `source_file`, `source_sheet`, `source_row`, `row_hash`, `imported_at` — full provenance, per the panel's requirement.

---

## 7. Chain Detection Logic

Implements the panel's "layered matching keys" concept as a concrete, ordered algorithm run by the matching engine (`features/import-engine/matchers/`).

### 7.1 Match key layers, in order of trust

1. **Internal ID** — if the row already has a `program_id`/`quotation_id`/`invoice_id` from a prior import (via `row_hash` lineage), reuse it. Confidence = 1.0.
2. **Normalized document number** — `quotation_no_normalized` (series stripped, revision stripped, zero-padded sequence) compared across `quotations`, `purchase_orders`, `invoices.quotation_no`. Confidence = 0.95.
3. **Exact invoice number** — `Invoice No.` is the strongest cross-file key (present in R1, `invoice_2026`, `cost_of_sales_2026`) — used to link cost-of-sales back to invoices and to cross-check `payment_status` between R1 and `invoice_2026`. Confidence = 0.95.
4. **Fuzzy company + date + title** — when no document number exists (e.g., linking `office_funnel`/`sales_report` opportunities to R3 programs): Postgres `pg_trgm` similarity on `companies.canonical_name` (≥0.6) **and** a date proximity window (±14 days) **and** `similarity(title, program.title)` (≥0.4). Confidence = weighted average, capped at 0.85.
5. **No match** → new `program`/`company` candidate created, flagged `needs_review = true`.

### 7.2 Confidence routing

| Confidence | Action |
|---|---|
| ≥ 0.90 | Auto-link, no human review |
| 0.60 – 0.89 | Auto-link **but** create a `data_quality_exceptions` row (type `LOW_CONFIDENCE_MATCH`) for spot audit |
| < 0.60 | Do **not** auto-link — create a new candidate record and an exception; surfaced in the Import Review screen's "Error Reconciliation Table" (Inline Fix) |

### 7.3 Company alias resolution

`companies.aliases text[]` + a `company_alias_map` lookup table seeded from the known cases (`MIMOS Berhad`, `MIMOS Services Sdn Bhd`, `MIMOS Solutions Sdn Bhd`, `mimos solutions` → one canonical company, distinguished only if genuinely different legal entities after admin review). The merge action (`POST /api/companies/merge`) re-points every FK from the alias record to the canonical record inside one transaction and logs it to `audit_log`.

### 7.4 State machine

```
LEAD_REGISTERED → PROPOSAL_SUBMITTED → QUOTATION_APPROVED → PO_RECEIVED
    → INVOICED → PAID → TRAINING_COMPLETED
```

- Transitions are normally sequential and logged to `pipeline_stage_history`.
- **Skip transitions are allowed** (e.g., PO received with no quotation on file — a real, legitimate business case per the panel) but require `is_override = true` + `override_reason`, restricted to `admin`+.
- `LOST` is a terminal state reachable from any non-terminal stage.
- Canonical stage is derived from raw source status via `status_dictionary` at import time — R3's 7-stage vocabulary and office_funnel's 4-stage vocabulary both resolve to this single enum.

---

## 8. Implementation Roadmap

Because Vercel + Supabase remove essentially all of the infrastructure work the original 14-week no-capital plan had to budget for, this roadmap compresses to **~9 weeks** while keeping every governance step the panel insisted on (data dictionary before code, import before direct-entry, parallel run before cutover).

| Phase | Weeks | Deliverables |
|---|---|---|
| **0 — Foundations** | 1 | Supabase project, schema migration (`02-schema.sql`), RLS policies, Auth + role seeding (invite-based, no shared passwords), `status_dictionary` populated from the raw vocabularies found in every file, Next.js 15 scaffold with ShadCN theme matching PDF §1.2 palette |
| **1 — Import Engine & Matching** | 2 | All 9 file parsers, row hashing, staging pipeline, matching engine (layers 1–5), Import Center UI (PDF Screen 4), Data Quality & Audit Center UI (PDF Screen 5) with the mismatch/duplicate/alias features |
| **2 — Core Read Surfaces** | 2 | Dashboard Utama (Screen 1), Action Center (Screen 2) backed by `vw_action_required`, R1/R2/R3 generated views + export endpoints, RBAC enforcement end-to-end. **Parallel run**: 2 weeks alongside existing Excel process to validate output |
| **3 — Program 360 & Executive** | 2 | Program 360 View (Screen 3) with Chain Stepper, Executive Dashboard (Screen 6) with waterfall/leakage radar/demographic gauge, Board Pack PDF export |
| **4 — Direct Entry, Alerts, Hardening** | 2 | PIC direct-entry forms (React Hook Form + Zod) replacing manual re-upload for new records, in-app + email digests via cron, company alias merge tooling, load/security review, production cutover |

Success metrics carried over from the panel (still the right measures on the new stack): time to assemble R1/R2/R3, number of missed payment follow-ups, number of pending records auto-surfaced, and the two financial KPIs the Financial Analyst insisted on — *secured-not-invoiced* and *invoiced-not-collected* gaps, both now computable live from `vw_r1_income_statement` instead of manual reconciliation.

---

## 9. Vercel Deployment Guide

### 9.1 Prerequisites
- Supabase project created (region close to Malaysia, e.g., `ap-southeast-1`)
- GitHub repo with the Next.js 15 app
- Domain (can reuse the existing Hostinger domain by repointing DNS, or use a new one)

### 9.2 Supabase setup
1. `supabase link --project-ref <ref>`
2. `supabase db push` — applies `supabase/migrations/*.sql` (see `02-schema.sql`)
3. Enable `pg_trgm` extension (needed for fuzzy company matching) and `pgcrypto` (for `gen_random_uuid()`)
4. Create Storage buckets: `imports` (private) and `exports` (private, signed-URL access)
5. Configure Auth: disable public signup, enable invite-only, set JWT expiry, add `custom_access_token_hook` to inject `role` claim from `profiles`
6. Set up `pg_cron` job for nightly aging recompute (belt-and-suspenders alongside the Vercel Cron route)

### 9.3 Vercel project
1. Import the GitHub repo into Vercel
2. Environment variables (Production + Preview, values from Supabase dashboard):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to client bundle)
   - `CRON_SECRET` (shared secret checked in `app/api/cron/*` handlers)
   - `RESEND_API_KEY` or SMTP creds for digest emails (optional Phase 4)
3. Build command: `next build` (default) — no custom server needed, App Router + Server Actions run natively on Vercel's Node runtime
4. Add `vercel.json` cron entries:
```json
{
  "crons": [
    { "path": "/api/cron/aging-recalc", "schedule": "0 1 * * *" },
    { "path": "/api/cron/action-digest", "schedule": "0 8 * * 1-5" }
  ]
}
```
5. Set the production domain in Vercel → Domains, update DNS (CNAME to `cname.vercel-dns.com` or A record per Vercel's instructions)
6. Enable Vercel's Deployment Protection for Preview environments (internal staging should not be publicly reachable given the financial data sensitivity called out repeatedly in the source report)

### 9.4 Post-deploy checklist
- [ ] Confirm RLS is **enabled** on every table (`select relrowsecurity from pg_class where relkind='r'`) — a table with RLS *defined but not enabled* silently allows all access
- [ ] Run the invite flow for all real users from `User_Profiles_Mapping.xlsx`; confirm `masb.12345` is not stored anywhere
- [ ] Upload one file per parser in staging and verify the Import Audit Summary counts match a manual row count
- [ ] Verify the MINDEF-style status-mismatch scenario actually produces a `data_quality_exceptions` row
- [ ] Confirm `vw_action_required` returns the correct set for a seeded overdue invoice
- [ ] Load-test the R2 Overall parser specifically (merged-header sheets are the highest-risk parser)
- [ ] Enable Supabase daily backups / PITR
- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY` out of any preview logs before go-live

---

*Companion files: `02-schema.sql` (full runnable Postgres/Supabase schema with RLS), this document.*
