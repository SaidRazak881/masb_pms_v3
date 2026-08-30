import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['super_admin', 'admin', 'manager', 'pic', 'viewer']

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })

    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profileError) throw profileError
    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'SETTINGS_FORBIDDEN' }, { status: 403 })
    }

    const { data, error } = await supabase.from('profiles').select('*').order('role', { ascending: true }).order('full_name', { ascending: true })
    if (error) throw error
    return NextResponse.json({ data: data ?? [] }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PROFILES_LOAD_FAILED'
    if (message.includes('AUTH_REQUIRED')) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    if (message.includes('SETTINGS_FORBIDDEN')) return NextResponse.json({ error: 'SETTINGS_FORBIDDEN' }, { status: 403 })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
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
    const id = (body as { id?: unknown }).id
    const role = (body as { role?: unknown }).role
    const isActive = (body as { is_active?: unknown }).is_active

    if (typeof id !== 'string' || !id) return NextResponse.json({ error: 'PROFILE_ID_REQUIRED' }, { status: 400 })
    if (id === user.id) return NextResponse.json({ error: 'SELF_UPDATE_FORBIDDEN' }, { status: 400 })
    if (role !== undefined && (typeof role !== 'string' || !ALLOWED_ROLES.includes(role))) {
      return NextResponse.json({ error: 'INVALID_ROLE' }, { status: 400 })
    }
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'INVALID_IS_ACTIVE' }, { status: 400 })
    }

    const payload: Database['public']['Tables']['profiles']['Update'] = { updated_at: new Date().toISOString() }
    if (role !== undefined) payload.role = role as Database['public']['Tables']['profiles']['Update']['role']
    if (isActive !== undefined) payload.is_active = isActive

    const { data, error } = await supabase.from('profiles').update(payload).eq('id', id).select('*').single()
    if (error) throw error
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PROFILE_UPDATE_FAILED'
    if (message.includes('AUTH_REQUIRED')) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    if (message.includes('SETTINGS_FORBIDDEN')) return NextResponse.json({ error: 'SETTINGS_FORBIDDEN' }, { status: 403 })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
