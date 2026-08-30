# Fasa 1 — Audit & Verifikasi Repositori MIMOS Academy (R1/R2/R3)

**Tarikh audit:** 2026-08-30 (Arena)
**Branch audit:** `arena/01a05068-masb-pms-v3` (identik dengan `main` @ `636d369`)
**Auditor:** Architecture Owner & Lead Full-Stack (Arena Mode)

---

## 1. Ringkasan Hasil Semakan Repo

### 1.1 Status repository & branch

| Perkara | Status |
|---|---|
| Branch aktif | `arena/01a05068-masb-pms-v3` |
| Pangkalan commit | `636d369 Merge pull request #3 from SaidRazak881/phase1-production` |
| Beza vs `main` | Tiada (empty diff) |
| PR #1, #2, #3, #4 | MERGED |
| PR #5 — `feat(import): wire import matching and target resolution` | **OPEN & CONFLICTING** — mengandungi migrations `0005_reconcile_schema.sql`, `0006_matching_resolution.sql`, `0007_align_cost_of_sales_with_commit_engine.sql` yang **belum masuk `main`** |
| Build & Typecheck | ✅ `npm run build` dan `npm run typecheck` lulus |

### 1.2 Status fail utama

| Fail | Status |
|---|---|
| `01-ARCHITECTURE.md` | Blueprint lengkap dan konsisten sebagai rujukan seni bina. |
| `02-schema.sql` | **Target schema** 19 jadual + R1/R2/R3 views + RLS pada semua jadual. **TIDAK sama** dengan migration set yang dipakai kod. |
| `supabase/migrations/0001_phase1.sql` | Schema asas MVP: `profiles`, `companies`, `programs`, `quotations`, `purchase_orders`, `invoices`, `payments`, `training_sessions`, `data_quality_exceptions`, `audit_log`, `vw_r3_sales_funnel`, `vw_action_required`, trigger `handle_new_user`, RLS awal. |
| `supabase/migrations/0002_harden_rbac_rls.sql` | Menambah `current_user_role()` dan RLS yang lebih granular. **Tetapi tidak drop beberapa polisi lama yang luas** dan masih membenarkan `manager`/`pic` menulis jadual kewangan. |
| `supabase/migrations/0003_import_foundation.sql` | `import_batches` + `import_staging` (reka bentuk **berbeza** daripada `02-schema.sql`). |
| `supabase/migrations/0004_production_commit_engine.sql` | `import_commit_log` + RPC `commit_import_batch()` / `rollback_import_batch()`. |
| `supabase/migrations/2026***` | Seed 2026 adalah **marker sahaja** (data sebenar dikatakan dimuatkan dari release environment). |
| `types/database.ts` | **Stale**: tiada `cost_of_sales`, `contacts`, `status_dictionary`, `participant_counts`, `participant_roster`, `company_alias_map`, `import_commit_log`, `vw_r1_income_statement`, `vw_r2_overall_report`. Tidak sepadan `02-schema.sql` mahupun PR #5. |
| `app/` | App Router Next.js 15 wujud: `/login`, `/dashboard`, `/dashboard/action-center`, `/dashboard/programs`, `/dashboard/programs/[code]`, plus API import routes. |
| `.env.example` / `lib/supabase/*` | Menggunakan `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. ✅ Tiada service-role dalam `NEXT_PUBLIC_*`. |
| `vercel.json` | **TIDAK wujud** (kron yang direncanakan dalam seni bina belum ada). |
| `middleware.ts` | Auth refresh + redirect ke `/login`; tiada gating RBAC per-route. |

### 1.3 Verdict entiti teras `programs` terhadap R1/R2/R3

| Domain | R1 | R2 | R3 |
|---|---|---|---|
| Sokongan di `02-schema.sql` | ✅ Boleh dibina (invoices + cost_of_sales + `vw_r1_income_statement`) | ✅ Boleh dibina (training_sessions + participant_counts + `vw_r2_overall_report`) | ✅ Penuh (`forecast_value`, `probability`, `weighted_value`, `current_stage`, `lead_date`, `sector`, `pic_user_id`, `account_manager_user_id`, `vw_r3_sales_funnel`) |
| Sokongan dalam migrations `0001–0004` (yang kod anggap) | ⚠️ **Sebahagian**: `invoices` ada; `cost_of_sales` + `vw_r1_income_statement` **tidak wujud**. | ⚠️ **Sebahagian**: `training_sessions` ada; `participant_counts`, `participant_roster`, `vw_r2_overall_report` **tidak wujud**. | ✅ Ada (`vw_r3_sales_funnel`) |
| Frontend/UI sebenar | ❌ Tiada skrin R1 | ❌ Tiada skrin R2 | ✅ Program 360 / funnel sahaja |
| RLS pada `programs` | ✅ Enabled dalam migration & 02-schema | ✅ Enabled | ✅ Enabled |

**Kesimpulan:** `programs` memang dijadikan *spine* (FK dari `quotations`, `purchase_orders`, `invoices`, `training_sessions`), tetapi **belum menyokong sepenuhnya R1/R2 end-to-end di dalam pangkalan data yang dijalankan** kerana jadual `cost_of_sales`, `participant_counts`, `participant_roster` dan views R1/R2 belum dipasang di `main`.

### 1.4 Penemuan kritikal (blockers)

1. **Dua skema bercanggah**: `02-schema.sql` (blueprint) berbeza dengan `supabase/migrations` (yang dipakai kod/types). Contoh:
   - `cost_of_sales` dalam `02-schema.sql`: `invoice_id`, `net_profit` adalah **generated column**, tiada `invoice_no/invoice_value/collection/profit_percentage`.
   - `cost_of_sales` yang dijangka oleh `commit_import_batch()` (migration 0004) dan `CostOfSalesParser`: perlu `invoice_no`, `invoice_value`, `collection`, `net_profit` (mutable), `profit_percentage`. Jika `02-schema.sql` dipakai, RPC 0004 akan **gagal**.
   - `import_batches`/`import_staging` dalam `02-schema.sql` berbeza (storage_path, uploaded_by, source_sheet/source_row/raw_json) dengan migration 0003 (source_type, created_by, metadata, batch_id/source_row_number/raw_data). Kod/types mengikut migration 0003.
   - `data_quality_exceptions.type` = enum `exception_type` dalam 02-schema vs `text` dalam migration. Kod `exception-service.ts` menggunakan value seperti `UNMATCHED`, `DUPLICATE`, `INVALID_STATUS`, `INVALID_PERCENTAGE`, `FORMULA_ERROR`, `MISSING_COMPANY`, `MISSING_INVOICE_NUMBER` — **tidak padan** dengan enum 02-schema (`STATUS_MISMATCH`, `DUPLICATE_RECORD`, `UNMATCHED_INVOICE`, `MISSING_PO`, `CLIENT_ALIAS`, `FORMULA_ERROR`, `COLUMN_SHIFT`, `LOW_CONFIDENCE_MATCH`).
   - `severity` kod: `MEDIUM`/`HIGH`/`CRITICAL` vs 02-schema default `'MED'`.

2. **Import pipeline belum bersambung**: Tiada route memanggil `matchImportStaging()` ataupun `persistMatchingResults()`. RPC `commit_import_batch()` hanya memproses staging row yang `matching_status IN ('EXACT','ALIAS','COMPOSITE','FUZZY_REVIEW')` **dan** `target_record_id IS NOT NULL`, tetapi matching engine tidak pernah set `target_record_id`. Akibatnya **commit adalah silent no-op**.

3. **RLS tidak selari dengan seni bina**:
   - `0002` tidak drop polisi lamа `quotation_write`, `po_write`, `invoice_write`, `payment_write`, `training_write`, `dqe_write` daripada `0001`; ini menjadikan polisi lama + baru aktif serentak (permissif).
   - `0002` membenarkan `manager`/`pic` INSERT/UPDATE pada `invoices`, `payments`, `quotations`, `purchase_orders`, `training_sessions` — bercanggah dengan `01-ARCHITECTURE.md` §5.2 yang menyatakan jadual kewangan (`invoices`, `payments`, `cost_of_sales`) hanya `super_admin`/`admin`.
   - `02-schema.sql` menggunakan `public.current_role()` (daripada JWT custom claim) tetapi **tiada `custom_access_token_hook` migration**. Migration 0002 menggunakan `public.current_user_role()` (lookup `profiles`). Fungsi dan mekanisme tidak konsisten antara dua dokumen.
   - Tiada RLS untuk `contacts`, `status_dictionary`, `cost_of_sales`, `participant_counts`, `participant_roster`, `company_alias_map` di `main` (jadual belum wujud di migration).

4. **Jadual/views yang belum ada di `main`**: `contacts`, `status_dictionary`, `cost_of_sales`, `participant_counts`, `participant_roster`, `company_alias_map`, `vw_r1_income_statement`, `vw_r2_overall_report`. Ini semua ada dalam PR #5 (0005) tetapi belum dibawa masuk ke `main`.

5. **Frontend tidak lengkap berbanding blueprints**: hanya Dashboard, Action Center dan Program 360 ada. Tiada skrin R1 (Financials), R2 (Training/Demographics), Funnel lain, Executive, Reports, Data Quality/Import Center, Settings. Tiada Server Actions (mutasi), tiada `features/` directory, tiada `vercel.json` crons.

6. **`types/database.ts` tertinggal**: menghasilkan `Database` yang tidak mengandungi jadual R1/R2 dan `cost_of_sales`; ini akan menyekat pembangunan/import R1/R2 serta menyebabkan ketidakpadanan runtime dengan live project jika live project menggunakan schema yang lebih lengkap.

7. **Risk deploy/Vercel**: deploy-branch berbelah — `VERCEL_DEPLOYMENT_CHECKLIST.md` masih kata `phase1-production`, manakala `GPT_PROMPTS.md` dan keadaan repo (main = superset) mengesyorkan `main`. PR #5 masih `CONFLICTING`.

---

## 2. Blok Prompt Khusus untuk ChatGPT (Assistant Agent)

> Salin keseluruhan blok di bawah (`BEGIN PROMPT` … `END PROMPT`) dan berikan kepada ChatGPT yang mempunyai akses **live** ke Supabase dan Vercel untuk projek MIMOS Academy PMS.

````text
BEGIN PROMPT

ROLE
You are the live-infrastructure verification assistant for the MIMOS Academy
Program Management System (R1/R2/R3). The architecture owner has already audited
the repository. You must now verify the live Supabase project and the Vercel
deployment against that audit — READ-ONLY unless explicitly told otherwise.

PROJECT CONTEXT
- Repo: SaidRazak881/masb_pms_v3
- Baseline code branch inspected by architecture owner: main @ 636d369
  (identical to the owner's arena working branch).
- Open candidate (DO NOT MERGE): PR #5
  "feat(import): wire import matching and target resolution"
  adds migrations 0005_reconcile_schema.sql, 0006_matching_resolution.sql,
  0007_align_cost_of_sales_with_commit_engine.sql plus import wiring.
- Target blueprint schema: 02-schema.sql (19 public tables, R1/R2/R3 views).
- Run/code-facing schema expected by the app: supabase/migrations/0001-0004
  (the app's TypeScript types/types/database.ts follow this migration set).
- Deployment notes: VERCEL_DEPLOYMENT_CHECKLIST.md, FIRST_ADMIN_BOOTSTRAP.md.

HARD RULES
1. NEVER print full Supabase keys, DSNs, passwords, or tokens. Mask values as
   e.g. sb_url: https://xxxx.supabase.co, publishable_key: abc…xyz.
2. NEVER run destructive SQL (no DROP, TRUNCATE, DELETE, ALTER that drops
   columns/types). Do not disable RLS. Do not modify Vercel/Supabase settings
   unless a specific task says to; otherwise only inspect and report.
3. Do everything in "public" schema and Supabase Auth only.
4. If you cannot reach Supabase or Vercel, STOP and report which credential/CLI
   access is missing. Do not guess.
5. Finish every task with an exact REPORT block (format below). Use status codes
   PASS / PARTIAL / FAIL / UNKNOWN for every check and quote the query output.

TASK 1 — SUPABASE PROJECT & INVENTORY
1. Connect to the live Supabase project used by the Vercel app "masb-pms-v3".
   Report masked project ref + region.
2. Compare the live database against the inventory list below. For EACH item report
   EXISTS / MISSING / MISMATCH (and the actual DDL or columns where useful):
   - Tables expected by blueprint 02-schema.sql:
     profiles, companies, contacts, status_dictionary, programs,
     pipeline_stage_history, quotations, purchase_orders, invoices, payments,
     cost_of_sales, training_sessions, participant_counts, participant_roster,
     import_batches, import_staging, data_quality_exceptions,
     company_alias_map, audit_log.
   - Tables expected by migration set / app:
     import_commit_log.
   - Views: vw_r1_income_statement, vw_r2_overall_report, vw_r3_sales_funnel,
     vw_action_required.
   - Functions: current_role(), current_user_role(), handle_new_user(),
     commit_import_batch(uuid), rollback_import_batch(uuid).
   - Enums in 02-schema.sql: user_role, client_category, pipeline_stage,
     quotation_status, payment_status, r2_status, participant_category,
     training_type, import_batch_status, staging_match_status, exception_type,
     exception_status, audit_action.
   - Trigger: on_auth_user_created (creating public.profiles from auth.users).
3. Run and paste verbatim:
   select table_name
   from information_schema.tables
   where table_schema='public'
   order by 1;
   select viewname from pg_views where schemaname='public' order by 1;
   select proname from pg_proc where pronamespace='public'::regnamespace
   order by proname;
   select relname, relrowsecurity
   from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='r'
   order by 1;

TASK 2 — VERIFY "programs" AS THE R1/R2/R3 SPINE
1. Inspect public.programs columns and constraints. Confirm at minimum:
   id, program_code (unique), title, company_id, current_stage,
   pic_user_id, account_manager_user_id, lead_date, forecast_value,
   probability, weighted_value, needs_review, created_at, updated_at,
   source_file/source_sheet/source_row/row_hash (if present in live DB).
2. Verify FK chain from programs to:
   quotations(program_id), purchase_orders(program_id), invoices(program_id),
   payments(invoice_id -> invoices.program_id), training_sessions(program_id),
   pipeline_stage_history(program_id).
   For each relation report PRESENT / MISSING / referenced-column mismatch.
3. R1 support check:
   - Does public.cost_of_sales exist?
   - On NORMALIZED columns: invoice_id, invoice_no, invoice_value, collection,
     cost_of_sales_amount, mimos_academy_cost, commission, bro_incentive,
     net_profit (generated or plain?), profit_percentage, had_formula_error,
     source_file/source_row, created_at.
   - Report whether commit_import_batch() (if present) can INSERT into it
     without error (compare the INSERT column list of 0004_production_commit_engine.sql
     against the live cost_of_sales columns).
   - Does vw_r1_income_statement exist and query successfully?
4. R2 support check:
   - Does public.participant_counts and public.participant_roster exist?
   - Does vw_r2_overall_report exist and query successfully?
   - For R2 output, does training_sessions.program_id join programs correctly?
5. R3 support check:
   - Does vw_r3_sales_funnel exist and return rows? What columns does it expose?
6. Report overall verdict for programs as R1/R2/R3 spine with PASS / PARTIAL / FAIL.

TASK 3 — VERIFY DATA-LOAD STATE (2026 workbooks)
Run and paste counts:
   select count(*) from public.programs;
   select count(*) from public.companies;
   select count(*) from public.quotations;
   select count(*) from public.purchase_orders;
   select count(*) from public.invoices;
   select count(*) from public.payments;
   select count(*) from public.training_sessions;
   select count(*) from public.cost_of_sales;      -- if table exists
   select count(*) from public.participant_counts; -- if table exists
   select count(*) from public.data_quality_exceptions;
   select count(*) from public.import_batches where status in ('COMPLETED','COMMITTED','READY');
   select count(*) from public.programs where program_code like '2026-SALES-%';
   select count(*) from public.programs where program_code like '2026-INV-%';
Report whether the 2026 load appears present (the repo marker claims ~127 companies,
~183 programs, ~21 quotations, 1 PO, ~29 invoices, 15 payments, 29 training sessions).

TASK 4 — RLS & SECURITY VERIFICATION
1. For every public table, report relrowsecurity = true/false.
2. List all RLS policies per table, focusing on:
   programs, quotations, purchase_orders, invoices, payments, cost_of_sales,
   training_sessions, participant_counts, participant_roster, import_batches,
   import_staging, data_quality_exceptions, company_alias_map, audit_log.
   Use:
   select schemaname, tablename, policyname, cmd, roles, qual, with_check
   from pg_policies
   where schemaname='public'
   order by tablename, policyname;
3. Evaluate against the architecture rule set (01-ARCHITECTURE.md §5.2 and
   02-schema.sql §8):
   - super_admin: everything.
   - admin: full business data + import + DQ + settings.
   - manager: dashboards, reports, resolve exceptions; must NOT import/manage users.
   - pic: read & write only on items they own
     (pic_user_id = auth.uid() OR account_manager_user_id = auth.uid());
     may insert payments-related follow-ups but must NOT edit historical
     invoice/payment/cost amounts.
   - viewer: read-only.
   - Financial tables invoices / payments / cost_of_sales: UPDATE/DELETE should be
     limited to super_admin/admin only.
4. Explicitly check for the old permissive overlap from migrations 0001/0002:
   policies named quotation_write, po_write, invoice_write, payment_write,
   training_write, dqe_write. Report whether they still exist alongside the
   granular policies and whether they allow manager or pic to UPDATE/DELETE
   invoices/payments.
5. Check how roles are resolved in live RLS:
   - Does public.current_user_role() exist and return the role from
     public.profiles by auth.uid()?
   - Does public.current_role() exist and rely on auth.jwt()->>'role'?
   - Is a Supabase custom_access_token_hook / JWT role claim configured?
   Report which mechanism is actually active on the live project.
6. Run (as an authenticated admin/manager only, never as anon/service role):
   select public.current_user_role();
   Do NOT attempt to disable RLS or to create temporary bypass roles.

TASK 5 — IMPORT ENGINE & SCHEMA DRIFT CHECK
1. Check whether import_batches/import_staging follow migration 0003 shape or
   blueprint 02-schema.sql shape. Report which column set/status vocabulary is
   live (e.g. source_type vs storage_path; created_by vs uploaded_by;
   batch_id/source_row_number/raw_data vs import_batch_id/source_row/raw_json).
2. Check whether import_staging has: validation_status/matching_status,
   target_table, target_record_id, and (from PR #5 0006) matching_confidence,
   matching_rule. Report which exist.
3. Verify whether the import pipeline is actually wired end-to-end on the
   deployed app:
   - Does the Vercel app expose /api/import/batches, /api/import/batches/{id},
     /api/import/batches/{id}/staging, /api/import/commit,
     /api/import/commit/rollback, /api/import/quotations,
     /api/import/invoices, /api/import/cost-of-sales, /api/import/exceptions?
   - Trace whether any deployed route or code path calls matchImportStaging()
     or persistMatchingResults() before commit. If not, state that commit can
     currently only succeed if staging rows are manually given a valid
     matching_status AND a target_record_id.
4. Check whether public.commit_import_batch() (if present) would fail on a row
   that targets cost_of_sales (compare the INSERT column list against live
   cost_of_sales columns / generated columns).

TASK 6 — VERCEL DEPLOYMENT VERIFICATION
1. Identify the live Vercel project + production URL (mask host if desired but
   report full production URL as that is public).
2. Report the production branch configured in Vercel and the last deployed commit
   SHA / deployment ID.
3. Report the environment variables present in Production. Enumerate NAMES and
   confirm forward/back compatibility. The app expects:
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   The app must NOT have SUPABASE_SERVICE_ROLE_KEY or any secret in a
   NEXT_PUBLIC_* variable. Confirm those are absent from browser-exposed vars.
4. Check Supabase Auth configuration:
   - Site URL.
   - Redirect URLs contains the production Vercel URL.
   - Email/Password provider enabled.
   - Whether email confirmation is enabled (affects first-login bootstrap).
5. Smoke test with curl and report exact HTTP status codes:
   GET https://<production-url>/              -> expect 307 to /login
   GET https://<production-url>/login         -> expect 200 + HTML "MIMOS Academy"
   GET https://<production-url>/dashboard     -> expect 307 to /login when unauthenticated
   GET https://<production-url>/dashboard/programs      -> expect 307 to /login
   GET https://<production-url>/api/import/batches      -> expect 405 (POST-only)
   GET https://<production-url>/api/import/batches/00000000-0000-0000-0000-000000000000 -> expect 401 JSON AUTH_REQUIRED
6. Check whether Vercel build succeeded and whether vercel.json (crons for
   /api/cron/aging-recalc, /api/cron/action-digest) is deployed. If not, report
   it as not present (the architecture calls for it, but it is currently not in
   the repo baseline).

TASK 7 — QUERY SAFETY / EXECUTION SUMMARY
- State whether you made any change to Supabase or Vercel. Expected: NONE
  (read-only audit). If you only inspected, say so explicitly.
- If you must run a non-destructive query that might be slow, keep it limited
  and report the query you ran.

REPORT — MANDATORY FORMAT (Paste exactly as shown, fill every field)
```
PROJECT REF: <masked> / REGION: <region>
BASELINE COMMIT CHECKED: <sha or PR#>
SUPABASE INVENTORY:
  Tables: <list PASS/MISSING/MISMATCH>
  Views: <PASS/MISSING>
  Functions: <PASS/MISSING>
  Enums: <PASS/MISSING>
  Trigger: <PASS/MISSING>
  RLS enabled table count: <x/y>
