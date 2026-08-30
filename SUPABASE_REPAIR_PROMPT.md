# Prompt untuk ChatGPT — Reconcile Migration History (Optional Cleanup)

> Post-migration cleanup AGAR perkara berikut disahkan/dilepaskan:
> - duplicate `0009` migration-history records
> - stale `0007` history entry yang bukan sebahagian dari canonical repo
>
> Operasi ini **bookkeeping sahaja**, bukan perubahan skema. Jangan DROP TABLE /
> DROP COLUMN / TRUNCATE / DISABLE RLS. Jangan ubah fungsi/jadual.

---

## Prompt (copy-paste)

```
Anda masih operator Supabase untuk repo MIMOS Academy PMS
branch `arena/01a05068-masb-pms-v3`. Ini adalah operasi bookkeeping migration
history pada DB live `masb_pms_v3`. JANGAN ubah sebarang skema/function/view/data.

LANGKAH:
1. Siasat dengan teliti:
   select *
   from supabase_migrations.schema_migrations
   order by version;

   Lapor semua baris yang berkaitan dengan:
   - 0007_align_cost_of_sales_with_commit_engine
   - 0009_safe_commit_engine_generated_net_profit

2. Tentukan primary key / version sebenar bagi setiap baris tersebut. Jangan
   andai-andaikan.

3. Untuk 0009 duplicate:
   - Pastikan satu dan hanya satu record KEEPS the version string that exactly
     matches the canonical filename 0009_safe_commit_engine_generated_net_profit.
   - Delete ONLY the additional duplicate row(s) that do not match the canonical
     filename or that are clearly the same migration repeated.
   - Warn if deleting requires changing an existing row's version (jangan lakukan
     tanpa persetujuan).

4. Untuk 0007:
   - 0007_align_cost_of_sales_with_commit_engine bukan sebahagian daripada
     canonical migration set; 0009 adalah pengganti.
   - Jangan padam skema yang mungkin telah dijana oleh 0007.
   - Jika anda mahu menyelaraskan supaya `supabase migration list` tidak lagi
     melihat 0007 di remote, padam HANYA record `supabase_migrations.schema_migrations`
     untuk 0007. Ini TIDAK akan me-rollback skema; ia hanya membersihkan history.
   - Jika anda tidak pasti, SKIP langkah ini dan lapor sahaja.

5. Selepas perubahan, lapor:
   - Count baris dalam `supabase_migrations.schema_migrations` yang mengikut
     canonical set.
   - Confirmation bahawa function `commit_import_batch`, `commit_r2_batch`,
     `commit_r2_roster`, `audit_r2_roster`, `commit_r3_batch`, dan
     `current_user_role` masih wujud dan masih executable oleh `authenticated`.
   - Confirmation bahawa `net_profit` pada `cost_of_sales` masih wujud.
   - Jangan lakukan apa-apa perubahan lain.

PENTING:
- Ini cleaning history sahaja. Jika sebarang padam boleh mengganggu integriti,
  JANGAN buat. Lapor dan berhenti.
```

---

## Kenapa ini selamat (konteks)

- `0009` telah dilaksanakan dua kali; content akhir function sudah canonical.
  Removing only the extra history row keeps bookkeeping clean.
