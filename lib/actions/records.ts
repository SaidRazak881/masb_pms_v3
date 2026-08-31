'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, EDIT_ROLES, can } from '@/lib/rbac'
import type { Row, UserRole } from '@/types/database'

type EditableTable =
  | 'programs' | 'companies' | 'contacts' | 'quotations' | 'purchase_orders'
  | 'invoices' | 'payments' | 'cost_of_sales' | 'training_sessions'
  | 'participant_counts' | 'participant_roster'

const ROLE_MAP: Record<EditableTable, UserRole[]> = {
  programs: EDIT_ROLES, companies: EDIT_ROLES, contacts: EDIT_ROLES,
  quotations: EDIT_ROLES, purchase_orders: EDIT_ROLES, invoices: EDIT_ROLES,
  payments: EDIT_ROLES, cost_of_sales: EDIT_ROLES, training_sessions: EDIT_ROLES,
  participant_counts: EDIT_ROLES, participant_roster: EDIT_ROLES,
}

const ALLOWED_FIELDS: Record<EditableTable, readonly string[]> = {
  programs: ['title','company_id','category','training_type','current_stage','client_category','sector','pic_user_id','account_manager_user_id','lead_date','forecast_value','probability','needs_review'],
  companies: ['canonical_name','aliases','client_category','sector','is_merged_into'],
  contacts: ['company_id','full_name','designation','email','phone'],
  quotations: ['program_id','quotation_no_raw','quotation_series','quotation_year','quotation_seq','revision_no','quotation_date','duration_days','no_of_unit','unit_price_excl_sst','unit_price_incl_sst','total_price_excl_sst','sst_amount','total_price_incl_sst','discount_pct','final_price','status','prepared_by'],
  purchase_orders: ['program_id','quotation_id','po_no','po_date','po_value'],
  invoices: ['program_id','quotation_id','po_id','invoice_no','invoice_date','invoice_value_excl_sst','sst_amount','payment_terms_days','payment_status','payment_method','account','account_manager','pic','remark'],
  payments: ['invoice_id','amount','payment_date','method','reference_no'],
  cost_of_sales: ['invoice_id','invoice_no','invoice_value','collection','cost_of_sales_amount','mimos_academy_cost','commission','bro_incentive','net_profit','profit_percentage','had_formula_error'],
  training_sessions: ['program_id','session_title','session_type','start_date','end_date','venue','duration_days','r2_status'],
  participant_counts: ['training_session_id','category','workshop_count','training_count','bumiputera_count','non_bumiputera_count'],
  participant_roster: ['training_session_id','full_name','cert_no','is_bumiputera','participation_type','week_label','attendance_date'],
}

const REQUIRED_FIELDS: Partial<Record<EditableTable, readonly string[]>> = {
  programs: ['title', 'company_id'],
  companies: ['canonical_name'],
  contacts: ['company_id', 'full_name'],
  quotations: ['program_id', 'quotation_no_raw'],
  purchase_orders: ['program_id'],
  invoices: ['program_id', 'invoice_no'],
  payments: ['invoice_id', 'amount'],
  cost_of_sales: ['invoice_id', 'cost_of_sales_amount', 'mimos_academy_cost', 'commission', 'bro_incentive'],
  training_sessions: ['program_id', 'session_title'],
  participant_counts: ['training_session_id'],
  participant_roster: ['training_session_id', 'full_name'],
}

function sanitize(table: EditableTable, changes: Record<string, unknown>) {
  const allowed = new Set(ALLOWED_FIELDS[table])
  return Object.fromEntries(Object.entries(changes).filter(([key]) => allowed.has(key)))
}

function validateRequired(table: EditableTable, values: Record<string, unknown>) {
  const missing = (REQUIRED_FIELDS[table] ?? []).find((key) => {
    const value = values[key]
    return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
  })
  return missing ?? null
}

async function exists(supabase: any, table: string, id: unknown) {
  if (typeof id !== 'string' || !id) return false
  const { data, error } = await supabase.from(table).select('id').eq('id', id).maybeSingle()
  return !error && !!data?.id
}

