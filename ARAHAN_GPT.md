# ARAHAN LENGKAP UNTUK GPT — Sambung & Siapkan MASB PMS v3

> **Kau = GPT.** Kau ada akses penuh ke GitHub (`SaidRazak881/masb_pms_v3`), Supabase
> (DB + Auth + Storage), dan Vercel.
> **Branch kerja (WAJIB):** `arena/01a04daa-masb-pms-v3` — JANGAN guna branch lain,
> JANGAN sentuh `main`.
>
> Ikut arahan ini **mengikut urutan**. Selepas setiap tugas, lapor balik dengan bukti
> kuantitatif (format di hujung dokumen). Jangan tulis data production domain sehingga
> semua tugas T1–T4 lulus.

---

## 0. KEDUDUKAN SEMASA (sedia untuk disambung)

Repo dah sedia. Build & typecheck sudah hijau. Aliran import dah lengkap secara code.

**Yang perlu kau buat:** sahkan akses, apply migration, E2E test, bootstrap admin, deploy.

**Fail penting yang kau perlu baca dulu:**
- `01-ARCHITECTURE.md` — reka bentuk sistem
- `02-schema.sql` — schema penuh (rujukan)
- `supabase/migrations/0001..0007_*.sql` — migrations yang perlu diaplikasi
- `VERCEL_DEPLOYMENT_CHECKLIST.md` — checklist deploy
- `FIRST_ADMIN_BOOTSTRAP.md` — cara cipta admin pertama
- `HANDOFF_TO_GPT.md` — nota penuh dari Arena agent

---

## T0. SAHKAN AKSES REPO (selesaikan isu "404 Not Found")

Repo `SaidRazak881/masb_pms_v3` ialah **repo AWAM** dan branch
`arena/01a04daa-masb-pms-v3` boleh diclone **tanpa login**. Jika tool/connector kau
masih lapor 404, itu isu **authentication di sisi kau**, bukan satu masalah repo.

Sahkan guna salah satu cara ini:

```bash
# 1) Semak branch wujud di origin (patut return commit 76a7bec...)
git ls-remote --heads https://github.com/SaidRazak881/masb_pms_v3.git arena/01a04daa-masb-pms-v3

# 2) Clone terus tanpa token (bukti repo awam & branch boleh diakses)
git clone --depth 1 --branch arena/01a04daa-masb-pms-v3 https://github.com/SaidRazak881/masb_pms_v3.git /tmp/masb
ls /tmp/masb/supabase/migrations/   # patut lihat 0001..0006
```

Jika `ls-remote` dan `clone` berjaya, akses **OK** dan 404 itu hanya pada tool baca
fail kau — sambung semula GitHub connection kau. Teruskan ke T1.

---

## T1. APPLY MIGRATION KE SUPABASE (BLOKER #1 — KENA SELESAI DULU)

Migration `0001–0004` yang sedia ada **tidak lengkap**. Fungsi
`public.commit_import_batch()` (dalam `0004`) merujuk jadual yang **belum wujud**
(`cost_of_sales`, `company_alias_map`), jadi ia akan gagal dengan
`relation "public.cost_of_sales" does not exist`. Migration `0005` (+ `0006` oleh
Arena agent) menutup jurang ini.

```bash
# dari dalam /tmp/masb (atau clone kerja kau)
supabase link --project-ref <PROJECT_REF>      # ganti dengan project ref kau
supabase db push                               # apply 0001..0006
```

**Sahkan (jalankan SQL ini):**
```sql
-- Setiap jadual mesti RLS enabled (patut semua return 't')
select relrowsecurity from pg_class where relkind = 'r';

-- View R1/R2 mesti wujud & boleh query
select * from public.vw_r1_income_statement limit 5;
select * from public.vw_r2_overall_report limit 5;
```

**✅ Bukti untuk lapor balik:** bilangan jadual, pengesahan RLS enabled, bukti query
`vw_r1_income_statement` / `vw_r2_overall_report` mengembalikan baris.

---

## T1b. ⚠️ SELARASKAN cost_of_sales DENGAN COMMIT ENGINE — BLOKER SEBENAR

**PENTING — jangan di-skip.** Laporan T1 kau sendiri mendedahkan masalah: production
`cost_of_sales` mempunyai `row_hash`/`source_sheet` dan `net_profit` sebagai
**GENERATED column** (bentuk `02-schema.sql`). Maksudnya migration `0005`
(`create table if not exists`) adalah **NO-OP** untuk table ini — ia TIDAK
menambah kolum yang diperlukan.

