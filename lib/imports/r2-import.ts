import { r2OverallParser, r2AttendanceParser, type ParsedR2OverallRow, type ParsedR2AttendanceRow } from '@/lib/imports/r2-overall-parser'
import { createImportBatch, stageImportRows, updateBatchStatistics, updateImportBatchStatus } from '@/lib/imports/service'
import type { Json } from '@/types/database'

const CHUNK_SIZE = 500

export type R2ImportResult = {
  batchId: string
  totalRows: number
  stagedRows: number
  validRows: number
  warningRows: number
  errorRows: number
}

const toOverallStageInput = (row: ParsedR2OverallRow) => ({
  source_type: 'r2_overall',
  source_row_number: row.source_row_number,
  row_hash: row.row_hash,
  raw_data: row.raw_data,
  normalized_data: row.normalized_data as unknown as Json,
  validation_status: row.validation_status,
  matching_status: 'PENDING' as const,
  target_table: 'training_sessions' as const,
  target_record_id: null,
  metadata: { parser: 'R2OverallParser', sheet: 'Overall', error_message: row.error_message, warning_message: row.warning_message } as unknown as Json,
})

const toAttendanceStageInput = (row: ParsedR2AttendanceRow) => ({
  source_type: 'r2_attendance',
  source_row_number: row.source_row_number,
  row_hash: row.row_hash,
  raw_data: row.raw_data,
  normalized_data: row.normalized_data as unknown as Json,
  validation_status: row.validation_status,
  matching_status: 'PENDING' as const,
  target_table: 'participant_roster' as const,
  target_record_id: null,
  metadata: { parser: 'R2AttendanceParser', sheet: 'Attendance list', error_message: row.error_message, warning_message: row.warning_message } as unknown as Json,
})

export async function importR2Workbook(file: File, accessToken?: string): Promise<R2ImportResult> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const batch = await createImportBatch({
    source_type: 'r2_overall_report',
    file_name: file.name,
    file_size_bytes: file.size,
    content_type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    metadata: { parser: 'R2OverallParser', workflow: 'Excel -> R2 Overall + Attendance -> import_staging' },
  }, accessToken)

  try {
    await updateImportBatchStatus(batch.id, 'PARSING', undefined, accessToken)
    const overallRows = r2OverallParser.parse(buffer)
    const attendanceRows = r2AttendanceParser.parse(buffer)
    const allRows = [
      ...overallRows.map(toOverallStageInput),
      ...attendanceRows.map(toAttendanceStageInput),
    ]

    for (let offset = 0; offset < allRows.length; offset += CHUNK_SIZE) {
      await stageImportRows(batch.id, allRows.slice(offset, offset + CHUNK_SIZE), accessToken)
    }

    const updatedBatch = await updateBatchStatistics(batch.id, accessToken)
    await updateImportBatchStatus(batch.id, 'STAGED', undefined, accessToken)

    return {
      batchId: updatedBatch.id,
      totalRows: updatedBatch.total_rows,
      stagedRows: updatedBatch.staged_rows,
      validRows: updatedBatch.valid_rows,
      warningRows: updatedBatch.warning_rows,
      errorRows: updatedBatch.error_rows,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'R2_IMPORT_FAILED'
    await updateImportBatchStatus(batch.id, 'PARSING_FAILED', message, accessToken).catch(() => undefined)
    throw new Error(message)
  }
}
