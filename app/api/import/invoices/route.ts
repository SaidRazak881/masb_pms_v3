import { NextResponse } from 'next/server'
import { importInvoiceWorkbook } from '@/lib/imports/invoice-import'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 25 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
])

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const fileValue = formData.get('file')
    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: 'INVOICE_FILE_REQUIRED' }, { status: 400 })
    }
    if (fileValue.size === 0) return NextResponse.json({ error: 'INVOICE_FILE_EMPTY' }, { status: 400 })
    if (fileValue.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'INVOICE_FILE_TOO_LARGE' }, { status: 413 })
    if (!ALLOWED_TYPES.has(fileValue.type) && !/\.xlsx?$/i.test(fileValue.name)) {
      return NextResponse.json({ error: 'INVOICE_FILE_TYPE_NOT_SUPPORTED' }, { status: 415 })
    }

    const authorization = request.headers.get('authorization')
    const bearerMatch = authorization?.match(/^Bearer\s+(.+)$/i)
    const accessToken = bearerMatch?.[1]?.trim()

    const result = await importInvoiceWorkbook(fileValue, accessToken)
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'INVOICE_IMPORT_FAILED'
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'IMPORT_FORBIDDEN' ? 403 : 422
    return NextResponse.json({ error: message }, { status })
  }
}
