import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge, type StatusType } from '@/components/ui/status-badge'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
type R1Row = Database['public']['Views']['vw_r1_income_statement']['Row']
function canonicalStatus(status: string | null): StatusType { const value = status?.toUpperCase(); if (value === 'PAID' || value === 'PARTIAL' || value === 'OVERDUE' || value === 'UNPAID') return value; return 'PENDING' }
export default async function R1Page() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('vw_r1_income_statement').select('*').order('invoice_date', { ascending: false })
  if (error) return <div className="space-y-6 p-6"><h1 className="text-2xl font-bold tracking-tight">R1 — Income Statement</h1><Card><CardContent className="p-6"><p className="text-sm text-slate-600">R1 data could not be loaded right now.</p><p className="mt-2 text-xs text-red-600">{error.message}</p></CardContent></Card></div>
  const rows: R1Row[] = data ?? []
  const money = (value: number) => `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const totalInvoiced = rows.reduce((sum, row) => sum + Number(row.total_value ?? 0), 0)
  const totalCost = rows.reduce((sum, row) => sum + Number(row.cost_of_sales_amount ?? 0), 0)
  const totalProfit = rows.reduce((sum, row) => sum + Number(row.net_profit ?? 0), 0)
  const overdue = rows.filter((row) => Number(row.days_outstanding ?? 0) > 0)
  return <div className="space-y-6 p-6">
    <div><h1 className="text-2xl font-bold tracking-tight">R1 — Income Statement</h1><p className="mt-1 text-sm text-slate-500">Generated from invoices + cost_of_sales (`vw_r1_income_statement`).</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Invoices', String(rows.length)], ['Total Invoiced', money(totalInvoiced)], ['Total Cost of Sales', money(totalCost)], ['Net Profit', money(totalProfit)]].map(([label, value]) => <Card key={label}><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-[32px] font-semibold leading-[1.2] tabular-nums">{value}</p></CardContent></Card>)}</div>
    <Card><CardContent className="p-4 sm:p-6"><div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[1000px] text-[13px] leading-[1.4]"><thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><tr>{['Program','Company','Invoice','Date','Total','Days','Cost','Net Profit','Profit %','Status'].map((h, i) => <th key={h} className={`border-b border-slate-200 p-3 ${i >= 4 && i <= 8 ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.program_code}-${row.invoice_no}-${index}`} className="border-t border-slate-100 transition-colors odd:bg-white even:bg-slate-50/50 hover:bg-slate-100/70"><td className="p-3 font-medium text-blue-600">{row.program_code ?? '—'}</td><td className="max-w-[220px] truncate p-3">{row.company_name ?? '—'}</td><td className="p-3">{row.invoice_no ?? '—'}</td><td className="p-3">{row.invoice_date ? new Date(row.invoice_date).toLocaleDateString('en-MY') : '—'}</td><td className="p-3 text-right tabular-nums">{money(Number(row.total_value ?? 0))}</td><td className={`p-3 text-right tabular-nums ${Number(row.days_outstanding ?? 0) > 0 ? 'font-medium text-red-700' : ''}`}>{row.days_outstanding ?? '—'}</td><td className="p-3 text-right tabular-nums">{row.cost_of_sales_amount == null ? '—' : money(Number(row.cost_of_sales_amount))}</td><td className="p-3 text-right tabular-nums">{row.net_profit == null ? '—' : money(Number(row.net_profit))}</td><td className="p-3 text-right tabular-nums">{row.profit_pct == null ? '—' : `${Number(row.profit_pct).toFixed(2)}%`}</td><td className="p-3"><StatusBadge status={canonicalStatus(row.payment_status)} label={row.payment_status ?? 'PENDING'} /></td></tr>)}</tbody></table></div>{rows.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No R1 data. Import invoices/cost of sales to populate the report.</p> : null}{overdue.length > 0 ? <p className="mt-3 text-xs text-amber-700">{overdue.length} invoices are unpaid or overdue.</p> : null}</CardContent></Card>
  </div>
}
