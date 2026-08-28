import fs from "node:fs";
import process from "node:process";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SALES_FILE = process.argv[2] ?? "sales_report_2026-08-19.xlsx";
const INVOICE_FILE = process.argv[3] ?? "invoice_2026.xlsx";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the importer.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const readRows = (file) => {
  if (!fs.existsSync(file)) throw new Error(`Workbook not found: ${file}`);
  const workbook = XLSX.readFile(file, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
};

const clean = (value) => value == null ? null : String(value).trim() || null;
const date = (value) => value instanceof Date ? value.toISOString().slice(0, 10) : clean(value);
const number = (value) => value == null || value === "" ? null : Number(value);
const normalize = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const stage = new Map([
  ["Contract signed/PO issued", "PO_RECEIVED"],
  ["Proposal/Tender submitted", "PROPOSAL_SUBMITTED"],
  ["Negotiation stage", "QUOTATION_APPROVED"],
  ["Early engagement", "LEAD_REGISTERED"],
  ["Qualified lead/Tender in progress", "PROPOSAL_SUBMITTED"],
  ["Verbal commitment", "QUOTATION_APPROVED"],
  ["Lost/No-go", "LOST"],
]);

const sales = readRows(SALES_FILE);
const invoices = readRows(INVOICE_FILE);

const { data: existingCompanies, error: companyReadError } = await supabase
  .from("companies").select("id,canonical_name,sector");
if (companyReadError) throw companyReadError;

const companyByNormalizedName = new Map(
  (existingCompanies ?? []).map((company) => [normalize(company.canonical_name), company]),
);

const companyRows = [...sales.map((row) => ({
  name: clean(row.Client), sector: clean(row.Sector),
})), ...invoices.map((row) => ({
  name: clean(row["Company Name"]), sector: null,
}))];

for (const row of companyRows) {
  if (!row.name) continue;
  const key = normalize(row.name);
  if (companyByNormalizedName.has(key)) continue;
  const { data, error } = await supabase.from("companies").insert({
    canonical_name: row.name,
    aliases: [row.name],
    client_category: row.sector,
    sector: row.sector,
  }).select("id,canonical_name,sector").single();
  if (error) throw error;
  companyByNormalizedName.set(key, data);
}

const salesProgramByCompanyTitle = new Map();
for (let index = 0; index < sales.length; index += 1) {
  const row = sales[index];
  const code = `2026-SALES-${String(index + 1).padStart(3, "0")}`;
  const company = companyByNormalizedName.get(normalize(row.Client));
  if (!company) throw new Error(`Company not resolved: ${row.Client}`);
  const forecast = number(row["Forecast (RM)"]);
  const weighted = number(row["Weighted (RM)"]);
  const probability = forecast ? weighted / forecast : null;
  const payload = {
    program_code: code,
    title: clean(row.Project) ?? "Untitled program",
    company_id: company.id,
    training_type: "Training",
    current_stage: stage.get(clean(row.Status)) ?? "LEAD_REGISTERED",
    client_category: clean(row.Sector),
    sector: clean(row.Sector),
    forecast_value: forecast,
    probability,
    needs_review: clean(row.Status) === "Lost/No-go",
  };
  const { data, error } = await supabase.from("programs")
    .upsert(payload, { onConflict: "program_code" })
    .select("id,program_code").single();
  if (error) throw error;
  salesProgramByCompanyTitle.set(`${normalize(row.Client)}|${normalize(row.Project)}`, data);
}

for (let index = 0; index < invoices.length; index += 1) {
  const row = invoices[index];
  const rowNumber = index + 1;
  const companyName = clean(row["Company Name"]);
  const title = clean(row.Title) ?? "Untitled program";
  const company = companyByNormalizedName.get(normalize(companyName));
  if (!company) throw new Error(`Company not resolved: ${companyName}`);

  const exactSales = salesProgramByCompanyTitle.get(`${normalize(companyName)}|${normalize(title)}`);
  let program = exactSales;
  if (!program) {
    const programCode = `2026-INV-${String(rowNumber).padStart(3, "0")}`;
    const { data, error } = await supabase.from("programs").upsert({
      program_code: programCode,
      title,
      company_id: company.id,
      category: clean(row.Revenue),
      training_type: "Training",
      current_stage: clean(row["Payment Status"]) === "PAID" ? "PAID" : "INVOICED",
      forecast_value: number(row["Invoice Value (excl tax)"]) ?? 0,
      probability: 1,
    }, { onConflict: "program_code" }).select("id,program_code").single();
    if (error) throw error;
    program = data;
  }

  let quotationId = null;
  const quotationNo = clean(row.Quotation);
  if (quotationNo) {
    const { data, error } = await supabase.from("quotations").upsert({
      program_id: program.id,
      quotation_no_raw: quotationNo,
      quotation_date: date(row["Invoice Date"]),
      final_price: number(row["Invoice Value (excl tax)"]),
      status: "APPROVED",
      prepared_by: clean(row["Account Manager"]),
    }, { onConflict: "quotation_no_raw,program_id" }).select("id").single();
    if (error) throw error;
    quotationId = data.id;
  }

  let poId = null;
  const poNo = clean(row.PO);
  if (poNo) {
    const { data, error } = await supabase.from("purchase_orders").insert({
      program_id: program.id,
      quotation_id: quotationId,
      po_no: poNo,
      po_value: number(row["PO Value (excl tax)"]),
    }).select("id").maybeSingle();
    if (error) throw error;
    poId = data?.id ?? null;
  }

  const invoiceNo = clean(row["Invoice No"]) ?? `PENDING-2026-${String(rowNumber).padStart(3, "0")}`;
  const { data: invoice, error: invoiceError } = await supabase.from("invoices").upsert({
    program_id: program.id,
    quotation_id: quotationId,
    po_id: poId,
    invoice_no: invoiceNo,
    invoice_date: date(row["Invoice Date"]),
    invoice_value_excl_sst: number(row["Invoice Value (excl tax)"]) ?? 0,
    sst_amount: number(row["SST (8%)"]) ?? 0,
    payment_terms_days: 30,
    payment_status: ["PAID", "UNPAID", "PARTIAL", "OVERDUE"].includes(clean(row["Payment Status"]) ?? "") ? clean(row["Payment Status"]) : "UNPAID",
    pic: clean(row.PIC),
  }, { onConflict: "invoice_no,program_id" }).select("id,total_value,invoice_value_excl_sst").single();
  if (invoiceError) throw invoiceError;

  const paymentDate = date(row["Payment Date"]);
  if (clean(row["Payment Status"]) === "PAID" && paymentDate) {
    const { error } = await supabase.from("payments").insert({
      invoice_id: invoice.id,
      amount: invoice.total_value ?? invoice.invoice_value_excl_sst,
      payment_date: paymentDate,
      method: clean(row["Payment Method"]),
      reference_no: invoiceNo,
    });
    if (error) throw error;
  }

  const startDate = date(row["Start Date"]);
  const endDate = date(row["End Date"]);
  if (startDate) {
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = endDate ? new Date(`${endDate}T00:00:00Z`) : start;
    const durationDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    const { error } = await supabase.from("training_sessions").insert({
      program_id: program.id,
      session_title: title,
      session_type: clean(row.Revenue),
      start_date: startDate,
      end_date: endDate,
      duration_days: durationDays,
      r2_status: end < new Date() ? "COMPLETED" : start > new Date() ? "UPCOMING" : "PENDING_DATA",
    });
    if (error) throw error;
  }
}

console.log(`Imported ${sales.length} sales rows and ${invoices.length} invoice rows.`);
