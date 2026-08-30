# MIMOS Academy PMS — Sistem Pengurusan R1/R2/R3

Built on **Next.js 15 (App Router) + TypeScript + Tailwind + Supabase**.

> **Phase 1 reconstruction note:** The repository has been treated as broken and
> reconstructed. `supabase/migrations/` is the **canonical executable schema**.
> `02-schema.sql` is the blueprint/reference document only. See
> `PHASE1_RECONSTRUCTION.md` for the decision record.

---

## Stack & scripts

- Next.js 15.5 / React 19 / TypeScript / Tailwind / ShadCN-style local components
- Supabase JS (`@supabase/ssr`) for authenticated server/browser clients
- `xlsx` for workbook parsing in import routes

```bash
npm install
npm run dev        # local development
npm run typecheck  # type safety
npm run build      # production build
```

---

## Repository layout

| Path | Purpose |
|---|---|
| `app/` | Next.js App Router pages and API route handlers |
| `components/` | UI primitives + feature components |
| `lib/imports/` | Parsers, matching, resolution, commit services for workbook imports |
| `lib/supabase/` | Browser/server clients and middleware session handling |
| `types/` | Supabase schema types (`types/database.ts`) |
| `supabase/migrations/` | **Canonical executable SQL schema** |
| `01-ARCHITECTURE.md` | Architecture blueprint |
| `02-schema.sql` | Blueprint/reference schema (NOT the applied executable set) |
| `PHASE1_RECONSTRUCTION.md` | Reconstruction decision record + migrate order |

---

## Routes

### Pages
- `/` → redirects to `/dashboard`
- `/login`
- `/dashboard`
- `/dashboard/action-center`
- `/dashboard/programs`
- `/dashboard/programs/[code]`
- `/dashboard/r1` — R1 Income Statement (`vw_r1_income_statement`)
- `/dashboard/r2` — R2 Overall Report (`vw_r2_overall_report`)
- `/dashboard/executive` — Executive R1/R2/R3 overview
- `/dashboard/imports` — Import & Data Quality Center

### Import APIs
- `POST /api/import/quotations` — stage Quotation Tracker
- `POST /api/import/invoices` — stage Invoice 2026
- `POST /api/import/cost-of-sales` — stage Cost of Sales
- `POST /api/import/r2` — stage R2 Overall + Attendance
- `POST /api/import/r2/commit` — commit R2 batch (`commit_r2_batch`)
- `POST /api/import/r3` — stage R3 funnel / office funnel / sales report
- `POST /api/import/r3/commit` — commit R3 batch (`commit_r3_batch`)
- `POST /api/import/batches` — create batch
- `GET/PATCH /api/import/batches/[batchId]` — inspect/update batch
- `POST /api/import/batches/[batchId]/staging` — stage rows
- `POST /api/import/[batchId]/match-engine` — run matching engine
- `POST /api/import/[batchId]/match` — resolve domain targets
- `POST /api/import/commit` — commit via `commit_import_batch`
- `POST /api/import/commit/rollback` — rollback via `rollback_import_batch`
- `GET/POST /api/import/exceptions` and `PATCH /api/import/exceptions/[id]`

---

## Environment variables

`.env.example` is the template. The app uses a publishable/anon key only:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable/anon key>
```

Never place a `service_role`/secret key in any `NEXT_PUBLIC_*` variable.

---

## Database migrations (canonical order)

```
0001_phase1.sql
0002_harden_rbac_rls.sql
0003_import_foundation.sql
0004_production_commit_engine.sql
0005_reconcile_schema.sql
0006_matching_resolution.sql
0008_restrict_financial_update_delete_rls.sql
0009_safe_commit_engine_generated_net_profit.sql
0010_r2_commit_engine.sql
0011_r3_commit_engine.sql
20260829012000_seed_2026_excel_data.sql
20260829012100_seed_2026_excel_rows.sql
20260829012200_seed_2026_workbook_rows.sql
20260829012300_seed_2026_data_audit.sql
```

- Do **not** apply the old PR-#5 `0007`; it contains `DROP COLUMN net_profit`.
  Use `0009` instead.
- After migration, run `npm run typecheck && npm run build` before deploy.
