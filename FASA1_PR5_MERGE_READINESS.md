# Fasa 1 — Post-GPT Action Plan & PR #5 Merge-Readiness Matrix

**Sorotan audit live (2026-08-30):**
- Project: `knzawodadepabxjpxkly` / ap-northeast-2 / Postgres 17.6.1
- Production: `https://masb-pms-v3.vercel.app` @ `main` `636d369`
- PR #5 head `0e3207a` **OPEN & CONFLICTING — belum production**

---

## A. Apa yang perlu dibetulkan dahulu (ranked)

### 1. 🔴 RLS kewangan — DALAM KERJA (migration 0008 disediakan)
Disahkan live:
```
invoice_update       -> current_user_role() in ('super_admin','admin','manager','pic')
payment_update       -> current_user_role() in ('super_admin','admin','manager','pic')
cost_of_sales_update -> current_user_role() in ('super_admin','admin','manager','pic')
```
**Repository action:** `supabase/migrations/0008_restrict_financial_update_delete_rls.sql` sudah dicipta dan di-commit (`8a036e0`). Ia menukar UPDATE/DELETE kepada `super_admin/admin` sahaja, mengekalkan `payment_insert` untuk PIC/managers dan SELECT.

**GPT/live action (setelah backup):**
```sql
-- safety first
select pg_database_size(current_database());  -- confirm backup/PITR
-- run migration 0008 contents via Supabase SQL Editor / supabase db push
select schemaname, tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('invoices','payments','cost_of_sales')
  and cmd in ('UPDATE','DELETE')
order by tablename, policyname;
-- PASS if every row shows (current_user_role() = ANY(ARRAY['super_admin','admin']))
```

---

### 2. 🔴 Import pipeline: matching tidak disambung ke production
Live DB `commit_import_batch()` masih perlukan:
- `matching_status IN ('EXACT','ALIAS','COMPOSITE','FUZZY_REVIEW')`
- `target_table IN ('quotations','invoices','cost_of_sales')`
- `target_record_id IS NOT NULL`

Baseline 636d369 tidak mempunyai route yang memanggil `matchImportStaging()` / `persistMatchingResults()` / `resolveMatchingTargets()`. PR #5 ada kod ini.

**Perlu:** merge PR #5 (bukan hanya deploy preview). Sebelum merge, selesaikan conflict dan sahkan migrations `0005–0007` + 0008.

---

### 3. 🟠 R1/R2 data kosong
- `cost_of_sales = 0` → belum masuk data.
- `participant_counts = 0`, `participant_roster = 0` → belum masuk data.
- `data_quality_exceptions = 0` → belum ada import batch yang diproses.

**Cadangan:** selepas PR #5 merge dan commit engine dites, import `cost_of_sales_2026.xlsx` melalui `POST /api/import/cost-of-sales`. R2 participant data memerlukan parser R2 yang belum wujud — jangan paksa data manual sebelum parser diuji.

---

### 4. 🟠 Sisa enums & `current_role()`
Live hanya 5/13 enums dan tiada `current_role()` (mekanisme aktif = `current_user_role()`). Kod/migration perlu konsisten dengan `current_user_role()`. Jangan lepak masa menambah 8 enum blueprint jika kod tidak menggunakannya; tambah hanya apabila skrin R2/status mapping dibina.

---

## B. PR #5 Merge-Readiness Matrix (audit terhadap live DB)

