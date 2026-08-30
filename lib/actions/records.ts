'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, EDIT_ROLES, can } from '@/lib/rbac'
import type { UserRole } from '@/types/database'

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

function sanitize(table: EditableTable, changes: Record<string, unknown>) {
  const allowed = new Set(ALLOWED_FIELDS[table])
  return Object.fromEntries(Object.entries(changes).filter(([key]) => allowed.has(key)))
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

  const { error } = await (supabase as any).from(input.table).update(changes).eq('id', input.id)
  if (error) return { ok: false, error: error.message }

  // The database audit trigger records old/new row values and authenticated user.
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/programs')
  revalidatePath('/dashboard/programs/[code]', 'page')
  revalidatePath('/dashboard/r1')
  revalidatePath('/dashboard/r2')
  revalidatePath('/dashboard/reports')
  return { ok: true }
}
