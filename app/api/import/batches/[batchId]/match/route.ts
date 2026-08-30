import { NextResponse } from 'next/server'
import { runMatchingPipeline } from '@/lib/imports/matching-engine'
import { createExceptionsForBatch } from '@/lib/imports/exception-service'
import { getImportBatch, updateImportBatchStatus } from '@/lib/imports/service'

export const runtime = 'nodejs'

function bearer(request: Request): string | undefined {
  return request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
}

/**
 * POST /api/import/batches/[batchId]/match
 *
 * Runs the post-parse matching pipeline for a batch and moves it to READY so the
 * commit engine (`commit_import_batch`) can process the committable rows.
 *
 * Before this route existed, staged rows stayed at `matching_status='PENDING'`
 * with `target_table = NULL`, so committing a batch always skipped every row and
 * reported `affected_records = 0` (silent no-op).
 *
 * Flow: batch → MATCHING → (match + persist + resolve target_table) → generate
 * data-quality exceptions → READY (or MATCHING_FAILED on error).
 */
export async function POST(request: Request, context: { params: Promise<{ batchId: string }> }) {
  try {
    const { batchId } = await context.params
    const token = bearer(request)

    // Guard: batch must exist and be in a state that allows matching.
    const batch = await getImportBatch(batchId, token)
    if (!['STAGED', 'VALIDATING', 'MATCHING', 'READY'].includes(batch.status)) {
      return NextResponse.json({ error: 'BATCH_NOT_IN_MATCHABLE_STATE', current_status: batch.status }, { status: 409 })
    }

    await updateImportBatchStatus(batchId, 'MATCHING', undefined, token)

    try {
      const pipeline = await runMatchingPipeline(batchId, token)

      // Generate data-quality exceptions from matching + validation outcomes so
      // operators can resolve unmatched rows before committing.
      let exceptionsCreated = 0
      try {
        const exceptions = await createExceptionsForBatch(batchId, token)
        exceptionsCreated = exceptions.length
      } catch {
        // Exception generation is best-effort — never fail the whole pipeline.
      }

      await updateImportBatchStatus(batchId, 'READY', undefined, token)

      return NextResponse.json({
        data: {
          batch_id: batchId,
          status: 'READY',
          ...pipeline,
          exceptions_created: exceptionsCreated,
        },
      }, { status: 200 })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MATCHING_FAILED'
      await updateImportBatchStatus(batchId, 'MATCHING_FAILED', message, token).catch(() => undefined)
      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MATCHING_FAILED'
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'IMPORT_FORBIDDEN' ? 403 : message === 'IMPORT_BATCH_NOT_FOUND' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
