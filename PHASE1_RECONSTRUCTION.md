# Phase 1 Reconstruction — Repository Ownership Decision Record

> **Keputusan pemilik (2026-08-30):** Repo dianggap rosak/bermasalah, tiada
> environment live/sandbox yang boleh dipercayai, dan semua keputusan fakulti
> berada pada Architecture Owner. Dokumen ini merekodkan keputusan dan
> pembinaan semula.

---

## 1. Keputusan muktamad

| Isu | Keputusan |
|---|---|
| Sumber skema yang boleh dijalankan | **`supabase/migrations/`** sahaja. `02-schema.sql` = blueprint/rujukan sahaja. |
| Deployment/live | Dianggap **tidak wujud** sehingga terbukti sebaliknya. Tiada rawatan ke atas Supabase/Vercel di sisi repo ini. |
| Bot GPT / external connector | **Bukan sumber kebenaran.** Hasil GPT adalah input sahaja; semua perubahan dikawal oleh repo/branch `arena/01a05068-masb-pms-v3`. |
| Mekanisme role RLS | **`public.current_user_role()`** (lookup `profiles`) — satu-satunya mekanisme yang wujud dalam migrations. `current_role()` dicantumkan ke mekanisme yang sama untuk konsistensi blueprint. |
| RLS kewangan | `invoices`, `cost_of_sales`: INSERT oleh `super_admin/admin/manager`; `payments`: INSERT oleh `super_admin/admin/pic`; UPDATE/DELETE ketiga-tiga = `super_admin/admin` sahaja. |
| Commit engine `cost_of_sales` | Guna **migration `0009`** (tanpa `DROP COLUMN`). Jangan guna PR-#5 `0007`. |

---