| Item dalam PR #5 | Fail/Route | Keperluan live DB | Ready? | Nota |
|---|---|---|---|---|
| `0005_reconcile_schema.sql` | Jadual/views R1,R2 | live sudah ada semua jadual + views (untuk DP yang sudah apply). Migration idempotent. | ✅ Selamat (idempotent) | Akan no-op pada live; selamat untuk fresh DB. |
| `0006_matching_resolution.sql` | `matching_confidence`, `matching_rule`, index | Perlu sebelum `resolveMatchingTargets()`. GPT belum confirm kolum ini wujud live. | ⚠️ **Wajib sebelum merge/preview** | `matching-resolution-service.ts` menulis kedua-dua kolum. |
| `0007_align_cost_of_sales_with_commit_engine.sql` | `cost_of_sales` plain `net_profit` | Live sudah plain numeric, sudah ada `invoice_no/invoice_value/collection/profit_percentage`. | ✅ Selamat (idempotent) | No-op pada live; diperlukan untuk fresh DB berbasis `02-schema.sql`. |
| `app/api/import/[batchId]/match-engine/route.ts` | POST `/match-engine` | Hanya perlu `import_staging`, `profiles`. | ✅ | Boleh deploy selepas 0006. |
| `app/api/import/[batchId]/match/route.ts` | POST `/match` | Perlu `matching_confidence`, `matching_rule` (0006). | ✅ selepas 0006 | Menetapkan `target_table`/`target_record_id`. |
| `lib/imports/matching-engine.ts` | matching + persist | `import_staging.matching_status` enum (`EXACT/ALIAS/COMPOSITE/AMBIGUOUS/NONE`). | ✅ | PR sudah selaraskan ke enum; bug `DUPLICATE` diselesaikan via metadata `duplicate=true`. |
| `lib/imports/matching-resolution-service.ts` | target resolution | Perlu `company_alias_map`, `companies`, `programs`, `quotations`, `invoices` (semua live ada) + `0006`. | ✅ selepas 0006 | Menggunakan `.ilike` + escaping %/_; lebih selamat berbanding baseline matching. |
| `lib/imports/exception-service.ts` | DQ exception | `import_staging.metadata`, bukan `matching_status='DUPLICATE'` (tidak wujud di DB). | ✅ | Selaras dengan matching engine baharu. |
| `types/database.ts` | Types | Perlu selaras dengan `0006` + jadual R1/R2. | ✅ | PR sudah menambah `cost_of_sales`, `participant_counts`, `participant_roster`, views, `matching_confidence/matching_rule`, `import_commit_log`. |
| `.gitignore`, `next-env.d.ts`, `package-lock.json` | build | — | ⚠️ Conflict source | Paling mungkin punca `CONFLICTING`. |

---

## C. Conflict & nota merge

1. **Punca conflict paling mungkin:** PR #5 branch berasaskan versi lama `types/database.ts`, `next-env.d.ts`, `package-lock.json`, dan `lib/imports/*`. 
2. **Cara resolve:** rebase/replay PR #5 ke `main` terkini (`636d369`). Jika perlu, regenerate:
   ```bash
   rm -f package-lock.json && npm install
   ```
3. **Jangan merge PR #5 ke production sebelum:** 
   - migration `0006` disahkan pada DB yang akan dipakai; 
   - migration `0008` ganti polisi RLS; 
   - satu smoke test `match-engine → match → commit` di environment bukan production/transactional.

---

## D. Urutan deploy yang disyorkan

```
1. Backup Supabase (PITR/pg_dump).                        [GPT]
2. Apply migration 0008 (RLS financial).                  [GPT]
3. Merge PR #5 ke main (rebase + conflict fix).           [GPT]
4. Apply 0005 -> 0006 -> 0007 -> 0008 pada target DB.     [GPT]
5. Re-deploy Vercel production branch = main.             [GPT]
6. Smoke test /api/import/* + 0008 RLS policy query.      [GPT]
7. Import cost_of_sales_2026.xlsx via POST
   /api/import/cost-of-sales.                             [GPT + app]
8. Sahkan vw_r1_income_statement tidak lagi null
   untuk cost_of_sales_amount/net_profit/profit_pct.      [GPT]
9. Kembangkan R2 parser (participant_counts/roster)       [Arena/Code]
   sebelum cuba muat data R2.
```

---

## E. Soalan seterusnya ke ChatGPT (copy-paste jika mahu terus)

```
TASK (read-only first, then only after you confirm backup):
1. Run ALTER/CREATE from repo migration 0008 to restrict invoices/payments/
   cost_of_sales UPDATE/DELETE to super_admin/admin. After applying, re-run
   the pg_policies query and paste the result.
2. Check whether live import_staging has columns matching_confidence and
   matching_rule. If missing, apply migration 0006 (00_additive). Paste
   information_schema.columns result.
3. Rebase PR #5 (head 0e3207a) onto main 636d369, resolve conflicts only in
   package-lock.json / next-env.d.ts / types/database.ts / lib/imports/*, do
   NOT touch business logic unless a conflict forces it. Paste the list of
   files you changed and the final mergeable status.
4. In a backup/staging context, test the sequence for one cost_of_sales row:
   POST /api/import/{id}/match-engine -> POST /api/import/{id}/match ->
   POST /api/import/commit. Paste statuses and any error text.

REPORT:
- migrations applied (0006/0007/0008) + policy verification
- import_staging new columns present yes/no
- PR #5 merge/rebase result + conflict files resolved
- end-to-end import test result (PASS/FAIL + exact error)
- remaining blockers
```
