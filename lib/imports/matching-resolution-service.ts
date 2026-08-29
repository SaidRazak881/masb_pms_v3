import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

export type ResolutionResult = {
  stagingId: string
  sourceType: string
  targetTable: 'quotations' | 'invoices' | 'cost_of_sales' | null
  targetRecordId: string | null
  matchingConfidence: number
  matchingRule: string
  reason: string
}

type StageRow = { id: string; source_type: string; normalized_data: Json; validation_status: string; matching_status: string; metadata: Json }
type Company = { id: string; canonical_name: string }
type Program = { id: string; program_code: string; title: string; company_id: string }
type Quotation = { id: string; quotation_no_raw: string; program_id: string }
type Invoice = { id: string; invoice_no: string; program_id: string }

const obj = (value: Json): Record<string, Json> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, Json> : {}
const str = (value: Json): string | null => typeof value === 'string' || typeof value === 'number' ? String(value).trim() || null : null
// Escape LIKE wildcards (% _ \) so untrusted client names are treated as literals,
// not as SQL patterns (a name containing '%' would otherwise match everything).
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (ch) => '\\' + ch)
const toLike = (value: string | null): string | null => value ? escapeLike(value) : null
function field(row: StageRow, names: string[]): string | null { const d = obj(row.normalized_data); for (const n of names) { const v = str(d[n]); if (v) return v } return null }

async function resolveCompany(supabase: Awaited<ReturnType<typeof createClient>>, companyName: string | null): Promise<Company | null> {
  const needle = toLike(companyName?.trim() ?? '')
  if (!needle) return null
  const { data: alias, error: aliasError } = await supabase.from('company_alias_map').select('alias_text,company_id').ilike('alias_text', needle).limit(2)
  if (aliasError) throw aliasError
  if (alias?.length === 1) {
    const { data, error } = await supabase.from('companies').select('id,canonical_name').eq('id', alias[0].company_id).maybeSingle()
    if (error) throw error
    if (data) return data as Company
  }
  const { data: companies, error } = await supabase.from('companies').select('id,canonical_name').ilike('canonical_name', needle).limit(2)
  if (error) throw error
  return companies?.length === 1 ? companies[0] as Company : null
}

async function resolveProgram(supabase: Awaited<ReturnType<typeof createClient>>, companyId: string | null, programCode: string | null, projectTitle: string | null): Promise<Program | null> {
  const codeNeedle = toLike(programCode ?? '')
  if (codeNeedle) {
    const { data, error } = await supabase.from('programs').select('id,program_code,title,company_id').ilike('program_code', codeNeedle).limit(2)
    if (error) throw error
    const matches = (data ?? []) as Program[]
    const scoped = companyId ? matches.filter(p => p.company_id === companyId) : matches
    if (scoped.length === 1) return scoped[0]
    if (matches.length === 1 && !companyId) return matches[0]
  }
  const titleNeedle = toLike(projectTitle ?? '')
  if (titleNeedle) {
    const { data, error } = await supabase.from('programs').select('id,program_code,title,company_id').ilike('title', titleNeedle).limit(5)
    if (error) throw error
    const matches = (data ?? []) as Program[]
    const scoped = companyId ? matches.filter(p => p.company_id === companyId) : matches
    if (scoped.length === 1) return scoped[0]
  }
  return null
}

async function resolveProgramById(supabase: Awaited<ReturnType<typeof createClient>>, id: string): Promise<Program | null> {
  const { data, error } = await supabase.from('programs').select('id,program_code,title,company_id').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Program | null
}

async function resolveExistingQuotation(supabase: Awaited<ReturnType<typeof createClient>>, quotationNo: string | null): Promise<Quotation | null> {
  const needle = toLike(quotationNo ?? '')
  if (!needle) return null
  const { data, error } = await supabase.from('quotations').select('id,quotation_no_raw,program_id').ilike('quotation_no_raw', needle).limit(2)
  if (error) throw error
  return data?.length === 1 ? data[0] as Quotation : null
}

async function resolveExistingInvoice(supabase: Awaited<ReturnType<typeof createClient>>, invoiceNo: string | null): Promise<Invoice | null> {
  const needle = toLike(invoiceNo ?? '')
  if (!needle) return null
  const { data, error } = await supabase.from('invoices').select('id,invoice_no,program_id').ilike('invoice_no', needle).limit(2)
  if (error) throw error
  return data?.length === 1 ? data[0] as Invoice : null
}

