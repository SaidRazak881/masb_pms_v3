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
    const companyId = (body as { company_id?: unknown }).company_id
    const aliasText = (body as { alias_text?: unknown }).alias_text

    if (typeof companyId !== 'string' || !companyId) return NextResponse.json({ error: 'COMPANY_ID_REQUIRED' }, { status: 400 })
    if (typeof aliasText !== 'string' || !aliasText.trim()) return NextResponse.json({ error: 'ALIAS_TEXT_REQUIRED' }, { status: 400 })

    const alias = aliasText.trim()
    const { data: company, error: companyError } = await supabase.from('companies').select('id, aliases').eq('id', companyId).maybeSingle()
    if (companyError) throw companyError
    if (!company) return NextResponse.json({ error: 'COMPANY_NOT_FOUND' }, { status: 404 })

    const { error: aliasInsertError } = await supabase.from('company_alias_map').insert({ company_id: companyId, alias_text: alias })
    if (aliasInsertError) {
      // If the alias already exists, silently keep it rather than surfacing an error.
      if (!String(aliasInsertError.message).toLowerCase().includes('duplicate')) throw aliasInsertError
    }

    const existingAliases = Array.isArray(company.aliases) ? company.aliases : []
    if (!existingAliases.some((value) => value.toLowerCase() === alias.toLowerCase())) {
      await supabase.from('companies').update({ aliases: [...existingAliases, alias] }).eq('id', companyId)
    }

    const { error: refetchError } = await supabase.from('company_alias_map').select('id').eq('company_id', companyId).eq('alias_text', alias).maybeSingle()
    if (refetchError) throw refetchError

    return NextResponse.json({ data: { company_id: companyId, alias_text: alias } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'COMPANY_ALIAS_CREATE_FAILED'
    if (message.includes('AUTH_REQUIRED')) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    if (message.includes('SETTINGS_FORBIDDEN')) return NextResponse.json({ error: 'SETTINGS_FORBIDDEN' }, { status: 403 })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
