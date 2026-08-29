# ARAHAN & LAPORAN UNTUK GPT — Masb PMS v3 (MIMOS Academy)

> **Kau = GPT.** Kau ada akses penuh ke: **GitHub repo** (`SaidRazak881/masb_pms_v3`),
> **Supabase project** (DB + Auth + Storage), dan **Vercel deploy**.
> Aku (Arena agent) telah siapkan bahagian code yang aku boleh; kau sambung kerja
> yang perlukan akses infra tersebut.
> **Branch kerja kau:** `arena/01a04daa-masb-pms-v3` (jangan guna branch lain).
>
> Hantar balik laporan ringkas selepas setiap langkah: apa kau buat, apa kau jumpa,
> apa yang belum siap.

---

# 🔄 LAPORAN ARENA AGENT → GPT (2026-08-29)

## A. Keputusan review kerja GPT (Matching Resolution)

Aku dah pull branch `arena/01a04daa-masb-pms-v3` (sekarang pada commit `b5339b1`),
review **3 fail** yang kau tambah, dan jalankan **typecheck + build penuh**.

| Perkara | Keputusan |
|---|---|
| `supabase/migrations/0006_matching_resolution.sql` | ✅ Fungsional (additive: tambah `matching_confidence` + `matching_rule`, 2 index) |
| `lib/imports/matching-resolution-service.ts` | ✅ Logik deterministik betul (quotation → program, invoice → quotation/invoice → program, cost_of_sales → invoice) |
| `app/api/import/[batchId]/match/route.ts` | ✅ Betul (auth + role gating, return count) |
| `npm run typecheck` | ✅ **PASS** (selepas aku regenerate types — lihat §B) |
| `npm run build` | ✅ **PASS** (route `/api/import/[batchId]/match` muncul) |

**Apa yang berubah dalam repo selepas review (commit baru dari aku):**
- **`types/database.ts`** — **ARENA REGENERATED (manual)**. Sebelum `tsc`, `tsc` **GAGAL**
  dengan error: `company_alias_map does not exist on ...` kerana `types/database.ts`
  (check-in lama) tidak tahu table yang kau & migration `0005` cipta
  (`company_alias_map`, `cost_of_sales`, `contacts`, `status_dictionary`,
  `participant_counts`, `participant_roster`, `import_commit_log`, `vw_r1_income_statement`,
  `vw_r2_overall_report`, + kolum `matching_confidence`/`matching_rule`).
  Aku tambahkan semua itu supaya build lulus. **⚠️ Ini regenerate MANUAL — kau WAJIB
  regenerate semula dengan `supabase gen types` selepas push migration** supaya ia
  `exact match` dengan Postgres (lihat §B.2).

## B. Arahan BLOCKING untuk GPT (buat ini dulu)

### B.1 Apply migration `0005` + `0006` ke Supabase
```bash
supabase link --project-ref <PROJECT_REF>
supabase db push            # apply 0001..0006
```
Sahkan tiada relation error, RLS enabled, dan view R1/R2 wujud:
```sql
select relrowsecurity from pg_class where relkind = 'r';  -- semua 't'
select * from public.vw_r1_income_statement limit 5;
select * from public.vw_r2_overall_report limit 5;
```

### B.2 Regenerate types (WAJIB — gantikan fail manual aku)
```bash
supabase gen types typescript --project-id <PROJECT_REF> > types/database.ts
```
Kemudian `npm run typecheck` & `npm run build` untuk sahkan ia masih lulus.

## C. Arahan seterusnya (selepas migration dipush)

1. **Test end-to-end pada staging batch (bukan production):**
   - `POST /api/import/quotations` (upload `00. Quotation Tracker (1).xlsx`)
     → `POST /api/import/{batchId}/match` → `POST /api/import/commit`.
   - Ulang untuk `invoice_2026.xlsx` dan `cost_of_sales_2026.xlsx`.
   - Sahkan `target_table`/`target_record_id` di-set dan `commit_import_batch`
     return `inserted_quotations` / `inserted_invoices` / `inserted_cost_of_sales`.
2. **Bootstrap admin** (Auth invite per `FIRST_ADMIN_BOOTSTRAP.md`, set `role='super_admin'`).
3. **Deploy Vercel** ikut `VERCEL_DEPLOYMENT_CHECKLIST.md` — branch `arena/01a04daa-masb-pms-v3`,
   build `npm run build`, env `NEXT_PUBLIC_SUPABASE_URL` +
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (bukan service-role).
4. Set Supabase Auth Site URL / redirect URL ke URL Vercel production.

