import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { matchImportStaging, persistMatchingResults } from '@/lib/imports/matching-engine'

export const runtime = 'nodejs'

type Params = { params: Promise<{ batchId: string }> }

// POST /api/import/{batchId}/match-engine
// Runs the Sprint-2 Matching Engine (matchImportStaging + persistMatchingResults).
// This is the MANDATORY step BEFORE Matching Resolution: it sets
// import_staging.matching_status to EXACT / ALIAS / COMPOSITE / NONE / AMBIGUOUS
// (and stores match detail in metadata). Without this step the resolution route
// returns zero rows because it filters on those matched statuses.
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

    const results = await matchImportStaging(batchId, token)
    await persistMatchingResults(batchId, results, token)

    // Advance the batch state to MATCHING so the review UI reflects the step.
    await supabase.from('import_batches').update({ status: 'MATCHING' }).eq('id', batchId).eq('status', 'STAGED')

    const matched = results.filter((r) => ['EXACT', 'ALIAS', 'COMPOSITE', 'FUZZY_REVIEW'].includes(r.status)).length
    const ambiguous = results.filter((r) => r.status === 'AMBIGUOUS').length
    const unmatched = results.filter((r) => r.status === 'NONE').length
    const duplicates = results.filter((r) => r.duplicate === true).length

    return NextResponse.json({ data: { batchId, total: results.length, matched, ambiguous, unmatched, duplicates, results } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MATCHING_ENGINE_FAILED'
    if (message.includes('AUTH_REQUIRED')) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    if (message.includes('IMPORT_FORBIDDEN')) return NextResponse.json({ error: 'IMPORT_FORBIDDEN' }, { status: 403 })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
