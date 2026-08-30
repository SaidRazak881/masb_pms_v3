import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { commitR2Batch, commitR2Roster, auditR2Roster } from '@/lib/imports/production-commit-service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
    const supabase = await createClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })

    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profileError) throw profileError
    if (!profile || !['super_admin', 'admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'IMPORT_FORBIDDEN' }, { status: 403 })
    }

    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || !('batch_id' in body) || typeof body.batch_id !== 'string') {
      return NextResponse.json({ error: 'BATCH_ID_REQUIRED' }, { status: 400 })
    }

    const overall = await commitR2Batch(body.batch_id, token)
    const roster = await commitR2Roster(body.batch_id, token)
    const audit = await auditR2Roster(body.batch_id, token)
    return NextResponse.json({ data: { ...overall, roster, audit } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'R2_COMMIT_FAILED'
    if (message.includes('AUTH_REQUIRED')) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    if (message.includes('IMPORT_FORBIDDEN')) return NextResponse.json({ error: 'IMPORT_FORBIDDEN' }, { status: 403 })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
