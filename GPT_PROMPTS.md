# Prompts for the GPT assistant (Supabase + Vercel access)

Code-side work happens in this repo (Arena agent, current branch `arena/01a05057-masb-pms-v3`).
GPT handles the things that need live Supabase/Vercel access. Copy-paste one prompt
per task, in order. Paste GPT's "REPORT" blocks back into the Arena chat so the code
side can react.

---

## ⚠️ Read first — branch topology (as of 2026-08-30)

| Branch | State |
|---|---|
| `main` | The v3 rebuild **with the full import engine** (migrations 0001–0004, matching engine, commit/rollback RPCs). Contains fix PR #4. |
| `phase1-production` | The currently-deployed line (per `VERCEL_DEPLOYMENT_CHECKLIST.md`), 82 commits of UI work — but **missing the entire import engine** (no `lib/imports/matching-engine.ts`, no migrations 0003/0004). |
| PR #3 (open) | `phase1-production` → `main` |
| PR #4 (open) | `arena/01a04f1d-masb-pms-v3` → `main` (matching-engine DB vocabulary fix, missing `postcss.config.js`, `.gitignore`) |

**Recommended plan (Option A):** merge PR #3 into `main`, then merge PR #4 into `main`,
then point the Vercel production branch at `main`. Deploying `phase1-production` alone
ships an app whose database it cannot even create.

Possible merge conflicts: `package-lock.json` (regenerate with `npm install` if so).
The fixed files (`lib/imports/matching-engine.ts`, `lib/imports/exception-service.ts`,
`postcss.config.js`) don't exist on `phase1-production`, so they merge cleanly.

---

## Shared context block (paste at the top of every GPT session)

```
You are assisting with the MIMOS Academy PMS.
- Repo: github.com/SaidRazak881/masb_pms_v3 (Next.js 15 App Router + TypeScript + Tailwind + Supabase).
- Deployment target: Vercel project "masb-pms-v3". Checklist: VERCEL_DEPLOYMENT_CHECKLIST.md in the repo.
- Stack rules: the app only ever uses NEXT_PUBLIC_SUPABASE_URL and
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (anon/publishable key). NEVER put a
  service_role/secret key into any NEXT_PUBLIC_* variable, and never print full
  keys, DSNs, or passwords in chat — mask them (e.g. sb_url: https://xxxx.supabase.co).
- Database safety: this is a production-candidate project. Do NOT drop or truncate
  tables, do NOT delete rows, do not touch tables outside schema "public" and
  Supabase Auth. Migrations 0001–0004 are additive (create-if-missing style);
  run them in order and skip anything already applied. Seed migration
  20260829012000 is documented idempotent (safe to re-run).
- Before any schema change, note the project ref and confirm a backup/snapshot
  exists (Supabase daily backup or pg_dump).
- Always finish with a REPORT block so the results can be pasted back to the
  code-side agent.
```

---

## Prompt 1 — Supabase: inspect state, run migrations, verify

