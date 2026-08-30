import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { ExecutiveBentoDashboard } from '@/components/executive/executive-bento-dashboard'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

type FunnelRow = Database['public']['Views']['vw_r3_sales_funnel']['Row']
type R1Row = Database['public']['Views']['vw_r1_income_statement']['Row']
type R2Row = Database['public']['Views']['vw_r2_overall_report']['Row']
type PaymentRow = { amount: number | null }
type ActionRow = Database['public']['Views']['vw_action_required']['Row']

function money(value: number | null | undefined): number {
  return Number(value ?? 0)
}

function aggregateR3(rows: FunnelRow[]) {
  const stageMap = new Map<string, { count: number; amount: number }>()
  let forecast = 0
  let weighted = 0
  let secured = 0
  for (const row of rows) {
    const stage = (row.current_stage ?? 'UNKNOWN').replaceAll('_', ' ')
    const prev = stageMap.get(stage) ?? { count: 0, amount: 0 }
    stageMap.set(stage, {
      count: prev.count + 1,
      amount: prev.amount + money(row.forecast_value),
    })
    forecast += money(row.forecast_value)
    weighted += money(row.weighted_value)
    secured += money(row.secured_value)
  }
  const stages = Array.from(stageMap.entries()).map(([name, val]) => ({
    name,
    count: val.count,
    amount: val.amount,
  }))
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
    const category = (row.category ?? 'UNKNOWN').replaceAll('_', ' ')
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1)
  }
  const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
  return { sessions: sessions.size, participants, b, nb, workshop, training, categories, count: rows.length }
}

export default async function ExecutivePage() {
  await requireRole(['super_admin', 'admin', 'manager'])

  const supabase = await createClient()
  const [funnelResult, r1Result, r2Result, paymentsResult, actionsResult] = await Promise.all([
    supabase.from('vw_r3_sales_funnel').select('*'),
    supabase.from('vw_r1_income_statement').select('*'),
    supabase.from('vw_r2_overall_report').select('*'),
    supabase.from('payments').select('amount'),
    supabase.from('vw_action_required').select('*').limit(5),
  ])

  const r3 = aggregateR3((funnelResult.data ?? []) as FunnelRow[])
  const r1 = aggregateR1((r1Result.data ?? []) as R1Row[], (paymentsResult.data ?? []) as PaymentRow[])
  const r2 = aggregateR2((r2Result.data ?? []) as R2Row[])

  const actionItems = ((actionsResult.data ?? []) as ActionRow[]).map((row, idx) => ({
    id: row.record_id ?? idx,
    priority: row.priority ?? 'HIGH',
    category: row.category ?? 'ACTION',
    title: row.company_name ?? row.program_code ?? 'Rekod Perlu Tindakan',
    detail: `${row.category ?? 'Perlu Tindakan'} · ${row.days_outstanding ?? 0} hari tunggakan`,
    pic: 'PIC',
    amount: Number(row.amount ?? 0),
    daysOverdue: Number(row.days_outstanding ?? 0),
  }))

  const errors = [funnelResult.error, r1Result.error, r2Result.error, paymentsResult.error].filter(Boolean)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {errors.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-amber-800">
              Sebahagian data realtime tidak dapat dimuatkan secara penuh. Sila semak sambungan pangkalan data Supabase.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <ExecutiveBentoDashboard r3={r3} r1={r1} r2={r2} actionItems={actionItems} />
    </div>
  )
}
