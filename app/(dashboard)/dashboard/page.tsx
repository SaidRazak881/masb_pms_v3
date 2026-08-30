import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import type { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'
type ActionRow = Database['public']['Views']['vw_action_required']['Row']

type DashboardData = { programs: number; invoices: number; actions: number; sessions: number; revenue: number; collected: number; outstanding: number; forecast: number; actionRows: ActionRow[]; overdueAmount: number }

async function loadDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) throw new Error('SESSION_REQUIRED')
  const [{ count: programs, error: programsError }, { count: invoices, error: invoicesError }, { count: actions, error: actionsError }, { count: sessions, error: sessionsError }, { data: actionRows, error: actionRowsError }, { data: overdueRows, error: overdueRowsError }, { data: incomeRows, error: incomeError }, { data: paymentRows, error: paymentError }, { data: funnelRows, error: funnelError }] = await Promise.all([
    supabase.from('programs').select('*', { count: 'exact', head: true }).neq('current_stage', 'LOST'),
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
    supabase.from('vw_action_required').select('*', { count: 'exact', head: true }),
    supabase.from('training_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('vw_action_required').select('*').order('days_outstanding', { ascending: false }).limit(10),
    supabase.from('vw_action_required').select('amount').eq('category', 'OVERDUE_INVOICE'),
    supabase.from('vw_r1_income_statement').select('total_value'),
    supabase.from('payments').select('amount'),
    supabase.from('vw_r3_sales_funnel').select('forecast_value'),
  ])
  const queryError = programsError ?? invoicesError ?? actionsError ?? sessionsError ?? actionRowsError ?? overdueRowsError ?? incomeError ?? paymentError ?? funnelError
  if (queryError) throw new Error('DASHBOARD_DATA_UNAVAILABLE')
  const revenue = (incomeRows ?? []).reduce((sum, row) => sum + Number(row.total_value ?? 0), 0)
  const collected = (paymentRows ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const forecast = (funnelRows ?? []).reduce((sum, row) => sum + Number(row.forecast_value ?? 0), 0)
  const outstanding = Math.max(0, revenue - collected)
  const overdueAmount = (overdueRows ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  return { programs: programs ?? 0, invoices: invoices ?? 0, actions: actions ?? 0, sessions: sessions ?? 0, revenue, collected, outstanding, forecast, actionRows: actionRows ?? [], overdueAmount }
}

function DashboardFallback({ message }: { message: string }) { return <div className="p-6"><Card className="mx-auto max-w-2xl border-amber-200"><CardHeader><CardTitle>Dashboard unavailable</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-slate-600">{message}</p><div className="flex flex-wrap gap-2"><Button asChild><Link href="/dashboard">Retry</Link></Button><Button asChild variant="outline"><Link href="/login">Return to login</Link></Button></div></CardContent></Card></div> }

export default async function Dashboard() {
  try {
    const data = await loadDashboardData()
    const money = (value: number) => `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const metrics = [
      { label: 'Total Revenue', value: money(data.revenue), icon: 'invoices' as const, href: '/dashboard/r1', tone: 'blue' as const },
      { label: 'Collected', value: money(data.collected), icon: 'actions' as const, href: '/dashboard/r1', tone: 'emerald' as const },
      { label: 'Outstanding', value: money(data.outstanding), icon: 'invoices' as const, href: '/dashboard/action-center', tone: 'rose' as const },
      { label: 'Forecast R3', value: money(data.forecast), icon: 'programs' as const, href: '/dashboard/programs', tone: 'blue' as const },
      { label: 'Active Program', value: data.programs, icon: 'programs' as const, href: '/dashboard/programs', tone: 'slate' as const },
    ]
    return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Papan Pemuka Operasi</h1><p className="mt-1 text-sm text-slate-500">Ringkasan masa nyata aktiviti program, kewangan dan tindakan penting.</p></div><DashboardOverview metrics={metrics} actions={data.actionRows} overdueAmount={data.overdueAmount} /></div>
  } catch (error) {
    const isSessionError = error instanceof Error && error.message === 'SESSION_REQUIRED'
    return <DashboardFallback message={isSessionError ? 'Your session is no longer available. Please sign in again.' : 'We could not load the dashboard data. Please retry. If the problem continues, check your connection or contact an administrator.'} />
  }
}