PROGRAMS R1/R2/R3 VERDICT:
  R1: <PASS|PARTIAL|FAIL> — <one-line reason>
  R2: <PASS|PARTIAL|FAIL> — <one-line reason>
  R3: <PASS|PARTIAL|FAIL> — <one-line reason>
  FK chain: <PASS|PARTIAL|FAIL> — <one-line reason>
RLS VERDICT: <PASS|PARTIAL|FAIL>
  Key deviation(s): <list concrete policy names + role it wrongly allows>
  Role mechanism active: <current_user_role() | current_role()/JWT | unknown>
DATA-LOAD STATE:
  programs=<n> companies=<n> quotations=<n> invoices=<n> training=<n>
  2026-SALES=<n> 2026-INV=<n> cost_of_sales=<n>
  Data load present: <YES|NO|UNKNOWN>
IMPORT PIPELINE: <WIRED|NOT_WIRED|PARTIAL>
  Explanation: <one paragraph>
COST_OF_SALES MISMATCH: <NONE|MISMATCH — list>
IMPORT_BATCHES/STAGING SHAPE: <migration-0003 | 02-schema | mixed | unknown>
VERCEL:
  URL=<url> production_branch=<branch> deployed_sha=<sha or id>
  env_names=<names present>
  secrets_in_next_public=<none|list names — do NOT print values>
  auth_site_url=<value> redirects_includes_prod=<yes|no>
  smoke=<for each URL: HTTP status + expected result>
  vercel_json_crons=<present|absent>
TOP BLOCKERS (ranked):
  1. <issue>
  2. <issue>
  ...
NEXT ACTION RECOMMENDATION: <2-3 bullets, no code changes made>
CHANGES MADE BY THIS ASSISTANT: NONE (read-only)
```

END PROMPT
````

---

## 3. Cadangan seterusnya selepas ChatGPT balas

1. Masukkan `REPORT` ChatGPT ke dalam Arena untuk semakan Code-Side.
2. **Jangan deploy ke production** sebelum resolusi blockers:
   - Samakan satu source-of-truth schema (cadangan: jadikan `supabase/migrations` sebagai canonical; `02-schema.sql` sebagai blueprint sahaja).
   - Selesaikan/merge PR #5 (0005–0007) selepas conflict resolution.
   - Wire matching engine (`matchImportStaging` → `persistMatchingResults` → set `target_record_id`) sebelum commit.
   - Betulkan RLS financial write (admin only) dan drop polisi lama permissif.
   - Regenerate `types/database.ts` selepas schema diselaraskan.
3. Selepas verification lulus, teruskan Phase 1 pembinaan skrin R1/R2 dan import/data-quality center.