Sedangkan `public.commit_import_batch()` (migration `0004`) **INSERT kolum ini
secara eksplisit**: `invoice_no, invoice_value, collection, net_profit,
profit_percentage`. Pada table `02-schema.sql`, kolum `invoice_no`,
`invoice_value`, `collection`, `profit_percentage` **TIDAK WUJUD**, dan `net_profit`
ialah **GENERATED** (tak boleh di-INSERT). Kesannya: **step commit cost_of_sales akan
GAGAL** dengan `column "invoice_no" does not exist` dan
`cannot insert a non-DEFAULT value into column "net_profit"`.

**Arena agent dah sediakan migration penyesuaian**
`supabase/migrations/0007_align_cost_of_sales_with_commit_engine.sql`. **Pull & apply
dulu, kemudian SAHKAN:**

```bash
git pull origin arena/01a04daa-masb-pms-v3     # dapatkan migration 0007
supabase db push                                 # apply 0007
```

**Sahkan production `cost_of_sales` kini sepadan dengan commit engine:**
```sql
-- Patut return: invoice_no, invoice_value, collection, profit_percentage
select column_name from information_schema.columns
where table_schema='public' and table_name='cost_of_sales'
order by ordinal_position;

-- Patut return 'NEVER' (bukan 'ALWAYS') untuk net_profit
select column_name, is_generated from information_schema.columns
where table_schema='public' and table_name='cost_of_sales'
  and column_name='net_profit';
```

**Selain itu, SAHKAN migration 0004 sebenarnya TERAPAT** (ia mencipta
`import_commit_log`, `commit_import_batch`, `rollback_import_batch` — tanpa ini API
commit gagal):
```sql
select proname from pg_proc where proname in ('commit_import_batch','rollback_import_batch');
-- patut return 2 baris
select to_regclass('public.import_commit_log');
-- patut return 'public.import_commit_log'
```

**✅ Bukti untuk lapor balik:** output `information_schema` untuk kolum
`cost_of_sales`, status `is_generated` untuk `net_profit` = `NEVER`, dan pengesahan
`commit_import_batch`/`rollback_import_batch`/`import_commit_log` wujud.

---

## T2. REGENERATE TYPES (WAJIB)

`types/database.ts` dalam repo kini **regenerate manual oleh Arena agent** supaya build
lulus. Kau WAJIB regenerate rasmi supaya ia `exact match` dengan **Postgres PRODUCTION
sebenar** (selepas T1 + T1b, bukan sebelum).

1. **PULL & BRANCH dulu** (pastikan fail `types/database.ts` yang lama di-overwrite):
   ```bash
   git pull origin arena/01a04daa-masb-pms-v3
   ```
2. **Regenerate terus ke fail**:
   ```bash
   supabase gen types typescript --project-id <PROJECT_REF> > types/database.ts
   git add types/database.ts && git commit -m "types: regenerate from production schema" && git push origin arena/01a04daa-masb-pms-v3
   ```
3. **Sahkan masih hijau**:
   ```bash
   npm run typecheck
   npm run build
   ```

> Nota penting: sebelum ini kau kata output generated "tidak boleh disalurkan terus
> sebagai fail melalui connector". Itu satu batasan tool, BUKAN masalah repo. Kalau kau
> tak boleh tulis fail, **paste kandungan penuh `types/database.ts` yang dijana** dalam
> laporan supaya Arena agent boleh write ke repo. TAPI lebih baik commit terus via `git`.

**✅ Bukti:** `npm run typecheck` dan `npm run build` lulus, dan `types/database.ts`
mencerminkan kolum production sebenar (18 tables, 4 views, `current_user_role`).

---

## T3. E2E TEST IMPORT (SANGAT PENTING — GUNA BATCH STAGING, BUKAN PRODUCTION)

Aliran yang betul ialah **3 endpoint berasingan, dalam urutan tetap**:

```
Excel
  → POST /api/import/{source}                (parser → import_staging, status 'STAGED')
  → POST /api/import/{batchId}/match-engine  (Matching Engine: set matching_status EXACT/ALIAS/COMPOSITE/NONE/AMBIGUOUS)
  → POST /api/import/{batchId}/match         (Matching Resolution: set target_table/target_record_id/matching_confidence/matching_rule)
  → POST /api/import/commit                  (Commit Engine: insert ke domain tables)
```

**JANGAN SKIP `match-engine`.** Tanpa ia, `matching_status` kekal `PENDING`, dan route
`/match` akan return `resolved = 0` (silent no-op).

