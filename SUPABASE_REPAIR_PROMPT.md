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
