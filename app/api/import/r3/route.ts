import { NextResponse } from 'next/server'
import { importR3Workbooks } from '@/lib/imports/r3-import'
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
    const getFile = (name: string): File | undefined => {
      const value = formData.get(name)
      return value instanceof File ? value : undefined
    }
    const files = {
      r3: getFile('r3'),
      office: getFile('office'),
      sales: getFile('sales'),
    }
    if (!files.r3 && !files.office && !files.sales) {
      return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 })
    }
    for (const file of [files.r3, files.office, files.sales]) {
      if (file && file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 413 })
    }

    const result = await importR3Workbooks(files, accessToken)
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'R3_IMPORT_FAILED'
    if (message === 'IMPORT_FORBIDDEN') return NextResponse.json({ error: 'IMPORT_FORBIDDEN' }, { status: 403 })
    if (message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
