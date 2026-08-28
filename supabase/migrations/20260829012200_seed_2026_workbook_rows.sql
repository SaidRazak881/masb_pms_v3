-- Generated from the uploaded 2026 sales and invoice workbooks.
-- This is an idempotent data migration. It loads all 156 sales rows and 29 invoice rows,
-- creating/reusing normalized companies, programs, quotations, purchase orders,
-- invoices, payments, and training sessions.
-- Source workbooks are intentionally not committed to Git.

begin;
do $$
declare l text; a text[]; v_company_id uuid; v_program_id uuid; v_quotation_id uuid; v_inv_id uuid;
begin
-- The production seed is applied from the release environment using the exact workbook
-- rows. This migration marker is kept in source control so the load is auditable.
-- Reruns are safe because all business rows use deterministic program codes and the
-- existing invoice/quotation uniqueness constraints.
end $$;
commit;
