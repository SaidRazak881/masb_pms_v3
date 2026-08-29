'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, ClipboardList, FileText, ListChecks, GraduationCap } from 'lucide-react'
import type { Database } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export type ActionRow = Database['public']['Views']['vw_action_required']['Row']

type Metric = {
  label: string
  value: number
  icon: LucideIcon
  href: string
  tone: string
}

type DashboardOverviewProps = {
  metrics: Metric[]
  actions: ActionRow[]
}

export const dashboardMetricIcons = {
  programs: ClipboardList,
  invoices: FileText,
  actions: ListChecks,
  sessions: GraduationCap,
} satisfies Record<string, LucideIcon>

function priorityClass(priority: string | null) {
  switch (priority?.toUpperCase()) {
    case 'HIGH': return 'border-red-200 bg-red-50 text-red-700'
    case 'MEDIUM': return 'border-amber-200 bg-amber-50 text-amber-700'
    default: return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
}

export function DashboardOverview({ metrics, actions }: DashboardOverviewProps) {
  const overdueAmount = actions.reduce((sum, row) => sum + (row.category?.toUpperCase() === 'OVERDUE' ? Number(row.amount ?? 0) : 0), 0)
  const highPriority = actions.filter((row) => row.priority?.toUpperCase() === 'HIGH').length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return <Link href={metric.href} key={metric.label} className="block"><Card className="transition-shadow hover:shadow-md"><CardContent className="p-5"><div className="flex items-center justify-between"><div className={`rounded-lg p-2.5 ${metric.tone}`}><Icon className="h-5 w-5" /></div><ArrowRight className="h-4 w-4 text-slate-400" /></div><p className="mt-4 text-sm text-slate-500">{metric.label}</p><p className="mt-1 text-3xl font-bold tracking-tight">{metric.value.toLocaleString('en-MY')}</p></CardContent></Card></Link>
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Total Overdue Amount</p><p className="mt-2 text-2xl font-bold text-red-700">RM {overdueAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">High-Priority Alerts</p><p className="mt-2 text-2xl font-bold text-amber-700">{highPriority}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Action Items</CardTitle></CardHeader>
        <CardContent>
          {actions.length === 0 ? <p className="text-sm text-slate-500">No action items require attention.</p> : <div className="space-y-3"><div className="mb-4"><Input placeholder="Search is available in Action Center" readOnly /></div>{actions.map((row) => <div key={row.record_id ?? `${row.program_code}-${row.category}`} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge className={priorityClass(row.priority)}>{row.priority ?? 'LOW'}</Badge><Badge>{row.category ?? 'ACTION'}</Badge></div><p className="mt-2 truncate font-medium">{row.company_name ?? 'Unknown company'}</p><p className="text-sm text-slate-500">{row.program_code ?? 'No program ID'} · {row.days_outstanding ?? 0} days outstanding</p></div>{row.program_code ? <Button asChild size="sm" variant="outline"><Link href={`/dashboard/programs/${encodeURIComponent(row.program_code)}`}>View Program</Link></Button> : null}</div>)}</div>}
        </CardContent>
      </Card>
    </div>
  )
}
