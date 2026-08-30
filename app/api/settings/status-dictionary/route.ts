import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })

    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profileError) throw profileError
    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'SETTINGS_FORBIDDEN' }, { status: 403 })
    }

    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
    const sourceSystem = (body as { source_system?: unknown }).source_system
    const entityType = (body as { entity_type?: unknown }).entity_type
    const rawValue = (body as { raw_value?: unknown }).raw_value
    const canonicalValue = (body as { canonical_value?: unknown }).canonical_value

    if (typeof sourceSystem !== 'string' || !sourceSystem.trim()) return NextResponse.json({ error: 'SOURCE_SYSTEM_REQUIRED' }, { status: 400 })
    if (typeof entityType !== 'string' || !entityType.trim()) return NextResponse.json({ error: 'ENTITY_TYPE_REQUIRED' }, { status: 400 })
    if (typeof rawValue !== 'string' || !rawValue.trim()) return NextResponse.json({ error: 'RAW_VALUE_REQUIRED' }, { status: 400 })
    if (typeof canonicalValue !== 'string' || !canonicalValue.trim()) return NextResponse.json({ error: 'CANONICAL_VALUE_REQUIRED' }, { status: 400 })

    const { data, error } = await supabase.from('status_dictionary')
      .upsert(
        {
          source_system: sourceSystem.trim(),
          entity_type: entityType.trim(),
          raw_value: rawValue.trim(),
          canonical_value: canonicalValue.trim(),
        },
        { onConflict: 'source_system,entity_type,raw_value' },
      )
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'STATUS_DICTIONARY_CREATE_FAILED'
    if (message.includes('AUTH_REQUIRED')) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    if (message.includes('SETTINGS_FORBIDDEN')) return NextResponse.json({ error: 'SETTINGS_FORBIDDEN' }, { status: 403 })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