```
TASK: Bring the Supabase database up to the schema defined in the repo.

1. Connect to the Supabase project that the Vercel app "masb-pms-v3" will use
   (project ref + region: report them, masked).

2. INSPECT CURRENT STATE first — do not blind-run migrations:
   a) List existing public tables:
      select table_name from information_schema.tables where table_schema='public' order by 1;
   b) Row counts where tables exist (companies, programs, quotations, purchase_orders,
      invoices, payments, training_sessions, profiles, import_batches, import_staging).
   c) Whether these already exist: enum types (user_role, pipeline_stage,
      quotation_status, payment_status, r2_status), functions
      (current_user_role, commit_import_batch, rollback_import_batch, handle_new_user),
      trigger on_auth_user_created.

3. APPLY MIGRATIONS in this exact order, from supabase/migrations/ in the repo
   (branch with the import engine: main, or PR #4 branch):
     0001_phase1.sql
     0002_harden_rbac_rls.sql
     0003_import_foundation.sql
     0004_production_commit_engine.sql
     20260829012000_seed_2026_excel_data.sql   (idempotent data seed from invoice_2026 + sales_report)
     20260829012100_seed_2026_excel_rows.sql   (marker only, no-op)
     20260829012200_seed_2026_workbook_rows.sql (marker only, no-op)
   If a step fails because objects already exist, evaluate: skip if identical,
   report if structurally different. If any statement fails, STOP and report the
   exact error + statement — do not improvise fixes.

4. IMPORTANT data check: the two marker migrations claim the real 2026 workbook rows
   (156 sales rows, 29 invoice rows) were loaded "from the release environment".
   Verify whether that actually happened on this project:
     select count(*) from programs where program_code like '2026-SALES-%';
     select count(*) from programs where program_code like '2026-INV-%';
     select count(*) from invoices;
   If the counts are ~0, report that the production data load is MISSING (do not
   attempt to reconstruct it from the xlsx files in the repo root without asking).

5. VERIFY — run and include results verbatim:
     select pg_get_constraintdef(oid) from pg_constraint
       where conrelid='public.import_staging'::regclass and contype='c';
     -- expected to include: matching_status in ('PENDING','EXACT','ALIAS','COMPOSITE','FUZZY_REVIEW','AMBIGUOUS','NONE')
     select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
       where n.nspname='public' and c.relkind='r' order by 1;   -- every row must show true
     select proname from pg_proc where pronamespace='public'::regnamespace
       and proname in ('current_user_role','commit_import_batch','rollback_import_batch','handle_new_user');

REPORT:
- project ref (masked) + region
- what already existed vs what you created
- migration results (ok / skipped / FAILED + error text)
- verification query outputs
- the sales/invoice counts from step 4 and whether the 2026 data load is present
```

---

## Prompt 2 — Vercel: branch strategy, env vars, deploy, smoke test

```
TASK: Get the app deployed on Vercel with the correct code and env vars.

1. BRANCH RECONCILIATION (see the branch table the code-side agent provided):
   - Merge PR #3 (phase1-production -> main) into main.
   - Merge PR #4 (fix: matching engine vocabulary, postcss.config.js, .gitignore) into main.
   - If package-lock.json conflicts, regenerate: delete it, run `npm install`, commit.
   - In the Vercel project "masb-pms-v3", set the PRODUCTION BRANCH to `main`
     (the old checklist said phase1-production, but main is now the superset line).
   - Do not force-push or delete phase1-production / backup branches.

2. ENV VARS on the Vercel project (Production + Preview + Development):
     NEXT_PUBLIC_SUPABASE_URL          = https://<project-ref>.supabase.co
     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = <publishable/"anon" key>
   Rules: publishable key ONLY. Never service_role/secret keys. Never echo the full
   values back — confirm with first 6 + last 4 characters masked.

3. SUPABASE AUTH CONFIG:
   - Site URL = the production Vercel URL (https://masb-pms-v3.vercel.app or the
     custom domain if one is set).
   - Add that URL to Auth -> URL Configuration -> Redirect URLs.
   - Email/password provider enabled. If email confirmation is on, note it — the
     first admin must confirm before login.

4. DEPLOY main (build command `npm run build`, default Next.js settings).
   If the build fails, paste the FULL build log tail — do not patch code ad hoc;
   code fixes belong to the code-side agent.

5. SMOKE TEST the production URL with curl and include actual status codes:
     GET /                        -> expect 307 redirect to /login
     GET /login                   -> expect 200 and HTML containing "MIMOS Academy"
     GET /dashboard               -> expect 307 redirect to /login (unauthenticated)
     GET /dashboard/programs      -> expect 307 redirect to /login
     GET /api/import/batches      -> expect 405 (route only accepts POST)
   CSS FIX VERIFICATION (important): fetch the login page HTML, extract the
   /_next/static/css/*.css URL, fetch it, and confirm it does NOT contain the
   literal string "@tailwind" and DOES contain real utilities like ".flex{display:flex}".

REPORT:
- merged PRs + final commit SHA deployed
- production URL + production branch now set
- env var names present (values masked)
- Supabase Auth Site URL + redirect list
- smoke-test status codes + CSS verification result
- any build warnings worth attention
```

---

## Prompt 3 — First admin bootstrap + acceptance pass

