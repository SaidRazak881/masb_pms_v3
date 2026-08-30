'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, can } from '@/lib/rbac'
import type { UserRole } from '@/types/database'

type EditableTable = 'programs' | 'companies' | 'quotations' | 'purchase_orders' | 'invoices' | 'payments' | 'training_sessions' | 'participant_roster'

const ROLE_MAP: Record<EditableTable, UserRole[]> = {
  programs: ['super_admin', 'admin', 'manager', 'pic'],
  companies: ['super_admin', 'admin'],
  quotations: ['super_admin', 'admin', 'manager', 'pic'],
  purchase_orders: ['super_admin', 'admin', 'manager', 'pic'],
  invoices: ['super_admin', 'admin'],
  payments: ['super_admin', 'admin'],
  training_sessions: ['super_admin', 'admin', 'manager', 'pic'],
  participant_roster: ['super_admin', 'admin', 'manager', 'pic'],
}

const ALLOWED_FIELDS: Record<EditableTable, readonly string[]> = {
  programs: ['title', 'company_id', 'category', 'training_type', 'current_stage', 'client_category', 'sector', 'pic_user_id', 'account_manager_user_id', 'lead_date', 'forecast_value', 'probability', 'needs_review'],
  companies: ['canonical_name', 'aliases', 'client_category', 'sector', 'is_merged_into'],
  quotations: ['quotation_no_raw', 'quotation_date', 'final_price', 'status', 'prepared_by'],
  purchase_orders: ['quotation_id', 'po_no', 'po_date', 'po_value'],
  invoices: ['quotation_id', 'po_id', 'invoice_no', 'invoice_date', 'invoice_value_excl_sst', 'sst_amount', 'payment_terms_days', 'payment_status', 'pic'],
  payments: ['amount', 'payment_date', 'method', 'reference_no'],
  training_sessions: ['session_title', 'session_type', 'start_date', 'end_date', 'venue', 'duration_days', 'r2_status'],
  participant_roster: ['full_name', 'cert_no', 'is_bumiputera', 'participation_type', 'week_label', 'attendance_date'],
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
  const { error } = await (supabase as any).from(input.table).update(changes).eq('id', input.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/programs')
  revalidatePath('/dashboard/programs/[code]', 'page')
  revalidatePath('/dashboard/r1')
  revalidatePath('/dashboard/r2')
  revalidatePath('/dashboard/reports')
  return { ok: true }
}
