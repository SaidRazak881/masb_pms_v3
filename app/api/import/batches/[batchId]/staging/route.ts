import { NextResponse } from 'next/server'
import { stageImportRows, updateBatchStatistics } from '@/lib/imports/service'
import type { StageImportRowInput } from '@/lib/imports/types'

export async function POST(request: Request, context: { params: Promise<{ batchId: string }> }) {
  try {
    const { batchId } = await context.params
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || !Array.isArray((body as { rows?: unknown }).rows)) {
      return NextResponse.json({ error: 'rows array is required' }, { status: 400 })
    }
    const rows = (body as { rows: unknown[] }).rows
    const validRows: StageImportRowInput[] = []
    for (const value of rows) {
      if (!value || typeof value !== 'object') return NextResponse.json({ error: 'INVALID_ROW' }, { status: 400 })
      const row = value as Partial<StageImportRowInput>
      if (typeof row.source_type !== 'string' || typeof row.source_row_number !== 'number' || !Number.isInteger(row.source_row_number) || row.source_row_number < 1 || typeof row.row_hash !== 'string' || row.row_hash.length === 0) {
        return NextResponse.json({ error: 'INVALID_STAGING_ROW' }, { status: 400 })
      }
      validRows.push({ ...row, source_type: row.source_type, source_row_number: row.source_row_number, row_hash: row.row_hash })
    }
    const staged = await stageImportRows(batchId, validRows)
    const batch = await updateBatchStatistics(batchId)
    return NextResponse.json({ data: { staged_rows: staged.length, batch } }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'IMPORT_STAGING_FAILED'
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'IMPORT_FORBIDDEN' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