```
TASK: Create the first admin user and run the acceptance checklist from
FIRST_ADMIN_BOOTSTRAP.md / VERCEL_DEPLOYMENT_CHECKLIST.md.

1. In Supabase Auth, create the first user (Email/Password). Use the admin email
   the project owner gives you; if you weren't given one, STOP and ask. Mask the
   email in your report. Confirm the email if confirmation is enabled.
2. The on_auth_user_created trigger should have created public.profiles row.
   Verify it exists, then promote:
     update public.profiles
     set role='super_admin', is_active=true, must_reset_password=false, updated_at=now()
     where email='<admin email>';
3. Sign in at <production-url>/login with that user and verify:
   - redirect to /dashboard
   - /dashboard, /dashboard/programs, /dashboard/action-center all load (HTTP 200)
   - dashboard widgets show real 2026 data (program/invoice counts > 0 if the
     data load was confirmed present in the DB task)
   - sign out works and protected routes redirect back to /login
4. Do NOT create extra users, do NOT modify other profiles rows, do NOT disable RLS.

REPORT:
- admin profile row (id masked, role, is_active)
- each acceptance item: PASS/FAIL + evidence (status code or screenshot description)
- anything that failed, with exact error text
```

---

## Prompt 4 — Supabase: apply the commit-target-resolution fix (migration 0007)

```
TASK: Fix the "Import-to-Commit pipeline gap" on Supabase production.

CONTEXT (from the code-side agent): `commit_import_batch` used to select staging
rows with `target_record_id is not null`, but nothing ever populated
`target_table`/`target_record_id` before commit, so every import commit was a
silent no-op (affected_records = 0). The code side has now:
- added POST /api/import/batches/[batchId]/match (runs matching + resolves
  target_table + sets batch to READY), and
- shipped migration 0007_fix_commit_target_resolution.sql, which replaces
  commit_import_batch so it (a) derives target_table from source_type when NULL
  and (b) no longer requires target_record_id pre-commit (the RPC INSERTs the
  record and back-fills target_record_id).

YOUR TASK:
1. Connect to the Supabase production project ref knzawodadepabxjpxkly.
   Confirm the current definition of commit_import_batch:
     select pg_get_functiondef('public.commit_import_batch(uuid)'::regprocedure);
2. Apply supabase/migrations/0007_fix_commit_target_resolution.sql from the repo
   branch `arena/01a05057-masb-pms-v3` (or main, whichever is current). It is a
   single CREATE OR REPLACE FUNCTION + GRANT; idempotent and safe to re-run.
3. VERIFY the new definition no longer contains `target_record_id is not null`
   in its SELECT/WHERE and does contain the source_type->target_table CASE.
   Re-run query #1 and confirm.
4. Do a SAFE, read-only sanity check (no deletes, no truncates):
   - select matching_status, count(*) from public.import_staging group by 1 order by 1;
   - select status, count(*) from public.import_batches group by 1 order by 1;
   - count rows eligible to commit:
       select count(*) from public.import_staging
       where validation_status='VALID'
         and matching_status in ('EXACT','ALIAS','COMPOSITE','FUZZY_REVIEW')
         and (target_table in ('quotations','invoices','cost_of_sales')
              or source_type in ('quotation_tracker','invoice_2026','cost_of_sales_2026'));

REPORT:
- project ref (masked) + whether migration 0007 already applied or was newly applied
- old vs new commit_import_batch definition status (before/after)
- the verification query outputs
- the read-only status/matching counts
- confirmation that commit_import_batch now accepts rows with target_record_id IS NULL
```

---

## After GPT reports back

Paste the REPORT blocks into the Arena chat. Known code-side follow-ups already
identified (Arena agent will handle on request):

1. **The import pipeline is not fully wired**: no route calls
   `matchImportStaging`/`persistMatchingResults`, and rows only become committable
   when they carry `matching_status` in the committable set **and** a
   `target_record_id`. Committing a batch today is a silent no-op. This needs code
   (matching + target resolution before commit).
2. If the 2026 workbook data load turns out to be missing on the live project
   (Prompt 1, step 4), decide: re-run the seed from the release environment vs.
   import through the app's own pipeline once the wiring above is done.
3. No tests / no ESLint yet — recommended before the first real import.
