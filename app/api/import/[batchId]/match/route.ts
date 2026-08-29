import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveMatchingTargets } from '@/lib/imports/matching-resolution-service'

export const runtime = 'nodejs'

type Params = { params: Promise<{ batchId: string }> }

export async function POST(request: Request, { params }: Params) {
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

    const { batchId } = await params
    if (!batchId) return NextResponse.json({ error: 'BATCH_ID_REQUIRED' }, { status: 400 })

    const results = await resolveMatchingTargets(batchId, token)
    const resolved = results.filter(result => result.targetRecordId !== null).length
    return NextResponse.json({ data: { batchId, total: results.length, resolved, unresolved: results.length - resolved, results } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MATCHING_RESOLUTION_FAILED'
    if (message.includes('AUTH_REQUIRED')) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    if (message.includes('IMPORT_FORBIDDEN')) return NextResponse.json({ error: 'IMPORT_FORBIDDEN' }, { status: 403 })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
