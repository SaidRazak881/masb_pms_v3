import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

type R1Row = Database['public']['Views']['vw_r1_income_statement']['Row']

const statusClass = (status: string | null) => {
  switch (status?.toUpperCase()) {
    case 'PAID': return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'PARTIAL': return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'OVERDUE': return 'border-red-200 bg-red-50 text-red-700'
    default: return 'border-amber-200 bg-amber-50 text-amber-700'
  }
}

export default async function R1Page() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('vw_r1_income_statement').select('*').order('invoice_date', { ascending: false })

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold tracking-tight">R1 — Income Statement</h1>
        <Card><CardContent className="p-6"><p className="text-sm text-slate-600">Data R1 tidak dapat dimuatkan sekarang.</p><p className="mt-2 text-xs text-red-600">{error.message}</p></CardContent></Card>
      </div>
    )
  }

  const rows: R1Row[] = data ?? []
  const totalInvoiced = rows.reduce((sum, row) => sum + Number(row.total_value ?? 0), 0)
  const totalCost = rows.reduce((sum, row) => sum + Number(row.cost_of_sales_amount ?? 0), 0)
  const totalProfit = rows.reduce((sum, row) => sum + Number(row.net_profit ?? 0), 0)
  const overdue = rows.filter((row) => Number(row.days_outstanding ?? 0) > 0)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">R1 — Income Statement</h1>
        <p className="mt-1 text-sm text-slate-500">Dijana daripada invoices + cost_of_sales (view `vw_r1_income_statement`).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Invoices</p><p className="mt-2 text-2xl font-bold">{rows.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Total Invoiced</p><p className="mt-2 text-2xl font-bold">RM {totalInvoiced.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Total Cost of Sales</p><p className="mt-2 text-2xl font-bold">RM {totalCost.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Net Profit</p><p className="mt-2 text-2xl font-bold">RM {totalProfit.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3 text-left">Program</th>
                  <th className="p-3 text-left">Company</th>
                  <th className="p-3 text-left">Invoice</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Days</th>
                  <th className="p-3 text-right">Cost</th>
                  <th className="p-3 text-right">Net Profit</th>
                  <th className="p-3 text-right">Profit %</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.program_code}-${row.invoice_no}-${index}`} className="border-t transition-colors hover:bg-slate-50">
                    <td className="p-3 font-medium text-blue-600">{row.program_code ?? '—'}</td>
                    <td className="max-w-[220px] truncate p-3">{row.company_name ?? '—'}</td>
                    <td className="p-3">{row.invoice_no ?? '—'}</td>
                    <td className="p-3">{row.invoice_date ? new Date(row.invoice_date).toLocaleDateString('en-MY') : '—'}</td>
                    <td className="p-3 text-right tabular-nums">RM {Number(row.total_value ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    <td className={`p-3 text-right tabular-nums ${Number(row.days_outstanding ?? 0) > 0 ? 'font-medium text-red-700' : ''}`}>{row.days_outstanding ?? '—'}</td>
                    <td className="p-3 text-right tabular-nums">{row.cost_of_sales_amount == null ? '—' : `RM ${Number(row.cost_of_sales_amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}</td>
                    <td className="p-3 text-right tabular-nums">{row.net_profit == null ? '—' : `RM ${Number(row.net_profit).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}</td>
                    <td className="p-3 text-right tabular-nums">{row.profit_pct == null ? '—' : `${Number(row.profit_pct).toFixed(2)}%`}</td>
                    <td className="p-3"><Badge className={statusClass(row.payment_status)}>{row.payment_status ?? '—'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">Tiada data R1. Import invoices/cost of sales untuk melihat laporan.</p> : null}
          {overdue.length > 0 ? <p className="mt-3 text-xs text-amber-700">{overdue.length} invoice dalam keadaan belum/lewat bayar.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
