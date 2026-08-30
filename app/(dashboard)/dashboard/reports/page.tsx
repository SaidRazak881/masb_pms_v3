import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, type StatusType } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

type R1Row = Database['public']['Views']['vw_r1_income_statement']['Row']
type R2Row = Database['public']['Views']['vw_r2_overall_report']['Row']
type R3Row = Database['public']['Views']['vw_r3_sales_funnel']['Row']

const money = (value: number | null | undefined): string =>
  `RM ${Number(value ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`

const pct = (value: number | null | undefined): string =>
  value == null ? '—' : `${Number(value).toFixed(2)}%`

const canonicalStatus = (status: string | null | undefined): StatusType | null => {
  const value = status?.toUpperCase().replaceAll(' ', '_')
  const supported: StatusType[] = [
    'PAID', 'UNPAID', 'PARTIAL', 'OVERDUE', 'PENDING', 'INVOICED', 'DRAFT',
    'UPCOMING', 'PENDING_DATA', 'COMPLETED', 'APPROVED', 'REJECTED', 'SECURED',
    'IN_PROGRESS', 'LOST', 'QUOTATION_SENT',
  ]
  return value && supported.includes(value as StatusType) ? (value as StatusType) : null
}

function ReportStatus({ status }: { status: string | null | undefined }) {
  const canonical = canonicalStatus(status)
  if (canonical) return <StatusBadge status={canonical} label={status ?? undefined} />
  return <Badge variant="default">{status ?? '—'}</Badge>
}

function ExportButton({ type, label }: { type: 'r1' | 'r2' | 'r3'; label: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={`/api/reports/export?type=${type}`}>{label}</Link>
    </Button>
  )
}

const metricValueClass = 'mt-2 whitespace-nowrap text-[32px] font-semibold leading-[1.2] tabular-nums tracking-tight'
const tableClass = 'w-full min-w-[1000px] text-[13px] leading-[1.4]'
const tableHeadClass = 'sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500'
const cellClass = 'p-3'

