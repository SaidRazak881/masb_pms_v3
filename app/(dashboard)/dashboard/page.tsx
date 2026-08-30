import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardOverview, dashboardMetricIcons } from '@/components/dashboard/dashboard-overview'
import type { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

type ActionRow = Database['public']['Views']['vw_action_required']['Row']

type DashboardData = {
  programs: number
  invoices: number
  actions: number
  sessions: number
  actionRows: ActionRow[]
  overdueAmount: number
}

async function loadDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    throw new Error('SESSION_REQUIRED')
  }

  const [
    { count: programs, error: programsError },
    { count: invoices, error: invoicesError },
    { count: actions, error: actionsError },
    { count: sessions, error: sessionsError },
    { data: actionRows, error: actionRowsError },
    { data: overdueRows, error: overdueRowsError },
  ] = await Promise.all([
    supabase.from('programs').select('*', { count: 'exact', head: true }),
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
    supabase.from('vw_action_required').select('*', { count: 'exact', head: true }),
    supabase.from('training_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('vw_action_required').select('*').order('days_outstanding', { ascending: false }).limit(10),
    supabase.from('vw_action_required').select('amount').eq('category', 'OVERDUE_INVOICE'),
  ])

  const queryError = programsError ?? invoicesError ?? actionsError ?? sessionsError ?? actionRowsError ?? overdueRowsError
  if (queryError) {
    throw new Error('DASHBOARD_DATA_UNAVAILABLE')
  }

  const overdueAmount = (overdueRows ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)

  return {
    programs: programs ?? 0,
    invoices: invoices ?? 0,
    actions: actions ?? 0,
    sessions: sessions ?? 0,
    actionRows: actionRows ?? [],
    overdueAmount,
  }
}

function DashboardFallback({ message }: { message: string }) {
  return (
    <div className="p-6">
      <Card className="mx-auto max-w-2xl border-amber-200">
        <CardHeader>
          <CardTitle>Dashboard unavailable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">{message}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link href="/dashboard">Retry</Link></Button>
            <Button asChild variant="outline"><Link href="/login">Return to login</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function Dashboard() {
  try {
    const data = await loadDashboardData()
    const metrics = [
      { label: 'Programs', value: data.programs, icon: dashboardMetricIcons.programs, href: '/dashboard/programs', tone: 'blue' as const },
      { label: 'Invoices', value: data.invoices, icon: dashboardMetricIcons.invoices, href: '/dashboard/r1', tone: 'violet' as const },
      { label: 'Action Items', value: data.actions, icon: dashboardMetricIcons.actions, href: '/dashboard/action-center', tone: 'amber' as const },
      { label: 'Training Sessions', value: data.sessions, icon: dashboardMetricIcons.sessions, href: '/dashboard/r2', tone: 'emerald' as const },
    ]

    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Papan Pemuka Operasi (Dashboard)</h1>
          <p className="mt-1 text-xs text-slate-500">Ringkasan masa nyata aktiviti program, invois dan tindakan penting.</p>
        </div>
        <DashboardOverview metrics={metrics} actions={data.actionRows} overdueAmount={data.overdueAmount} />
      </div>
    )
  } catch (error) {
    const isSessionError = error instanceof Error && error.message === 'SESSION_REQUIRED'
    return (
      <DashboardFallback
        message={isSessionError ? 'Your session is no longer available. Please sign in again.' : 'We could not load the dashboard data. Please retry. If the problem continues, check your connection or contact an administrator.'}
      />
    )
  }
}
