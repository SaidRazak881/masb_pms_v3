# Data import scripts

Run the 2026 workbook importer with a Supabase server-side key:

```bash
SUPABASE_URL="https://knzawodadepabxjpxkly.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<server-side-secret>" \
node scripts/import-2026-workbooks.mjs invoice_2026.xlsx sales_report_2026-08-19.xlsx
```

The importer is intended for controlled data-load operations only. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or commit it to Git.