**Langkah (ulang untuk setiap fail berikut):**
- `00. Quotation Tracker (1).xlsx` → buat batch via `POST /api/import/quotations`
- `invoice_2026.xlsx` → `POST /api/import/invoices`
- `cost_of_sales_2026.xlsx` → `POST /api/import/cost-of-sales`

Untuk **setiap** fail:
1. `POST /api/import/{source}` → dapatkan `batchId`. Lapor `x rows staged`.
2. `POST /api/import/{batchId}/match-engine` → lapor
   `{ total, matched, ambiguous, unmatched, duplicates }`. **`matched` mesti > 0.**
3. `POST /api/import/{batchId}/match` → lapor `{ total, resolved, unresolved }`.
   **Jika `resolved = 0`, berhenti — jangan commit; ini tanda `match-engine` belum dijalankan.**
4. `POST /api/import/commit` → lapor
   `{ affected_records, inserted_quotations, inserted_invoices, inserted_cost_of_sales }`.
5. Sahkan dalam DB (contoh): `select count(*) from public.quotations;` dan keadaan
   `import_staging.matching_status`/`target_table`/`target_record_id` untuk batch itu.

**✅ Bukti untuk lapor balik setiap fail:** `x staged`, `y matched`, `z resolved`,
dan `n inserted_quotations / inserted_invoices / inserted_cost_of_sales`.

> **Amalan selamat:** lakukan pada **staging/preview DB** dahulu. Jangan commit ke
> production sehingga `inserted_*` betul. Jika ada `data_quality_exceptions`, resolusi
> via `POST /api/import/exceptions` dahulu.

---

## T4. BOOTSTRAP ADMIN PERTAMA

Ikut `FIRST_ADMIN_BOOTSTRAP.md`:
1. Supabase Auth → buat user first (Email/Password).
2. Sahkan email (jika confirm enabled).
3. Trigger `on_auth_user_created` cipta `public.profiles` automatik.
4. Jalankan SQL:
   ```sql
   update public.profiles
   set role = 'super_admin', is_active = true, must_reset_password = false, updated_at = now()
   where email = 'ADMIN_EMAIL';
   ```
5. **JANGAN guna password default `masb.12345`** dari `User_Profiles_Mapping.xlsx`.
   Guna invite flow — setiap user set password sendiri.

**✅ Bukti:** `/login` load, login → `/dashboard`, role `super_admin` set.

---

## T5. DEPLOY VERCEL (SELEPAS T1–T4 LULUS)

Ikut `VERCEL_DEPLOYMENT_CHECKLIST.md`:
- Connect repo ke project Vercel `masb-pms-v3`.
- Deploy **branch `arena/01a04daa-masb-pms-v3`** (bukan `phase1-production`).
- Build command: `npm run build`.
- Env vars (Production + Preview):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  ← JANGAN letak service-role di sini
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only, untuk script/cron sahaja)
  - `CRON_SECRET` (optional)
- Set Supabase Auth Site URL / redirect URL ke URL production Vercel.
- Sahkan: `/login`, `/dashboard`, `/dashboard/action-center`, `/dashboard/programs`
  semua load; unauthenticated request redirect ke `/login`.

**✅ Bukti:** URL production aktif, `/login`→`/dashboard` berfungsi.

---

## PERKARA YANG JANGAN BUAT

- ❌ Jangan tulis/push ke `main` atau branch lain — **hanya** `arena/01a04daa-masb-pms-v3`.
- ❌ Jangan letak `SUPABASE_SERVICE_ROLE_KEY` dalam mana-mana env `NEXT_PUBLIC_*`.
- ❌ Jangan commit production data ke repo (source workbook memang tak di-commit).
- ❌ Jangan migrate password `masb.12345` — guna invite sahaja.
- ❌ Jangan commit production domain data sehingga T1–T4 (khususnya E2E) lulus.

---

## FORMAT LAPORAN BALIK (WAJIB — guna selepas SETIAP tugas)

```
### T<n>: <nama tugas>
- Status: ✅ / ⏳ / ❌
- Apa kau buat:
- Apa kau jumpa (error/pelik):
- Bukti kuantitatif:  (cth. "x rows staged", "y matched", "z resolved", "n inserted", "tables RLS enabled", "URL production aktif")
- Perlukan Arena agent buat apa: (jika ada)
```

> Rujukan utama: `01-ARCHITECTURE.md`, `02-schema.sql`, `VERCEL_DEPLOYMENT_CHECKLIST.md`,
> `FIRST_ADMIN_BOOTSTRAP.md`, dan `supabase/migrations/`.