## D. Nota / kebimbangan kecil (bukan blocking)

- **`ilike` wildcard:** dalam `resolveCompany`/`resolveProgram` kau guna `.ilike(name)`.
  Nama yang mengandungi `%`/`_` akan dianggap pattern SQL. Untuk nama client sebenar
  (cth. `MIMOS Berhad`) ini selamat, tetapi elok tambah escape atau guna `.eq()` dengan
  `lower()` bila nama itu nilai tepat. **Cadangan:** untuk alias/company exact, guna
  `.or()` dengan `lower(alias_text) eq <lowername>` supaya tiada wildcard.
- **Dua lapisan matching:** `matching-engine.ts` (Sprint 2) set `matching_status`
  (`EXACT`/`ALIAS`/`COMPOSITE`/`NONE`/`AMBIGUOUS`) dan tulis detail ke `metadata`;
  `matching-resolution-service.ts` (Sprint 3) tulis `matching_confidence`/`matching_rule`
  dan set `target_table`/`target_record_id`. Kedua-duanya konsisten & komplementari —
  **order operasi mesti: matching (2) → resolution (3) → commit (3A).** Jangan skip.
- `target_record_id` untuk quotation/invoice **baru** = `program.id` (bukan id akhir),
  manakala untuk yang **sedia ada** = id objek. `commit_import_batch()` hanya guna la
  sebagai gating (`is not null`), jadi ini OK; ia re-resolve dalam transaction. Jangan
  jadikan `target_record_id` sebagai FK yang ketat melainkan kau update commit engine.
- **Audit trigger (`fn_audit_trigger`) belum ada** — `audit_log` kosong sehingga
  ditambah. Follow-up, tidak blocking.

## E. Format laporan balik (guna template ni)

```
### Step N: <nama step>
- Status: ✅ / ⏳ / ❌
- Apa kau buat:
- Apa kau jumpa (error/pelik):
- Bukti/saiz (cth. baris di-commit, exceptions):
- Perlukan Arena agent buat apa:
```

---

## 1. STATUS SEMASA (sudah disahkan dalam repo oleh Arena agent)

| Perkara | Status |
|---|---|
| `npm install` | ✅ OK (170 packages, 3 nota audit) |
| `npm run typecheck` (`tsc --noEmit`) | ✅ **PASS** |
| `npm run build` (`next build`, Next.js 15.5.24) | ✅ **PASS** (12 route, tiada error) |
| Bug matching-engine (kolum tak wujud / enum tak selari) | ✅ **FIXED** |
| Schema tak lengkap (`cost_of_sales`, `company_alias_map`, view R1/R2, dll) | ✅ **MIGRATION `0005` DISEDIAKAN** (belum dipush) |
| `.gitignore` | ✅ **DITAMBAH** |
| `import → staging → matching → commit` flow end-to-end | ❌ **BELUM DIWIRE** (ini kerja utama kau) |
| Supabase: `db push`, Auth bootstrap, seed | ⏳ **BELUM** |
| Vercel deploy | ⏳ **BELUM** |

**Failed yang dah di-fix dalam session ini (commit `864c825`, `8b7602d`):**
- `lib/imports/matching-engine.ts` — now uses enum sebenar `ImportMatchingStatus`
  (`EXACT`/`ALIAS`/`COMPOSITE`/`NONE`/`AMBIGUOUS`), simpan confidence + detail match
  ke dalam `import_staging.metadata` jsonb (bukan kolum `matching_confidence`/
  `matching_metadata` yang tak wujud). Duplicate → `AMBIGUOUS` + `metadata.duplicate=true`.
- `lib/imports/exception-service.ts` — detect duplicate via `metadata.duplicate`;
  `NONE`/`AMBIGUOUS` (bukan `PENDING`) = UNMATCHED.
- `supabase/migrations/0005_reconcile_schema.sql` — baru.
- `.gitignore` — baru (ignore `node_modules`, `.next`, `.env*`).

---

## 2. BLOKER KRITIKAL #1: Schema tidak lengkap — **KAJIAN PUSH MIGRATION `0005`**

Migration `0001`–`0004` yang sudah digunakan **tidak lengkap**. Fungsi
`public.commit_import_batch()` dan `rollback_import_batch()` (dalam `0004`)
merujuk kepada jadual yang **tidak pernah dicipta** → runtime error
`relation "public.cost_of_sales" does not exist`. Ini sebab import/commit flow
selalunya gagal secara senyap.

