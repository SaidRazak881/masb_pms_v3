import type { Insert, ImportBatchStatus, ImportMatchingStatus, ImportValidationStatus, Json } from '@/types/database'

export type ImportBatchInsert = Insert<'import_batches'>
export type ImportStagingInsert = Insert<'import_staging'>

export type CreateImportBatchInput = Pick<ImportBatchInsert,'source_type'|'file_name'> & {
  file_size_bytes?: number | null
  content_type?: string | null
  metadata?: Json
}

export type StageImportRowInput = Pick<ImportStagingInsert,'source_type'|'source_row_number'|'row_hash'> & {
  raw_data?: Json
  normalized_data?: Json
  validation_status?: ImportValidationStatus
  matching_status?: ImportMatchingStatus
  target_table?: string | null
  target_record_id?: string | null
  metadata?: Json
}

export type UpdateImportBatchStatusInput = {
  status: ImportBatchStatus
  error_message?: string | null
}
