import { createClient } from '@/lib/supabase/server'
import { DashboardOverview, dashboardMetricIcons } from '@/components/dashboard/dashboard-overview'
import type { Database } from '@/types/database'

type ActionRow = Database['public']['Views']['vw_action_required']['Row']

export default async function Dashboard() {
  const s = await createClient()
  const [programsResult, invoicesResult, actionsResult, sessionsResult, actionRowsResult, overdueRowsResult] = await Promise.all([
    s.from('programs').select('*', { count: 'exact', head: true }),
    s.from('invoices').select('*', { count: 'exact', head: true }),
    s.from('vw_action_required').select('*', { count: 'exact', head: true }),
    s.from('training_sessions').select('*', { count: 'exact', head: true }),
    s.from('vw_action_required').select('*').order('days_outstanding', { ascending: false }).limit(10),
    s.from('vw_action_required').select('amount').eq('category', 'OVERDUE_INVOICE'),
  ])

  const queryError = programsResult.error ?? invoicesResult.error ?? actionsResult.error ?? sessionsResult.error ?? actionRowsResult.error ?? overdueRowsResult.error
  if (queryError) throw new Error(queryError.message)

  const actionRows: ActionRow[] = actionRowsResult.data ?? []
  const overdueAmount = (overdueRowsResult.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)

  const metrics = [
    { label: 'Programs', value: programsResult.count ?? 0, icon: dashboardMetricIcons.programs, href: '/dashboard/programs', tone: 'bg-blue-50 text-blue-700' },
    { label: 'Invoices', value: invoicesResult.count ?? 0, icon: dashboardMetricIcons.invoices, href: '/dashboard/financials/invoices', tone: 'bg-violet-50 text-violet-700' },
    { label: 'Action Items', value: actionsResult.count ?? 0, icon: dashboardMetricIcons.actions, href: '/dashboard/action-center', tone: 'bg-amber-50 text-amber-700' },
    { label: 'Training Sessions', value: sessionsResult.count ?? 0, icon: dashboardMetricIcons.sessions, href: '/dashboard/training', tone: 'bg-emerald-50 text-emerald-700' },
  ]

  return <div className="p-6"><div className="mb-6"><h1 className="text-2xl font-bold tracking-tight">Dashboard</h1><p className="mt-1 text-sm text-slate-500">Operational overview daripada Supabase.</p></div><DashboardOverview metrics={metrics} actions={actionRows} overdueAmount={overdueAmount} /></div>
}