**Aku dah tulis** `supabase/migrations/0005_reconcile_schema.sql` (additive &
idempotent: `create table if not exists`, `create or replace view`, `drop policy if exists`).
Ia mencipta:

| Objek | Sebab perlu |
|---|---|
| `cost_of_sales` | Target `INSERT` bagi `commit_import_batch()`; dibaca oleh `CostOfSalesParser` & view R1. Nama kolum selari dengan engine. |
| `company_alias_map` | Di-join oleh `commit_import_batch()` untuk resolve alias → `companies` canonical. Tanpa ini fungsi gagal. |
| `contacts` | Rekod contact master-data. |
| `status_dictionary` | Vocab terkawal raw→canonical status. |
| `participant_counts` | Baris untuk `vw_r2_overall_report` (Bumi/Non-Bumi per kategori). |
| `participant_roster` | Baris kehadiran individu (cert tracking). |
| `vw_r1_income_statement` | Read-model R1. |
| `vw_r2_overall_report` | Read-model R2. |

**LANGKAH KAU:**
```bash
cd path/to/masb_pms_v3
# pastikan push branch ini dulu (lihat §6), kemudian:
supabase link --project-ref <PROJECT_REF>
supabase db push                  # apply 0001..0005
```
Sahkan tiada ralat relation, kemudian:
```sql
-- setiap jadual mesti RLS enabled (relrowsecurity = true)
select relrowsecurity from pg_class where relkind = 'r';
-- pastikan `social`? Tidak. Semak view R1/R2 wujud:
select * from public.vw_r1_income_statement limit 5;
select * from public.vw_r2_overall_report limit 5;
```
Kemudian **regenerate types** supaya app kenal view baru:
```bash
supabase gen types typescript --project-id <PROJECT_REF> > types/database.ts
```
> Nota: `types/database.ts` sekarang BELUM ada `cost_of_sales`,
> `participant_counts`, `vw_r1_income_statement`, `vw_r2_overall_report` kerana
> ia dicipta oleh `0005`. Regenerate selepas push.

---

## 3. BLOKER KRITIKAL #2: Import/commit flow tidak diwire end-to-end — **KAJIAN TAMBAH ROUTE `/match`**

Pustaka dah lengkap (parser → staging → matching → exceptions → commit/rollback),
**tetapi tiada route yang menggerakkannya end-to-end.** Kini:

- `importInvoiceWorkbook`/`importQuotationWorkbook`/`importCostOfSalesWorkbook`
  → stage baris dengan `matching_status='PENDING'`, `target_table=null`,
  `target_record_id=null`, `metadata={parser,error_message,warning_message}`.
- `public.commit_import_batch()` (SQL, 0004) **hanya memproses** staging rows dengan
  `validation_status='VALID'` DAN `matching_status in ('EXACT','ALIAS','COMPOSITE','FUZZY_REVIEW')`
  DAN `target_record_id IS NOT NULL` DAN `target_table in ('quotations','invoices','cost_of_sales')`.
- Tiada route yang memanggil `matchImportStaging()` + `persistMatchingResults()`,
  dan tiada step yang set `target_table`/`target_record_id`.

**KESANNYA:** batch tak pernah jadi "committable". `POST /api/import/commit`
dan `POST /api/import/commit/rollback` dah wujud & berfungsi — tetapi ia hanya
akan commit selepas baris di-match/set target.

**LANGKAH KAU:** Tambah satu route `POST /api/import/[batchId]/match`
(yang panggil `matchImportStaging` → `persistMatchingResults`), dan untuk setiap
baris yang berjaya di-match, set `target_table` + `target_record_id`:

1. **Quotation vs program:** cari `programs` oleh `project_title` (normalized) dan
   company; jika jumpa set `target_table='quotations'`, kemudian `commit_import_batch`
   akan buat quotations.
2. **Invoice:** cari `programs` oleh `program_code`/company; cari `quotations` oleh
   `quotation_number`; set `target_table='invoices'`, `target_record_id` = program id.
3. **Cost of sales:** cari `invoices` oleh `invoice_number`; set
   `target_table='cost_of_sales'`, `target_record_id` = invoice id. **Ini mesti ada**,
   jika tidak `commit_import_batch` skip baris cost_of_sales.

Kau boleh tambah route ini dalam Next.js (`app/api/import/[batchId]/match/route.ts`)
atau sebagai Supabase Edge Function. Pastikan `runtime='nodejs'` dan guna
`requireImportUser` (super_admin/admin/manager) seperti route lain.

---

## 4. Supabase Setup — **KAJIAN**

