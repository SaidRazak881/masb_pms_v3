import { NextResponse } from 'next/server'
import { importR2Workbook } from '@/lib/imports/r2-import'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 25 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]
    const supabase = await createClient(accessToken)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })

    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profileError) throw profileError
    if (!profile || !['super_admin', 'admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'IMPORT_FORBIDDEN' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 })
    if (file.size === 0) return NextResponse.json({ error: 'FILE_EMPTY' }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 413 })
    if (!/\.xlsx?$/i.test(file.name)) return NextResponse.json({ error: 'INVALID_FILE_TYPE' }, { status: 415 })

    const result = await importR2Workbook(file, accessToken)
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'R2_IMPORT_FAILED'
    if (message === 'IMPORT_FORBIDDEN') return NextResponse.json({ error: 'IMPORT_FORBIDDEN' }, { status: 403 })
    if (message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