async function validateRelationships(supabase: any, table: EditableTable, values: Record<string, unknown>) {
  const fail = (message: string) => ({ ok: false as const, error: message })

  if (table === 'contacts' && values.company_id && !(await exists(supabase, 'companies', values.company_id)))
    return fail('The selected company does not exist.')

  if (table === 'programs' && values.company_id && !(await exists(supabase, 'companies', values.company_id)))
    return fail('The selected company does not exist.')

  if (table === 'quotations' && values.program_id && !(await exists(supabase, 'programs', values.program_id)))
    return fail('The selected program does not exist.')

  if (table === 'purchase_orders') {
    if (values.program_id && !(await exists(supabase, 'programs', values.program_id)))
      return fail('The selected program does not exist.')
    if (values.quotation_id) {
      const { data: quotation, error } = await supabase.from('quotations').select('id,program_id').eq('id', values.quotation_id).maybeSingle()
      if (error || !quotation) return fail('The selected quotation does not exist.')
      if (values.program_id && quotation.program_id !== values.program_id)
        return fail('The quotation must belong to the selected program.')
    }
  }

  if (table === 'invoices') {
    if (values.program_id && !(await exists(supabase, 'programs', values.program_id)))
      return fail('The selected program does not exist.')
    if (values.quotation_id) {
      const { data: quotation, error } = await supabase.from('quotations').select('id,program_id').eq('id', values.quotation_id).maybeSingle()
      if (error || !quotation) return fail('The selected quotation does not exist.')
      if (values.program_id && quotation.program_id !== values.program_id)
        return fail('The quotation must belong to the selected program.')
    }
    if (values.po_id) {
      const { data: po, error } = await supabase.from('purchase_orders').select('id,program_id').eq('id', values.po_id).maybeSingle()
      if (error || !po) return fail('The selected purchase order does not exist.')
      if (values.program_id && po.program_id !== values.program_id)
        return fail('The purchase order must belong to the selected program.')
    }
  }

  if (table === 'payments' && values.invoice_id && !(await exists(supabase, 'invoices', values.invoice_id)))
    return fail('The selected invoice does not exist.')

  if (table === 'cost_of_sales' && values.invoice_id && !(await exists(supabase, 'invoices', values.invoice_id)))
    return fail('The selected invoice does not exist.')

  if (table === 'training_sessions' && values.program_id && !(await exists(supabase, 'programs', values.program_id)))
    return fail('The selected program does not exist.')

  if (table === 'participant_counts' && values.training_session_id && !(await exists(supabase, 'training_sessions', values.training_session_id)))
    return fail('The selected training session does not exist.')

  if (table === 'participant_roster' && values.training_session_id && !(await exists(supabase, 'training_sessions', values.training_session_id)))
    return fail('The selected training session does not exist.')

  return { ok: true as const }
}

async function writeAudit(supabase: any, table: EditableTable, recordId: string, action: 'CREATE' | 'UPDATE', oldValue: unknown, newValue: unknown, userId: string) {
  const { error } = await supabase.from('audit_log').insert({
    table_name: table,
    record_id: recordId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
    changed_by: userId,
    changed_at: new Date().toISOString(),
    source: 'application',
  })
  return !error
}

function revalidateData() {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/programs')
  revalidatePath('/dashboard/programs/[code]', 'page')
  revalidatePath('/dashboard/r1')
  revalidatePath('/dashboard/r2')
  revalidatePath('/dashboard/reports')
}

export async function updateEditableRecord(input: { table: EditableTable; id: string; changes: Record<string, unknown> }): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Authentication required.' }
  if (!can(user.role, ROLE_MAP[input.table])) return { ok: false, error: 'You do not have permission to edit this record.' }
  if (!input.id) return { ok: false, error: 'Record ID is required.' }

  const changes = sanitize(input.table, input.changes)
  if (!Object.keys(changes).length) return { ok: false, error: 'No editable fields were provided.' }

  const supabase = await createClient()
  const { data: existing, error: readError } = await (supabase as any).from(input.table).select('*').eq('id', input.id).single()
  if (readError || !existing) return { ok: false, error: 'Record not found.' }

  const merged = { ...existing, ...changes }
  const missing = validateRequired(input.table, merged)
  if (missing) return { ok: false, error: `Required field missing: ${missing}.` }

  const relationship = await validateRelationships(supabase, input.table, merged)
  if (!relationship.ok) return relationship

  const { error } = await (supabase as any).from(input.table).update(changes).eq('id', input.id)
  if (error) return { ok: false, error: error.message }

  const audited = await writeAudit(supabase, input.table, input.id, 'UPDATE', existing, { ...existing, ...changes }, user.id)

  if (input.table === 'programs' && changes.current_stage && changes.current_stage !== existing.current_stage) {
    await supabase.from('pipeline_stage_history').insert({
      program_id: input.id,
      stage: changes.current_stage as Row<'programs'>['current_stage'],
      changed_by: user.id,
      changed_at: new Date().toISOString(),
      is_override: true,
      source_system: 'application',
    })
  }

  revalidateData()
  if (!audited) console.error('Audit log write failed after successful update', { table: input.table, recordId: input.id })
  return { ok: true }
}

export async function createEditableRecord(input: { table: EditableTable; values: Record<string, unknown> }): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Authentication required.' }
  if (!can(user.role, ROLE_MAP[input.table])) return { ok: false, error: 'You do not have permission to create this record.' }

  const values = sanitize(input.table, input.values)
  if (!Object.keys(values).length) return { ok: false, error: 'No editable fields were provided.' }
  const missing = validateRequired(input.table, values)
  if (missing) return { ok: false, error: `Required field missing: ${missing}.` }

  const supabase = await createClient()
  const relationship = await validateRelationships(supabase, input.table, values)
  if (!relationship.ok) return relationship

  const { data, error } = await (supabase as any).from(input.table).insert(values).select('id').single()
  if (error || !data?.id) return { ok: false, error: error?.message ?? 'Unable to create record.' }

  const audited = await writeAudit(supabase, input.table, data.id, 'CREATE', null, values, user.id)
  revalidateData()
  if (!audited) console.error('Audit log write failed after successful create', { table: input.table, recordId: data.id })
  return { ok: true, id: data.id }
}
