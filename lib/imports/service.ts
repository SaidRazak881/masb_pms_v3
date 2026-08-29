import { createClient } from '@/lib/supabase/server'
import type { Database, ImportBatchStatus, Json } from '@/types/database'
import type { CreateImportBatchInput, StageImportRowInput } from './types'

const IMPORT_ROLES = new Set(['super_admin','admin','manager'])
type ImportBatchRow = Database['public']['Tables']['import_batches']['Row']
type ImportStagingRow = Database['public']['Tables']['import_staging']['Row']

async function requireImportUser() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('AUTH_REQUIRED')
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).single()
  if (profileError || !profile || !profile.is_active || !IMPORT_ROLES.has(profile.role)) throw new Error('IMPORT_FORBIDDEN')
  return { supabase, user }
}

export async function createImportBatch(input: CreateImportBatchInput): Promise<ImportBatchRow> {
  const { supabase, user } = await requireImportUser()
  const { data, error } = await supabase.from('import_batches').insert({
    source_type: input.source_type,
    file_name: input.file_name,
    file_size_bytes: input.file_size_bytes ?? null,
    content_type: input.content_type ?? null,
    metadata: input.metadata ?? {},
    created_by: user.id,
  }).select('*').single()
  if (error || !data) throw new Error(error?.message ?? 'IMPORT_BATCH_CREATE_FAILED')
  return data
}

export async function getImportBatch(batchId: string): Promise<ImportBatchRow> {
  const { supabase } = await requireImportUser()
  const { data, error } = await supabase.from('import_batches').select('*').eq('id', batchId).single()
  if (error || !data) throw new Error(error?.message ?? 'IMPORT_BATCH_NOT_FOUND')
  return data
}

export async function updateImportBatchStatus(batchId: string, status: ImportBatchStatus, errorMessage?: string | null): Promise<ImportBatchRow> {
  const { supabase } = await requireImportUser()
  const patch: Database['public']['Tables']['import_batches']['Update'] = { status, error_message: errorMessage ?? null }
  if (status === 'PARSING') patch.started_at = new Date().toISOString()
  if (status === 'COMPLETED' || status === 'FAILED' || status === 'ROLLED_BACK' || status === 'CANCELLED') patch.completed_at = new Date().toISOString()
  const { data, error } = await supabase.from('import_batches').update(patch).eq('id', batchId).select('*').single()
  if (error || !data) throw new Error(error?.message ?? 'IMPORT_BATCH_UPDATE_FAILED')
  return data
}

export async function stageImportRows(batchId: string, rows: readonly StageImportRowInput[]): Promise<ImportStagingRow[]> {
  if (rows.length === 0) return []
  const { supabase } = await requireImportUser()
  const payload: Database['public']['Tables']['import_staging']['Insert'][] = rows.map((row) => ({
    batch_id: batchId,
    source_type: row.source_type,
    source_row_number: row.source_row_number,
    raw_data: row.raw_data ?? {},
    normalized_data: row.normalized_data ?? {},
    row_hash: row.row_hash,
    validation_status: row.validation_status ?? 'PENDING',
    matching_status: row.matching_status ?? 'PENDING',
    target_table: row.target_table ?? null,
    target_record_id: row.target_record_id ?? null,
    metadata: row.metadata ?? {},
  }))
  const { data, error } = await supabase.from('import_staging').upsert(payload, { onConflict: 'batch_id,row_hash', ignoreDuplicates: true }).select('*')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function updateBatchStatistics(batchId: string): Promise<ImportBatchRow> {
  const { supabase } = await requireImportUser()
  const { data: rows, error: rowsError } = await supabase.from('import_staging').select('validation_status').eq('batch_id', batchId)
  if (rowsError) throw new Error(rowsError.message)
  const stats = (rows ?? []).reduce((acc, row) => {
    acc.total += 1
    if (row.validation_status === 'VALID') acc.valid += 1
    else if (row.validation_status === 'WARNING') acc.warning += 1
    else if (row.validation_status === 'ERROR') acc.error += 1
    return acc
  }, { total: 0, valid: 0, warning: 0, error: 0 })
  const patch: Database['public']['Tables']['import_batches']['Update'] = {
    total_rows: stats.total,
    staged_rows: stats.total,
    valid_rows: stats.valid,
    warning_rows: stats.warning,
    error_rows: stats.error,
    exception_rows: stats.error,
  }
  const { data, error } = await supabase.from('import_batches').update(patch).eq('id', batchId).select('*').single()
  if (error || !data) throw new Error(error?.message ?? 'IMPORT_STATS_UPDATE_FAILED')
  return data
}

export function asJsonRecord(value: unknown): Json {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map(asJsonRecord)
  if (typeof value === 'object') {
    const result: { [key: string]: Json } = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) result[key] = asJsonRecord(item)
    return result
  }
  return String(value)
}