export default async function ReportsPage() {
  const supabase = await createClient()

  const [{ data: r1Rows, error: r1Error }, { data: r2Rows, error: r2Error }, { data: r3Rows, error: r3Error }] = await Promise.all([
    supabase.from('vw_r1_income_statement').select('*').order('invoice_date', { ascending: false }),
    supabase.from('vw_r2_overall_report').select('*').order('start_date', { ascending: false }),
    supabase.from('vw_r3_sales_funnel').select('*').order('weighted_value', { ascending: false }),
  ])

  const r1: R1Row[] = r1Rows ?? []
  const r2: R2Row[] = r2Rows ?? []
  const r3: R3Row[] = r3Rows ?? []

  const r1Invoiced = r1.reduce((sum, row) => sum + Number(row.total_value ?? 0), 0)
  const r1Profit = r1.reduce((sum, row) => sum + Number(row.net_profit ?? 0), 0)
  const r1Overdue = r1.filter((row) => Number(row.days_outstanding ?? 0) > 0).length
  const r1Paid = r1.filter((row) => row.payment_status?.toUpperCase() === 'PAID').length

  const r2Sessions = new Set(r2.map((row) => row.program_code ?? '').filter(Boolean)).size
  const r2Participants = r2.reduce((sum, row) => sum + Number(row.total_count ?? 0), 0)
  const r2Bumi = r2.reduce((sum, row) => sum + Number(row.bumiputera_count ?? 0), 0)
  const r2Non = r2.reduce((sum, row) => sum + Number(row.non_bumiputera_count ?? 0), 0)

  const r3Forecast = r3.reduce((sum, row) => sum + Number(row.forecast_value ?? 0), 0)
  const r3Weighted = r3.reduce((sum, row) => sum + Number(row.weighted_value ?? 0), 0)
  const r3Secured = r3.reduce((sum, row) => sum + Number(row.secured_value ?? 0), 0)
  const r3Stages = new Set(r3.map((row) => row.current_stage ?? '').filter(Boolean)).size

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Laporan agregat R1 / R2 / R3 daripada view Supabase. Gunakan butang CSV untuk eksport.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton type="r1" label="CSV R1" />
          <ExportButton type="r2" label="CSV R2" />
          <ExportButton type="r3" label="CSV R3" />
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">R1 — Income Statement</h2>
          <Button asChild size="sm"><Link href="/dashboard/r1">Buka R1</Link></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Invoiced</p><p className={metricValueClass}>{money(r1Invoiced)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Net Profit</p><p className={metricValueClass}>{money(r1Profit)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Paid Invoices</p><p className={metricValueClass}>{r1Paid}/{r1.length}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Lewat / Belum Bayar</p><p className={`${metricValueClass} text-amber-700`}>{r1Overdue}</p></CardContent></Card>
        </div>
        {r1Error ? <p className="text-xs text-red-600">R1: {r1Error.message}</p> : null}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className={tableClass}>
                <thead className={tableHeadClass}>
                  <tr><th className="p-3 text-left">Program</th><th className="p-3 text-left">Company</th><th className="p-3 text-left">Invoice</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Cost</th><th className="p-3 text-right">Net Profit</th><th className="p-3 text-right">Profit %</th><th className="p-3 text-left">Status</th></tr>
                </thead>
                <tbody>
                  {r1.slice(0, 25).map((row, index) => (
                    <tr key={`${row.program_code}-${row.invoice_no}-${index}`} className="border-t border-slate-200 transition-colors odd:bg-white even:bg-slate-50/50 hover:bg-slate-50">
                      <td className={`${cellClass} font-medium text-blue-600`}>{row.program_code ?? '—'}</td>
                      <td className={`${cellClass} max-w-[200px] truncate`}>{row.company_name ?? '—'}</td>
                      <td className={cellClass}>{row.invoice_no ?? '—'}</td>
                      <td className={`${cellClass} text-right tabular-nums`}>{money(row.total_value)}</td>
                      <td className={`${cellClass} text-right tabular-nums`}>{row.cost_of_sales_amount == null ? '—' : money(row.cost_of_sales_amount)}</td>
                      <td className={`${cellClass} text-right tabular-nums`}>{row.net_profit == null ? '—' : money(row.net_profit)}</td>
                      <td className={`${cellClass} text-right tabular-nums`}>{pct(row.profit_pct)}</td>
                      <td className={cellClass}><ReportStatus status={row.payment_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {r1.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Tiada data R1.</p> : r1.length > 25 ? <p className="mt-2 text-xs text-slate-500">Menunjukkan 25 dari {r1.length} baris. Eksport CSV untuk penuh.</p> : null}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">R2 — Training Report</h2>
          <Button asChild size="sm"><Link href="/dashboard/r2">Buka R2</Link></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Sessions</p><p className={metricValueClass}>{r2Sessions}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Participants</p><p className={metricValueClass}>{r2Participants}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Bumiputera</p><p className={metricValueClass}>{r2Bumi}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Non-Bumiputera</p><p className={metricValueClass}>{r2Non}</p></CardContent></Card>
        </div>
        {r2Error ? <p className="text-xs text-red-600">R2: {r2Error.message}</p> : null}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className={tableClass}>
                <thead className={tableHeadClass}>
                  <tr><th className="p-3 text-left">Program</th><th className="p-3 text-left">Session</th><th className="p-3 text-left">Company</th><th className="p-3 text-left">Category</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Bumi</th><th className="p-3 text-right">Non-Bumi</th><th className="p-3 text-left">Status</th></tr>
                </thead>
                <tbody>
                  {r2.slice(0, 25).map((row, index) => (
                    <tr key={`${row.program_code}-${row.session_title}-${row.category}-${index}`} className="border-t border-slate-200 transition-colors odd:bg-white even:bg-slate-50/50 hover:bg-slate-50">
                      <td className={`${cellClass} font-medium text-blue-600`}>{row.program_code ?? '—'}</td>
                      <td className={`${cellClass} max-w-[260px] truncate`}>{row.session_title ?? '—'}</td>
                      <td className={`${cellClass} max-w-[180px] truncate`}>{row.company_name ?? '—'}</td>
                      <td className={cellClass}><Badge variant="default">{row.category ?? '—'}</Badge></td>
                      <td className={`${cellClass} text-right tabular-nums`}>{row.total_count ?? 0}</td>
                      <td className={`${cellClass} text-right tabular-nums`}>{row.bumiputera_count ?? 0}</td>
                      <td className={`${cellClass} text-right tabular-nums`}>{row.non_bumiputera_count ?? 0}</td>
                      <td className={cellClass}><ReportStatus status={row.r2_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {r2.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Tiada data R2.</p> : r2.length > 25 ? <p className="mt-2 text-xs text-slate-500">Menunjukkan 25 dari {r2.length} baris. Eksport CSV untuk penuh.</p> : null}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">R3 — Sales Funnel</h2>
          <Button asChild size="sm"><Link href="/dashboard/programs">Buka Program 360</Link></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Forecast</p><p className={metricValueClass}>{money(r3Forecast)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Weighted</p><p className={metricValueClass}>{money(r3Weighted)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Secured</p><p className={metricValueClass}>{money(r3Secured)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Stages</p><p className={metricValueClass}>{r3Stages}</p></CardContent></Card>
        </div>
        {r3Error ? <p className="text-xs text-red-600">R3: {r3Error.message}</p> : null}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className={tableClass}>
                <thead className={tableHeadClass}>
                  <tr><th className="p-3 text-left">Program</th><th className="p-3 text-left">Company</th><th className="p-3 text-left">Title</th><th className="p-3 text-left">Stage</th><th className="p-3 text-right">Forecast</th><th className="p-3 text-right">Weighted</th><th className="p-3 text-right">Secured</th></tr>
                </thead>
                <tbody>
                  {r3.slice(0, 25).map((row, index) => (
                    <tr key={`${row.program_code}-${row.title}-${index}`} className="border-t border-slate-200 transition-colors odd:bg-white even:bg-slate-50/50 hover:bg-slate-50">
                      <td className={`${cellClass} font-medium text-blue-600`}>{row.program_code ?? '—'}</td>
                      <td className={`${cellClass} max-w-[180px] truncate`}>{row.company_name ?? '—'}</td>
                      <td className={`${cellClass} max-w-[260px] truncate`}>{row.title ?? '—'}</td>
                      <td className={cellClass}><Badge variant="default">{row.current_stage ?? '—'}</Badge></td>
                      <td className={`${cellClass} text-right tabular-nums`}>{money(row.forecast_value)}</td>
                      <td className={`${cellClass} text-right tabular-nums`}>{money(row.weighted_value)}</td>
                      <td className={`${cellClass} text-right tabular-nums`}>{money(row.secured_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {r3.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Tiada data R3.</p> : r3.length > 25 ? <p className="mt-2 text-xs text-slate-500">Menunjukkan 25 dari {r3.length} baris. Eksport CSV untuk penuh.</p> : null}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}