import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const toCsv = (headers: string[], rows: unknown[][]): string =>
  [headers.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n')

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })

    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profileError) throw profileError
    if (!profile || !['super_admin', 'admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'REPORT_FORBIDDEN' }, { status: 403 })
    }

    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const today = new Date().toISOString().slice(0, 10)

    let filename = `${type ?? 'report'}-report-${today}.csv`
    let csv = ''

    if (type === 'r1') {
      const { data, error } = await supabase.from('vw_r1_income_statement').select('*').order('invoice_date', { ascending: false })
      if (error) throw error
      csv = toCsv(
        ['program_code', 'company_name', 'title', 'invoice_no', 'invoice_date', 'total_value', 'payment_status', 'cost_of_sales_amount', 'net_profit', 'profit_pct'],
        (data ?? []).map((row) => [row.program_code, row.company_name, row.title, row.invoice_no, row.invoice_date, row.total_value, row.payment_status, row.cost_of_sales_amount, row.net_profit, row.profit_pct]),
      )
    } else if (type === 'r2') {
      const { data, error } = await supabase.from('vw_r2_overall_report').select('*').order('start_date', { ascending: false })
      if (error) throw error
      csv = toCsv(
        ['program_code', 'session_title', 'company_name', 'session_type', 'start_date', 'end_date', 'r2_status', 'category', 'workshop_count', 'training_count', 'total_count', 'bumiputera_count', 'non_bumiputera_count'],
        (data ?? []).map((row) => [row.program_code, row.session_title, row.company_name, row.session_type, row.start_date, row.end_date, row.r2_status, row.category, row.workshop_count, row.training_count, row.total_count, row.bumiputera_count, row.non_bumiputera_count]),
      )
    } else if (type === 'r3') {
      const { data, error } = await supabase.from('vw_r3_sales_funnel').select('*').order('weighted_value', { ascending: false })
      if (error) throw error
      csv = toCsv(
        ['program_code', 'company_name', 'title', 'current_stage', 'forecast_value', 'probability', 'weighted_value', 'secured_value', 'lead_date', 'sector'],
        (data ?? []).map((row) => [row.program_code, row.company_name, row.title, row.current_stage, row.forecast_value, row.probability, row.weighted_value, row.secured_value, row.lead_date, row.sector]),
      )
    } else {
      return NextResponse.json({ error: 'REPORT_TYPE_INVALID' }, { status: 400 })
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'REPORT_EXPORT_FAILED'
    if (message.includes('AUTH_REQUIRED')) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    if (message.includes('REPORT_FORBIDDEN')) return NextResponse.json({ error: 'REPORT_FORBIDDEN' }, { status: 403 })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
