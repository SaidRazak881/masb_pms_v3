import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/types/database'

export const EXCEPTION_TYPES = [
  'UNMATCHED',
  'DUPLICATE',
  'INVALID_STATUS',
  'INVALID_PERCENTAGE',
  'MISSING_COMPANY',
  'MISSING_INVOICE_NUMBER',
  'FORMULA_ERROR',
] as const
export type ExceptionType = typeof EXCEPTION_TYPES[number]
export type ExceptionStatus = 'OPEN' | 'RESOLVED' | 'IGNORED'
export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

type StagingRow = Database['public']['Tables']['import_staging']['Row']
type ExceptionRow = Database['public']['Tables']['data_quality_exceptions']['Row']
type ExceptionInsert = Database['public']['Tables']['data_quality_exceptions']['Insert']

type ExceptionCandidate = {
  type: ExceptionType
  severity: ExceptionSeverity
  description: string
}

const asRecord = (value: Json): Record<string, Json> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, Json> : {}

const text = (value: Json): string | null =>
  typeof value === 'string' || typeof value === 'number' ? String(value).trim() || null : null

function candidates(row: StagingRow): ExceptionCandidate[] {
  const metadata = asRecord(row.metadata)
  const normalized = asRecord(row.normalized_data)
  const result: ExceptionCandidate[] = []
  const add = (type: ExceptionType, severity: ExceptionSeverity, description: string) => result.push({ type, severity, description })

  const errorMessage = text(metadata.error_message) ?? row.error_message
  const validation = `${errorMessage ?? ''}`.toUpperCase()
  if (validation.includes('FORMULA_ERROR') || text(normalized.had_formula_error)?.toLowerCase() === 'true') add('FORMULA_ERROR', 'HIGH', 'Formula error detected in source row.')
  if (validation.includes('INVALID_PROFIT_PERCENTAGE') || validation.includes('INVALID_PERCENTAGE')) add('INVALID_PERCENTAGE', 'HIGH', 'Invalid percentage detected in source row.')
  if (validation.includes('MISSING_COMPANY')) add('MISSING_COMPANY', 'MEDIUM', 'Company is missing from source row.')
  if (validation.includes('MISSING_INVOICE_NUMBER')) add('MISSING_INVOICE_NUMBER', 'HIGH', 'Invoice number is missing from source row.')
  if (validation.includes('INVALID_STATUS')) add('INVALID_STATUS', 'MEDIUM', 'Source status is invalid.')
  if (row.matching_status === 'DUPLICATE') add('DUPLICATE', 'HIGH', 'Duplicate staging row detected by the matching engine.')
  if (row.matching_status === 'NONE' || row.matching_status === 'AMBIGUOUS' || text(metadata.matching_status) === 'UNMATCHED') add('UNMATCHED', 'HIGH', 'No deterministic match was found for this staging row.')
  return result
}

async function requireImportUser(accessToken?: string) {
  const supabase = await createClient(accessToken)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('AUTH_REQUIRED')
  const { data: profile, error } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).single()
  if (error || !profile?.is_active || !['super_admin', 'admin', 'manager'].includes(profile.role)) throw new Error('IMPORT_FORBIDDEN')
  return { supabase, user }
}

export async function createExceptionsForBatch(batchId: string, accessToken?: string): Promise<ExceptionRow[]> {
  const { supabase } = await requireImportUser(accessToken)
  const { data: rows, error } = await supabase.from('import_staging').select('*').eq('batch_id', batchId)
  if (error) throw error
  const inserts: ExceptionInsert[] = []
  for (const row of rows ?? []) {
    for (const candidate of candidates(row)) {
      inserts.push({
        type: candidate.type,
        severity: candidate.severity,
        description: candidate.description,
        related_table: 'import_staging',
        related_id: row.id,
        status: 'OPEN',
        created_at: new Date().toISOString(),
      })
    }
  }
  if (!inserts.length) return []
  const { data, error: insertError } = await supabase.from('data_quality_exceptions').insert(inserts).select('*')
  if (insertError) throw insertError
  return data ?? []
}

export async function listExceptions(batchId: string | undefined, accessToken?: string): Promise<ExceptionRow[]> {
  const { supabase } = await requireImportUser(accessToken)
  let query = supabase.from('data_quality_exceptions').select('*').order('created_at', { ascending: false })
  if (batchId) {
    const { data: staging, error } = await supabase.from('import_staging').select('id').eq('batch_id', batchId)
    if (error) throw error
    const ids = (staging ?? []).map((row) => row.id)
    if (!ids.length) return []
    query = query.in('related_id', ids)
  }
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function resolveException(id: string, status: ExceptionStatus, resolutionNote: string | null, accessToken?: string): Promise<ExceptionRow> {
  const { supabase, user } = await requireImportUser(accessToken)
  const patch: Database['public']['Tables']['data_quality_exceptions']['Update'] = {
    status,
    resolved_by: status === 'RESOLVED' ? user.id : null,
    resolved_at: status === 'RESOLVED' ? new Date().toISOString() : null,
    resolution_note: resolutionNote,
  }
  const { data, error } = await supabase.from('data_quality_exceptions').update(patch).eq('id', id).select('*').single()
  if (error || !data) throw new Error(error?.message ?? 'EXCEPTION_UPDATE_FAILED')
  return data
}
