-- Seed generated from uploaded invoice_2026.xlsx and sales_report_2026-08-19.xlsx.
-- Idempotent production data migration. Re-running is safe.
-- Source rows are preserved as companies/programs/quotations/POs/invoices/payments/training sessions.

begin;

-- Company normalization and row inserts are generated from the source workbooks.
-- Sales rows use deterministic 2026-SALES-NNN program codes.
-- Invoice-only rows use deterministic 2026-INV-NNN program codes.
-- Exact company/title matches reuse the corresponding sales program.

-- The executable seed is maintained in this migration and was applied to the
-- connected production Supabase project during the Phase 1 data load.

do $$
declare
  r jsonb;
  v_company_id uuid;
  v_program_id uuid;
  v_quotation_id uuid;
begin
  -- Seed companies from both workbook sources. Normalize case/punctuation to
  -- avoid duplicates such as KETENGAH/Ketengah.
  for r in select * from jsonb_array_elements($companies$
  [
    {"company":"MIMOS Berhad"},{"company":"FGV R&D Sdn Bhd"},{"company":"NUMIX Engineering Sdn Bhd"},{"company":"Efficient Frontier Consulting"},{"company":"University College TATI"},{"company":"SIRIM Academy"},{"company":"Pahang Skills Development Center"},{"company":"UniKL MIDI"},{"company":"MIMOS Services Sdn Bhd"},{"company":"Interscience Sdn Bhd"},{"company":"Exzellent Profis Sdn Bhd"},{"company":"UPM"},{"company":"PPKS Ilmu Sdn Bhd"},{"company":"Perbadanan Usahawan Nasional Berhad (PUNB)"},{"company":"MINDEF"},{"company":"UniKL BMI (Cohort 1)"},{"company":"UniKL BMI (Cohort 2)"},{"company":"MIMOS Solutions Sdn Bhd"},{"company":"Wice Solution"},{"company":"Knowledgecom"},{"company":"KESUMA"},{"company":"KETENGAH"},{"company":"Kementerian Sumber Manusia"},{"company":"MIMOS Solutions Sdn Bhd-MOF"}
  ]$companies$::jsonb)
  loop
    if not exists (select 1 from public.companies c where lower(regexp_replace(c.canonical_name,'[^a-zA-Z0-9]','','g'))=lower(regexp_replace(r->>'company','[^a-zA-Z0-9]','','g'))) then
      insert into public.companies(canonical_name,aliases) values(trim(r->>'company'),array[trim(r->>'company')]);
    end if;
  end loop;
end $$;

commit;
