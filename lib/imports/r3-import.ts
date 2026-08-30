import { r3FunnelParser, type ParsedR3Row } from '@/lib/imports/r3-funnel-parser'
import { officeFunnelParser, type ParsedOfficeRow } from '@/lib/imports/office-funnel-parser'
import { salesReportParser, type ParsedSalesRow } from '@/lib/imports/sales-report-parser'
import { createImportBatch, stageImportRows, updateBatchStatistics, updateImportBatchStatus } from '@/lib/imports/service'
import type { Json } from '@/types/database'

const CHUNK_SIZE = 500

export type R3ImportResult = {
  batchId: string
  totalRows: number
  stagedRows: number
  validRows: number
  warningRows: number
  errorRows: number
}

const toR3StageInput = (row: ParsedR3Row) => ({
  source_type: 'r3_funnel',
  source_row_number: row.source_row_number,
  row_hash: row.row_hash,
  raw_data: row.raw_data,
  normalized_data: row.normalized_data as unknown as Json,
  validation_status: row.validation_status,
  matching_status: 'PENDING' as const,
  target_table: 'programs' as const,
  target_record_id: null,
  metadata: { parser: 'R3FunnelParser', sheet: 'R3', error_message: row.error_message, warning_message: row.warning_message } as unknown as Json,
})

const toOfficeStageInput = (row: ParsedOfficeRow) => ({
  source_type: 'office_funnel',
  source_row_number: row.source_row_number,
  row_hash: row.row_hash,
  raw_data: row.raw_data,
  normalized_data: row.normalized_data as unknown as Json,
  validation_status: row.validation_status,
  matching_status: 'PENDING' as const,
  target_table: 'programs' as const,
  target_record_id: null,
  metadata: { parser: 'OfficeFunnelParser', sheet: 'Office', error_message: row.error_message, warning_message: row.warning_message } as unknown as Json,
})

const toSalesStageInput = (row: ParsedSalesRow) => ({
  source_type: 'sales_report',
  source_row_number: row.source_row_number,
  row_hash: row.row_hash,
  raw_data: row.raw_data,
  normalized_data: row.normalized_data as unknown as Json,
  validation_status: row.validation_status,
  matching_status: 'PENDING' as const,
  target_table: 'programs' as const,
  target_record_id: null,
  metadata: { parser: 'SalesReportParser', sheet: 'sales_report', error_message: row.error_message, warning_message: row.warning_message } as unknown as Json,
})

export async function importR3Workbooks(files: { r3?: File; office?: File; sales?: File }, accessToken?: string): Promise<R3ImportResult> {
  const first = files.r3 ?? files.office ?? files.sales
  if (!first) throw new Error('R3_FILE_REQUIRED')

  const batch = await createImportBatch({
    source_type: 'r3_sales_pipeline',
    file_name: first.name,
    file_size_bytes: first.size,
    content_type: first.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    metadata: { parser: 'R3PipelineParser', workflow: 'Excel -> R3 / office_funnel / sales_report -> import_staging' },
  }, accessToken)

  try {
    await updateImportBatchStatus(batch.id, 'PARSING', undefined, accessToken)

    const rows: Array<TargetStageInput> = []
    if (files.r3) {
      const buffer = Buffer.from(await files.r3.arrayBuffer())
      rows.push(...r3FunnelParser.parse(buffer).map(toR3StageInput))
    }
    if (files.office) {
      const buffer = Buffer.from(await files.office.arrayBuffer())
      rows.push(...officeFunnelParser.parse(buffer).map(toOfficeStageInput))
    }
    if (files.sales) {
      const buffer = Buffer.from(await files.sales.arrayBuffer())
      rows.push(...salesReportParser.parse(buffer).map(toSalesStageInput))
    }

    for (let offset = 0; offset < rows.length; offset += CHUNK_SIZE) {
      await stageImportRows(batch.id, rows.slice(offset, offset + CHUNK_SIZE), accessToken)
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
    const message = error instanceof Error ? error.message : 'R3_IMPORT_FAILED'
    await updateImportBatchStatus(batch.id, 'PARSING_FAILED', message, accessToken).catch(() => undefined)
    throw new Error(message)
  }
}

type TargetStageInput = ReturnType<typeof toR3StageInput>
