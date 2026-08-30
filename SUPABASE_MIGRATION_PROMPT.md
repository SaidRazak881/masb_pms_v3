# Prompt untuk ChatGPT — Apply Supabase Migrations

> Guna prompt di bawah dan serahkan kepada ChatGPT yang mempunyai akses ke repo & Supabase.
> Jangan sertakan password/token/secret dalam prompt — biarkan ia guna sambungan yang telah wujud.

---

## Prompt (copy-paste)

```
Anda adalah operator migration Supabase untuk repo MIMOS Academy PMS
(branch `arena/01a05068-masb-pms-v3`). Executive order: repo dianggap sebagai
sumber kebenaran; tiada environment sandbox/prod lain dipercayai.

TUGASAN:
1. Baca fail di `supabase/migrations/` dan semak semua nombor fail.
2. Use ONLY canonical migrations in this exact order:
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
   then, if this is a fresh DB:
   20260829012000_seed_2026_excel_data.sql
   20260829012100_seed_2026_excel_rows.sql
   20260829012200_seed_2026_workbook_rows.sql
   20260829012300_seed_2026_data_audit.sql

3. JANGAN guna migration `0007` — ia mengandungi DROP COLUMN net_profit (PR #5 draft).
4. `02-schema.sql` adalah BLUEPRINT sahaja; jangan sediakan jadual daripadanya.
   Semua DDL mesti datang dari `supabase/migrations/`.
5. Apply migrasi satu persatu, idempotent, tanpda DROP TABLE / DROP COLUMN /
   TRUNCATE / DISABLE RLS yang tidak diperlukan.
6. Selepas setiap kumpulan, verify:
   - Fungsi `public.current_user_role()` wujud.
   - Fungsi berikut wujud & boleh dipanggil sebagai super_admin/admin/manager:
     `commit_import_batch(uuid)`, `commit_r2_batch(uuid)`,
     `commit_r2_roster(uuid)`, `audit_r2_roster(uuid)`, `commit_r3_batch(uuid)`.
   - Jadual `import_batches`, `import_staging`, `import_commit_log`,
     `participant_counts`, `participant_roster`, `training_sessions`,
     `programs`, `data_quality_exceptions` wujud.
   - View `vw_r1_income_statement`, `vw_r2_overall_report`,
     `vw_r3_sales_funnel`, `vw_action_required` wujud.
7. After migrasi, jalankan smoke SQL ini dan lapor hasilnya:
   select 'import_batches' as name, count(*) from public.import_batches
   union all select 'programs', count(*) from public.programs
   union all select 'training_sessions', count(*) from public.training_sessions
   union all select 'participant_roster', count(*) from public.participant_roster
   union all select 'data_quality_exceptions', count(*) from public.data_quality_exceptions;

8. Jika ini DB baru, pastikan trigger `on_auth_user_created` wujud supaya
   setiap user Auth automatik dicipta dalam `public.profiles`.
9. Jangan set/insert sebarang role tanpa arahan; hanya sahkan role enum.
10. Laporkan status akhir: senarai migration applied, mana-mana warning,
    dan hasil smoke SQL. Jangan buat sebarang perubahan di luar task ini.
```

---

## Selepas migration (tambah kepada ChatGPT jika perlu)

```
Bootstrap first admin (gantikan YOUR_ADMIN_EMAIL dengan email sebenar):
1. Cipta user Auth pertama (Email/Password) di Supabase Dashboard.
2. Confirm email jika email confirmation ON.
3. Jalankan SQL ini di SQL Editor:

update public.profiles
set role = 'super_admin', is_active = true, must_reset_password = false, updated_at = now()
where email = 'YOUR_ADMIN_EMAIL';

4. Sahkan:
select email, role, is_active from public.profiles where email = 'YOUR_ADMIN_EMAIL';
```
