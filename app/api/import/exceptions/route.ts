import { NextResponse } from 'next/server'
import { createExceptionsForBatch, listExceptions } from '@/lib/imports/exception-service'

export const runtime = 'nodejs'

function bearer(request: Request): string | undefined {
  return request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
}

export async function GET(request: Request) {
  try {
    const batchId = new URL(request.url).searchParams.get('batch_id') ?? undefined
    const data = await listExceptions(batchId, bearer(request))
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'EXCEPTION_LIST_FAILED'
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'IMPORT_FORBIDDEN' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || !('batch_id' in body) || typeof body.batch_id !== 'string' || !body.batch_id.trim()) return NextResponse.json({ error: 'BATCH_ID_REQUIRED' }, { status: 400 })
    const data = await createExceptionsForBatch(body.batch_id, bearer(request))
    return NextResponse.json({ data, count: data.length }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'EXCEPTION_CREATE_FAILED'
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'IMPORT_FORBIDDEN' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
