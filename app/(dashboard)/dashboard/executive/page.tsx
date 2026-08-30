import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { ExecutiveOverview } from '@/components/executive/executive-overview'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

type FunnelRow = Database['public']['Views']['vw_r3_sales_funnel']['Row']
type R1Row = Database['public']['Views']['vw_r1_income_statement']['Row']
type R2Row = Database['public']['Views']['vw_r2_overall_report']['Row']
type PaymentRow = { amount: number | null }

function money(value: number | null | undefined): number {
  return Number(value ?? 0)
}

function aggregateR3(rows: FunnelRow[]) {
  const stageMap = new Map<string, number>()
  let forecast = 0
  let weighted = 0
  let secured = 0
  for (const row of rows) {
    const stage = row.current_stage ?? 'UNKNOWN'
    stageMap.set(stage, (stageMap.get(stage) ?? 0) + 1)
    forecast += money(row.forecast_value)
    weighted += money(row.weighted_value)
    secured += money(row.secured_value)
  }
  const stages = Array.from(stageMap.entries()).map(([name, count]) => ({ name: name.replaceAll('_', ' '), count }))
  return { forecast, weighted, secured, stages, count: rows.length }
}

function aggregateR1(rows: R1Row[], payments: PaymentRow[]) {
  let invoiced = 0
  let cost = 0
  let profit = 0
  let collected = money(payments.reduce((sum, p) => sum + money(p.amount), 0))
  let overdueCount = 0
  let paidCount = 0
  let unpaidCount = 0
  const statusMap = new Map<string, number>()
  for (const row of rows) {
    invoiced += money(row.total_value)
    cost += money(row.cost_of_sales_amount)
    profit += money(row.net_profit)
    if (Number(row.days_outstanding ?? 0) > 0) overdueCount += 1
    const status = row.payment_status ?? 'UNKNOWN'
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1)
    if (status === 'PAID') paidCount += 1
    else if (status === 'UNPAID' || status === 'OVERDUE') unpaidCount += 1
  }
  const outstanding = Math.max(0, invoiced - collected)
  const statuses = Array.from(statusMap.entries()).map(([name, count]) => ({ name, count }))
  const collectionRate = invoiced > 0 ? (collected / invoiced) * 100 : 0
  return { invoiced, cost, profit, collected, outstanding, overdueCount, paidCount, unpaidCount, collectionRate, statuses, count: rows.length }
}

function aggregateR2(rows: R2Row[]) {
  const sessions = new Set<string>()
  let participants = 0
  let b = 0
  let nb = 0
  let workshop = 0
  let training = 0
  const categoryMap = new Map<string, number>()
  for (const row of rows) {
    if (row.program_code) sessions.add(row.program_code)
    participants += Number(row.total_count ?? 0)
    b += Number(row.bumiputera_count ?? 0)
    nb += Number(row.non_bumiputera_count ?? 0)
    workshop += Number(row.workshop_count ?? 0)
    training += Number(row.training_count ?? 0)
    const category = row.category ?? 'UNKNOWN'
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1)
  }
  const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
  return { sessions: sessions.size, participants, b, nb, workshop, training, categories, count: rows.length }
}

export default async function ExecutivePage() {
  await requireRole(['super_admin', 'admin', 'manager'])

  const supabase = await createClient()
  const [funnelResult, r1Result, r2Result, paymentsResult] = await Promise.all([
    supabase.from('vw_r3_sales_funnel').select('*'),
    supabase.from('vw_r1_income_statement').select('*'),
    supabase.from('vw_r2_overall_report').select('*'),
    supabase.from('payments').select('amount'),
  ])

  const r3 = aggregateR3((funnelResult.data ?? []) as FunnelRow[])
  const r1 = aggregateR1((r1Result.data ?? []) as R1Row[], (paymentsResult.data ?? []) as PaymentRow[])
  const r2 = aggregateR2((r2Result.data ?? []) as R2Row[])

  const errors = [funnelResult.error, r1Result.error, r2Result.error, paymentsResult.error].filter(Boolean)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Gambaran keseluruhan R1 (kewangan), R2 (training) dan R3 (funnel) pada satu skrin.</p>
      </div>

      {errors.length > 0 ? (
        <Card><CardContent className="p-6"><p className="text-sm text-slate-600">Sebahagian data tidak dapat dimuatkan. Semak sambungan Supabase.</p></CardContent></Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="R3 Pipeline Value" value={`RM ${r3.forecast.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`} note={`${r3.count} program aktif`} tone="text-blue-700" />
        <MetricCard label="R3 Weighted" value={`RM ${r3.weighted.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`} note="forecast × probability" tone="text-indigo-700" />
        <MetricCard label="R1 Invoiced" value={`RM ${r1.invoiced.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`} note={`${r1.count} invoice`} tone="text-violet-700" />
        <MetricCard label="R1 Collected" value={`RM ${r1.collected.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`} note={`${r1.collectionRate.toFixed(1)}% collection rate`} tone="text-emerald-700" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="R1 Outstanding" value={`RM ${r1.outstanding.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`} note={`${r1.overdueCount} overdue`} tone="text-red-700" />
        <MetricCard label="R1 Net Profit" value={`RM ${r1.profit.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`} note="berdasarkan cost_of_sales" tone="text-amber-700" />
        <MetricCard label="R2 Sessions" value={String(r2.sessions)} note={`${r2.participants} peserta`} tone="text-cyan-700" />
        <MetricCard label="R2 Participants" value={String(r2.participants)} note={`${r2.b} Bumi · ${r2.nb} Non-Bumi`} tone="text-teal-700" />
      </div>

      <ExecutiveOverview r3={r3} r1={r1} r2={r2} />
    </div>
  )
}

function MetricCard({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return (
    <Card><CardContent className="p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </CardContent></Card>
  )
}