function baseConfidence(rule: string): number {
  switch (rule) { case 'EXACT_QUOTATION_NUMBER': return 1; case 'EXACT_INVOICE_NUMBER': return 0.95; case 'COMPANY_ALIAS': return 0.8; case 'PROGRAM_CODE': return 0.7; default: return 0 }
}

export async function resolveMatchingTargets(batchId: string, accessToken?: string): Promise<ResolutionResult[]> {
  const supabase = await createClient(accessToken)
  const { data, error } = await supabase.from('import_staging').select('id,source_type,normalized_data,validation_status,matching_status,metadata').eq('batch_id', batchId).eq('validation_status', 'VALID').in('matching_status', ['EXACT', 'ALIAS', 'COMPOSITE', 'FUZZY_REVIEW']).order('source_row_number')
  if (error) throw error

  const results: ResolutionResult[] = []
  for (const raw of data ?? []) {
    const row = raw as StageRow
    const invoiceNo = field(row, ['invoice_number'])
    const quotationNo = field(row, ['quotation_number'])
    const companyName = field(row, ['company_name', 'company'])
    const programCode = field(row, ['program_code', 'program_id'])
    const projectTitle = field(row, ['project_title', 'title'])
    const company = await resolveCompany(supabase, companyName)
    let targetTable: ResolutionResult['targetTable'] = null
    let targetRecordId: string | null = null
    let rule = 'NONE'
    let reason = 'No deterministic domain target found'

    if (row.source_type === 'quotation_tracker') {
      const existing = await resolveExistingQuotation(supabase, quotationNo)
      if (existing) { targetTable = 'quotations'; targetRecordId = existing.id; rule = 'EXACT_QUOTATION_NUMBER'; reason = 'Existing quotation resolved by exact quotation number' }
      else {
        const program = await resolveProgram(supabase, company?.id ?? null, programCode, projectTitle)
        if (program) { targetTable = 'quotations'; targetRecordId = program.id; rule = programCode ? 'PROGRAM_CODE' : 'COMPANY_ALIAS'; reason = 'New quotation resolved deterministically to program' }
      }
    } else if (row.source_type === 'invoice_2026') {
      const existing = await resolveExistingInvoice(supabase, invoiceNo)
      if (existing) { targetTable = 'invoices'; targetRecordId = existing.id; rule = 'EXACT_INVOICE_NUMBER'; reason = 'Existing invoice resolved by exact invoice number' }
      else {
        const quotation = await resolveExistingQuotation(supabase, quotationNo)
        const program = quotation ? await resolveProgramById(supabase, quotation.program_id) : await resolveProgram(supabase, company?.id ?? null, programCode, projectTitle)
        if (program) { targetTable = 'invoices'; targetRecordId = program.id; rule = quotation ? 'EXACT_QUOTATION_NUMBER' : (programCode ? 'PROGRAM_CODE' : 'COMPANY_ALIAS'); reason = 'New invoice resolved deterministically to program' }
      }
    } else if (row.source_type === 'cost_of_sales_2026') {
      const existing = await resolveExistingInvoice(supabase, invoiceNo)
      if (existing) { targetTable = 'cost_of_sales'; targetRecordId = existing.id; rule = 'EXACT_INVOICE_NUMBER'; reason = 'Cost of sales resolved to invoice by exact invoice number' }
    }

    results.push({ stagingId: row.id, sourceType: row.source_type, targetTable, targetRecordId, matchingConfidence: targetRecordId ? baseConfidence(rule) : 0, matchingRule: rule, reason })
  }

  for (const result of results) {
    const current = (data ?? []).find(r => (r as StageRow).id === result.stagingId) as StageRow | undefined
    const metadata = { ...obj(current?.metadata ?? null), resolution_reason: result.reason }
    const payload = { target_table: result.targetTable, target_record_id: result.targetRecordId, matching_confidence: result.matchingConfidence, matching_rule: result.matchingRule, metadata }
    const { error: updateError } = await supabase.from('import_staging').update(payload as never).eq('id', result.stagingId).eq('batch_id', batchId)
    if (updateError) throw updateError
  }
  return results
}
