'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, isEditor } from '@/lib/rbac'
import type { Row } from '@/types/database'

export async function getProgramMutationSnapshot(programCode: string) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Authentication required.' }

  const supabase = await createClient()
  const { data: program, error: programError } = await supabase.from('programs').select('*').eq('program_code', programCode).single()
  if (programError || !program) return { ok: false as const, error: 'Program not found.' }

  if (!isEditor(user.role)) {
    return { ok: true as const, canEdit: false, role: user.role, program, quotations: [], purchaseOrders: [], invoices: [], payments: [], trainingSessions: [], roster: [] }
  }

  const [quotationsResult, purchaseOrdersResult, invoicesResult, trainingResult] = await Promise.all([
    supabase.from('quotations').select('*').eq('program_id', program.id).order('quotation_date', { ascending: false }),
    supabase.from('purchase_orders').select('*').eq('program_id', program.id).order('po_date', { ascending: false }),
    supabase.from('invoices').select('*').eq('program_id', program.id).order('invoice_date', { ascending: false }),
    supabase.from('training_sessions').select('*').eq('program_id', program.id).order('start_date', { ascending: false }),
  ])

  const quotations = (quotationsResult.data ?? []) as Row<'quotations'>[]
  const purchaseOrders = (purchaseOrdersResult.data ?? []) as Row<'purchase_orders'>[]
  const invoices = (invoicesResult.data ?? []) as Row<'invoices'>[]
  const trainingSessions = (trainingResult.data ?? []) as Row<'training_sessions'>[]

  const invoiceIds = invoices.map((row) => row.id)
  const sessionIds = trainingSessions.map((row) => row.id)
  const [paymentsResult, rosterResult] = await Promise.all([
    invoiceIds.length ? supabase.from('payments').select('*').in('invoice_id', invoiceIds).order('payment_date', { ascending: false }) : Promise.resolve({ data: [] }),
    sessionIds.length ? supabase.from('participant_roster').select('*').in('training_session_id', sessionIds).order('full_name') : Promise.resolve({ data: [] }),
  ])

  return {
    ok: true as const,
    canEdit: true,
    role: user.role,
    program,
    quotations,
    purchaseOrders,
    invoices,
    payments: (paymentsResult.data ?? []) as Row<'payments'>[],
    trainingSessions,
    roster: (rosterResult.data ?? []) as Row<'participant_roster'>[],
  }
}
