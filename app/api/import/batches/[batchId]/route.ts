import { NextResponse } from 'next/server'
import { getImportBatch, updateImportBatchStatus } from '@/lib/imports/service'
import type { ImportBatchStatus } from '@/types/database'

const STATUSES: readonly ImportBatchStatus[] = ['UPLOADED','PARSING','STAGED','VALIDATING','MATCHING','READY','COMMITTING','COMPLETED','PARSING_FAILED','VALIDATION_FAILED','MATCHING_FAILED','ROLLED_BACK','CANCELLED','FAILED']

export async function GET(_request: Request, context: { params: Promise<{ batchId: string }> }) {
  try {
    const { batchId } = await context.params
    const batch = await getImportBatch(batchId)
    return NextResponse.json({ data: batch })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'IMPORT_BATCH_GET_FAILED'
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'IMPORT_FORBIDDEN' ? 403 : message === 'IMPORT_BATCH_NOT_FOUND' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ batchId: string }> }) {
  try {
    const { batchId } = await context.params
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || typeof (body as { status?: unknown }).status !== 'string') {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }
    const input = body as { status: string; error_message?: string | null }
    if (!STATUSES.includes(input.status as ImportBatchStatus)) return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 })
    const batch = await updateImportBatchStatus(batchId, input.status as ImportBatchStatus, input.error_message ?? null)
    return NextResponse.json({ data: batch })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'IMPORT_BATCH_UPDATE_FAILED'
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'IMPORT_FORBIDDEN' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