## 2. Urutan migration yang mesti digunakan (dari repo)

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
20260829012000_seed_2026_excel_data.sql
20260829012100_seed_2026_excel_rows.sql
20260829012200_seed_2026_workbook_rows.sql
20260829012300_seed_2026_data_audit.sql
```

Nota:
- `0006` diperlukan untuk fresh DB supaya `matching_confidence`/`matching_rule`
  wujud; pada DB live yang sudah ada kolum ini ia adalah no-op.
- `0007` **jangan digunakan** — ia mengandungi `DROP COLUMN net_profit`.
- `0008` perlu didahului oleh jadual `cost_of_sales` (dicipta oleh `0005`);
  migration ini juga mengendalikan DB yang belum ada jadual tersebut.
- `0009` menggantikan `commit_import_batch()` dengan versi yang menyokong
  kedua-dua bentuk `net_profit`.

---

## 3. Apa yang telah dibina/selaraskan dalam repo ini

1. **`supabase/migrations/0005_reconcile_schema.sql`**
   - Menambah `contacts`, `status_dictionary`, `company_alias_map`,
     `cost_of_sales`, `participant_counts`, `participant_roster`.
   - Menambah ruang keturunan (`source_file/source_sheet/source_row/row_hash`)
     pada `programs`.
   - Menambah `vw_r1_income_statement`, `vw_r2_overall_report`.
   - RLS untuk semua jadual baru.

2. **`supabase/migrations/0006_matching_resolution.sql`**
   - Menambah `import_staging.matching_confidence`, `matching_rule` + indeks.

3. **`supabase/migrations/0008_restrict_financial_update_delete_rls.sql`**
   - INSERT/UPDATE/DELETE kewangan mengikut peranan yang ditetapkan di atas.
   - Memastikan `cost_of_sales INSERT` dikekalkan (sebelum ini boleh hilang jika
     polisi `for all` digugurkan).

4. **`supabase/migrations/0009_safe_commit_engine_generated_net_profit.sql`**
   - Pengganti selamat PR-#5 `0007`. Tiada `DROP COLUMN`.
   - `commit_import_batch()` mengesan sama ada `net_profit` adalah generated
     atau plain, dan memasukkan nilai dengan betul.

5. **`lib/imports/matching-resolution-service.ts`**
   - Menyelesaikan `target_table` + `target_record_id` untuk
     quotation/invoice/cost-of-sales.

6. **`app/api/import/[batchId]/match-engine/route.ts`** dan
   **`app/api/import/[batchId]/match/route.ts`**
   - Melengkapkan pipeline: parse → stage → match-engine → match → commit.

7. **`lib/imports/matching-engine.ts`**
   - Setuju dengan enum `ImportMatchingStatus`; duplicate dikesan via metadata,
     bukan `matching_status='DUPLICATE'` (yang tidak sah di DB).

8. **`lib/imports/exception-service.ts`**
   - Tidak lagi merujuk status DB yang tidak wujud (`DUPLICATE`).

9. **`types/database.ts`**
   - Selaras dengan migration set: tambah semua jadual/view R1/R2, `import_commit_log`,
     `matching_confidence`/`matching_rule`, dan provenance columns.

10. **`02-schema.sql`**
    - Bertukar menjadi blueprint (bukan executable).
    - Fungsi role dan RLS kewangan diselaraskan dengan migration kanonik.

11. **R2 import + commit engine**
    - `lib/imports/r2-overall-parser.ts` — two-pass parser Overall + Attendance.
    - `lib/imports/r2-import.ts` — staging R2 rows.
    - `app/api/import/r2/route.ts` — upload R2 workbook.
    - `supabase/migrations/0010_r2_commit_engine.sql` — `commit_r2_batch()`
      (companies → programs → training_sessions → participant_counts).
    - `app/api/import/r2/commit/route.ts` — commit R2 batch.
    - `participant_counts` kini menyokong `workshop_count` + `training_count`.

12. **Skrin R1 & R2**
    - `/dashboard/r1` membaca `vw_r1_income_statement`.
    - `/dashboard/r2` membaca `vw_r2_overall_report`.
    - Navigasi sidebar dikemas kini.

13. **Executive Dashboard**
    - `/dashboard/executive` — aggregation R1/R2/R3 dalam satu halaman
      (gated `super_admin/admin/manager`).
    - Kad KPI: R3 forecast / weighted / secured; R1 invoiced / collected /
      outstanding / net profit; R2 sessions / participants.
    - Carta Recharts: pipeline by stage, R2 category, R1 payment status,
      R2 demographics, dan R3 forecast/weighted/secured.

14. **Import & Data Quality Center**
    - `/dashboard/imports` — senarai batches, exceptions, dan upload workbook.
    - `components/imports/import-center-client.tsx` — upload Quotation / Invoice /
      Cost of Sales / R2 melalui API routes yang disediakan.
    - Boleh jalankan **Match → Resolve → Commit** terus dari UI untuk setiap batch
      (R2 menggunakan `POST /api/import/r2/commit`).
    - Pautan dashboard (`Invoices`, `Training Sessions`) diubah ke `/r1` dan `/r2`
      supaya tidak lagi menunjuk laluan yang belum wujud.

---

## 4. Status sahkan

- `npm run typecheck` → PASS
- `npm run build` → PASS
- Route tree kini termasuk:
  - `/api/import/{batchId}/match-engine`
  - `/api/import/{batchId}/match`

---

14. **R3 / Sales Pipeline**
    - `lib/imports/r3-funnel-parser.ts`, `office-funnel-parser.ts`,
      `sales-report-parser.ts` — parse R3 funnel, office funnel, dan sales report.
    - `lib/imports/r3-import.ts` + `app/api/import/r3/route.ts` — stage semua
      tiga sumber.
    - `supabase/migrations/0011_r3_commit_engine.sql` + `commit_r3_batch()`;
      `app/api/import/r3/commit` — commit companies → programs →
      pipeline_stage_history, dengan sales-report cross-check.
    - Import Center menyokong upload 3 fail R3 (R3 / Office / Sales) dan
      butang **Commit R3**.

15. **Data Quality actions UI** — masih belum dibangun; exceptions dipaparkan
    dalam Import Center tetapi belum ada butang resolve/ignore dari UI.

---

## 5. Perkara yang masih perlu diikuti (bukan blocker repo)

- `participant_roster` masih hanya di-*stage* (attendance list belum dipetakan
  secara deterministik ke sesi); commit participant roster memerlukan mapping
  yang lebih jelas daripada source workbook.
- Skrin UI Reports, Settings, dan Data Quality resolve/ignore masih belum
  dibangunkan.
- Setelah ada environment sebenar (jika ada), jalankan migrations mengikut
  urutan di atas, kemudian import `cost_of_sales_2026.xlsx`,
  `R2 Overall Report 2026 (1).xlsx`, dan R3 / sales pipeline workbooks.
