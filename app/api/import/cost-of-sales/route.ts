import { NextResponse } from 'next/server'
import { importCostOfSalesWorkbook } from '@/lib/imports/cost-of-sales-import'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]
    const supabase = await createClient(accessToken)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'AUTH_REQUIRED' }, { status:401 })

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error:'FILE_REQUIRED' }, { status:400 })
    if (!file.name.toLowerCase().endsWith('.xlsx')) return NextResponse.json({ error:'INVALID_FILE_TYPE' }, { status:400 })

    const result = await importCostOfSalesWorkbook(file, accessToken)
    return NextResponse.json({ data:result }, { status:201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'COST_OF_SALES_IMPORT_FAILED'
    if (message === 'IMPORT_FORBIDDEN') return NextResponse.json({ error:'IMPORT_FORBIDDEN' }, { status:403 })
    if (message === 'AUTH_REQUIRED') return NextResponse.json({ error:'AUTH_REQUIRED' }, { status:401 })
    return NextResponse.json({ error:message }, { status:500 })
  }
}
