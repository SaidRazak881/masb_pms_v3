import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rollbackProductionBatch } from '@/lib/imports/production-commit-service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
    const supabase = await createClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })

    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || !('batch_id' in body) || typeof body.batch_id !== 'string') {
      return NextResponse.json({ error: 'BATCH_ID_REQUIRED' }, { status: 400 })
    }

    const result = await rollbackProductionBatch(body.batch_id, token)
    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PRODUCTION_ROLLBACK_FAILED'
    if (message.includes('AUTH_REQUIRED')) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    if (message.includes('IMPORT_FORBIDDEN')) return NextResponse.json({ error: 'IMPORT_FORBIDDEN' }, { status: 403 })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