Ikut `VERCEL_DEPLOYMENT_CHECKLIST.md`, `FIRST_ADMIN_BOOTSTRAP.md` dan repo:

1. Sahkan extension: `pgcrypto`, `pg_trgm`.
2. Auth: Email/Password enabled, **public signup disabled** (invite-only), Site URL
   + redirect URLs set ke production Vercel URL.
3. **JANGAN migrasikan password default `masb.12345`.** Guna invite flow
   (`supabase.auth.admin.inviteUserByEmail`); setiap user set password sendiri.
4. Buat Storage buckets: `imports` (private), `exports` (private, signed URL).
5. Pastikan trigger `on_auth_user_created` (0001) cipta `profiles`; kemudian set
   role admin → `super_admin` (lihat `FIRST_ADMIN_BOOTSTRAP.md`).
6. Seed `status_dictionary` dari vocab mentah dalam `01-ARCHITECTURE.md`
   (funnel 7-stage R3, 4-stage office_funnel, `Sent`/`sent`, `PAID`/`paid`).

---

## 5. Vercel Deploy — **KAJIAN**

- Connect repo ke project Vercel `masb-pms-v3`.
- Deploy **branch `arena/01a04daa-masb-pms-v3`** (bukan `phase1-production` yang
  tak wujud dalam branch ini).
- Build command: `npm run build` (dah disahkan green).
- Env vars (Production + Preview):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  ← **JANGAN** letak service-role key di sini
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only, untuk script/cron)
  - `CRON_SECRET` (optional sehingga cron ditambah)
- Set Supabase Auth Site URL / redirect URL ke production Vercel URL.
- Sahkan `/login`, login → `/dashboard`, `/dashboard/action-center`,
  `/dashboard/programs` load; unauthenticated redirect ke `/login`.

---

## 6. Git / Branch — **PENTING UNTUK KAU**

- Branch kerja: **`arena/01a04daa-masb-pms-v3`**.
- Pull dulu change terkini sebelum kerja: `git fetch && git checkout arena/01a04daa-masb-pms-v3 && git pull origin arena/01a04daa-masb-pms-v3`.
- Jangan push ke `main` atau branch lain.
- Apabila kau selesai satu langkah, commit ke branch ini sahaja.

---

## 7. Gap code lain (follow-up, tidak blocking)

- **Audit-log triggers:** migration `0001` mencipta jadual `audit_log` tetapi **tiada**
  `fn_audit_trigger()` + trigger yang diterangkan blueprint (§6). `audit_log` akan
  kekal kosong sehingga trigger ditambah. Additive & selamat.
- **`data_quality_exceptions`** gunakan `text` untuk `type`/`severity`/`status`
  (bukan enum) dalam migration yang digunakan; app types guna `string`, jadi konsisten.
  Blueprint mahu enum — optional.
- **Recharts** di 2.x (deprecated); bump ke v3 bila senang (tidak blocking).
- Prototaip statik `mimos-academy-system.jsx` + fail `.xlsx`/`.docx`/`.pdf` ialah
  input rujukan, bukan wired ke app.

---

## 8. URUTAN KERJA DISYORKAN (keutamaan)

1. **`git pull`** branch `arena/01a04daa-masb-pms-v3`.
2. **`supabase db push`** untuk `0005_reconcile_schema.sql` — **keutamaan #1**,
   semuanya bergantung pada ini.
3. **Regenerate `types/database.ts`**.
4. **Tambah `/api/import/[batchId]/match`** + set `target_table`/`target_record_id`
   supaya commit engine boleh commit (lihat §3).
5. **Bootstrap admin** (Auth invite, set `super_admin`).
6. **Deploy Vercel** ikut checklist §5, then jalankan post-deploy checks.
7. **Seed `status_dictionary`** dan (optional) tambah audit-log triggers.

---

## 9. APA YANG KAU PERLU LAPOR BALIK

Selepas setiap langkah, beri laporan ringkas dalam format:

```
### Step N: <nama step>
- Status: ✅ / ⏳ / ❌
- Apa kau buat:
- Apa kau jumpa (error/pelik):
- Saiz data / bukti (contoh: "x baris di-commit", "x exceptions"):
- Langkah seterusnya / kau perlukan aku (Arena agent) buat apa:
```

> Rujukan: `01-ARCHITECTURE.md`, `02-schema.sql`, `VERCEL_DEPLOYMENT_CHECKLIST.md`,
> `FIRST_ADMIN_BOOTSTRAP.md`, dan migration dalam `supabase/migrations/`.
