import { NextResponse } from 'next/server'
import { createImportBatch } from '@/lib/imports/service'
import type { CreateImportBatchInput } from '@/lib/imports/types'

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 })
    const input = body as Partial<CreateImportBatchInput>
    if (typeof input.source_type !== 'string' || typeof input.file_name !== 'string') {
      return NextResponse.json({ error: 'source_type and file_name are required' }, { status: 400 })
    }
    const batch = await createImportBatch({
      source_type: input.source_type,
      file_name: input.file_name,
      file_size_bytes: typeof input.file_size_bytes === 'number' ? input.file_size_bytes : null,
      content_type: typeof input.content_type === 'string' ? input.content_type : null,
      metadata: input.metadata ?? {},
    })
    return NextResponse.json({ data: batch }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'IMPORT_BATCH_CREATE_FAILED'
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'IMPORT_FORBIDDEN' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