- `0007` (PR #5 draft) mengandungi `DROP COLUMN net_profit` dan tidak boleh
  digunakan. Ia sudah pernah teraplikasi sebelum operasi migrasi; `0009`
  adalah gantian. Removing its history entry does NOT undo the schema — it only
  makes remote history match the canonical repo. If in doubt, do not delete.

---

## Prompt tambahan — Deepen (read-only, tiada DELETE)

```
Anda masih operator Supabase untuk repo MIMOS Academy PMS
branch `arena/01a05068-masb-pms-v3`. Operasi ini READ-ONLY. JANGAN DELETE,
JANGAN UPDATE, JANGAN insert. Tugas: bandingkan dua migration-history records
0009 dan lapor.

1. Query:
   select version, name, statements, length(statements::text) as statements_length
   from supabase_migrations.schema_migrations
   where name like '0009%'
   order by version;

2. Bandingkan `statements` bagi kedua-dua record:
   - Boleh guna SQL CTE + `statements ='...'` atau normalkan text
     (trim, whitespace, semicolon) sebelum bandingkan.
   - Laporan: SAMA atau BERBEZA. Jika berbeza, senaraikan perbezaan paling
     significant (bukan seluruh teks).

3. Jangan delete kedua-duanya. Jangan ubah version. Jangan ubah function.
4. Laporan akhir:
   - record count for 0009
   - SAMA / BERBEZA
   - Adakah `public.commit_import_batch` function definition kini betul dengan
     canonical repo (plain net_profit) - check via `pg_get_functiondef`.
   - Skor risiko: LOW / MED / HIGH. Jika SAMA dan function betul = LOW.
```

---

## Keputusan semasa (2026-08-30)

- GPT memilih **SKIP** penyingkiran `0007` dan `0009` history.
- Ini keputusan yang diterima buat masa ini: tidak ada perubahan skema, dan
  cleanup hanya relevant untuk `supabase migration list`/CLI workflow.
- Jika aplikasi live berjalan tanpa `supabase db push`, duplicate history
  tidak menghalang deployment.

---

## Prompt tambahan — Full reconciliation audit (READ-ONLY, no delete)

```
Anda masih operator Supabase untuk repo MIMOS Academy PMS
branch `arena/01a05068-masb-pms-v3`. Operasi READ-ONLY.
JANGAN DELETE / UPDATE / INSERT. JANGAN ubah schema, function, view, table,
data, migration history, RLS.

OBJEKTIF: peta penuh antara canonical migration set dan live
`supabase_migrations.schema_migrations`, dan tentukan apakah kunci satu-satunya
yang perlu dibersihkan sebelum sebarang migration automation.

LANGKAH 1. Semak canonical file list (read repo):
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
  0012_r2_participant_roster_commit.sql
  0013_r2_roster_consistency_audit.sql
  20260829012000_seed_2026_excel_data.sql
  20260829012100_seed_2026_excel_rows.sql
  20260829012200_seed_2026_workbook_rows.sql
  20260829012300_seed_2026_data_audit.sql

LANGKAH 2. Query live:
  select version, name, idempotency_key, length(statements::text) as statements_length
  from supabase_migrations.schema_migrations
  order by version;

LANGKAH 3. Lapor dalam bentuk jadual:
  - Canonical file -> ada / tiada dalam history (match by `name`)
  - Remote-only records (dalam history tapi tiada canonical file) e.g. 0007
  - Duplicate names
  - Records yang versinya tidak sepadan dengan prefix canonical (nota: ini
    mungkin artifact workflow dashboard/connector; jangan ubah)
  - Out-of-order records sekiranya jelas

LANGKAH 4. Untuk 0009 duplicate sahaja:
  - Buat semantic diff (bukan hash sahaja): senaraikan klausa/statement yang
    ada pada satu dan tiada pada yang lain.
  - Nyatakan migration mana yang lebih lengkap dari segi SELECT columns
    (record 42022 vs 42037) dan sama ada perbezaan ini memberi kesan output.
  - JANGAN pilih/padam mana-mana record.

LANGKAH 5. Verify (read-only):
  - Semua 6 functions wujud & executable by authenticated:
    commit_import_batch(uuid), commit_r2_batch(uuid),
    commit_r2_roster(uuid), audit_r2_roster(uuid),
    commit_r3_batch(uuid), current_user_role()
  - `cost_of_sales.net_profit` wujud (plain column).
  - Semua 8 tables + 4 views wujud.

LANGKAH 6. Laporan:
  - Peta penuh
  - Risk: LOW / MED / HIGH
  - Recommendation, contoh: "refrain from supabase db push until history is
    reconciled", atau "tidak menyekat aplikasi hari ini".
  - TIDAK melakukan sebarang perubahan.
```

---

## Keputusan semasa (2026-08-30)

- Deepen audit daripada GPT: record 0009 BERBEZA; `commit_import_batch`
  live PASS (generated/plain `net_profit`); risk MED.
- Langkah seterusnya: laksanakan full reconciliation audit di atas sebelum
  sebarang migration automation. Tiada delete dilakukan.
