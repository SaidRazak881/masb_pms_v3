import { NextResponse } from 'next/server'
import { resolveException, type ExceptionStatus } from '@/lib/imports/exception-service'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }
function bearer(request: Request): string | undefined { return request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1] }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || !('status' in body) || !['OPEN','RESOLVED','IGNORED'].includes(body.status as string)) return NextResponse.json({ error:'INVALID_STATUS' }, { status:400 })
    const note = 'resolution_note' in body && (typeof body.resolution_note === 'string' || body.resolution_note === null) ? body.resolution_note : null
    const data = await resolveException(id, body.status as ExceptionStatus, note, bearer(request))
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'EXCEPTION_UPDATE_FAILED'
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'IMPORT_FORBIDDEN' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
