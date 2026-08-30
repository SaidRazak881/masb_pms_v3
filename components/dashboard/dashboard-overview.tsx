'use client'

import * as React from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, ClipboardList, FileText, ListChecks, GraduationCap, AlertTriangle, Receipt, Search, ChevronRight, CheckCircle2 } from 'lucide-react'
import type { Database } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiHeroCard } from '@/components/dashboard/kpi-hero-card'

export type ActionRow = Database['public']['Views']['vw_action_required']['Row']
export type DashboardMetricIcon = 'programs' | 'invoices' | 'actions' | 'sessions'
type Metric = { label: string; value: number | string; icon: DashboardMetricIcon; href: string; tone: 'blue' | 'violet' | 'amber' | 'emerald' | 'slate' | 'rose' | 'indigo' | 'cyan' }
type DashboardOverviewProps = { metrics: Metric[]; actions: ActionRow[]; overdueAmount: number }
export const dashboardMetricIcons = { programs: ClipboardList, invoices: FileText, actions: ListChecks, sessions: GraduationCap } satisfies Record<DashboardMetricIcon, LucideIcon>

function priorityBadge(priority: string | null) {
  switch (priority?.toUpperCase()) {
    case 'HIGH': return 'border-red-200 bg-red-50 text-red-700 font-bold'
    case 'MEDIUM': return 'border-amber-200 bg-amber-50 text-amber-800 font-semibold'
    default: return 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold'
  }
}

export function DashboardOverview({ metrics, actions, overdueAmount }: DashboardOverviewProps) {
  const [searchFilter, setSearchFilter] = React.useState('')
  const highPriority = actions.filter((row) => row.priority?.toUpperCase() === 'HIGH').length
  const filteredActions = actions.filter((item) => {
    if (!searchFilter) return true
    const term = searchFilter.toLowerCase()
    return item.company_name?.toLowerCase().includes(term) || item.program_code?.toLowerCase().includes(term) || item.category?.toLowerCase().includes(term)
  })

  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 min-[1440px]:grid-cols-5">
      {metrics.map((metric) => <KpiHeroCard key={metric.label} title={metric.label} value={metric.value} icon={dashboardMetricIcons[metric.icon]} tone={metric.tone} href={metric.href} badgeText="Sistem Langsung" />)}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-red-200/80 bg-white shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Jumlah Invois Tertunggak</span><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-700"><Receipt className="h-4 w-4" /></span></div><p className="mt-2 text-[32px] font-semibold leading-[1.2] text-red-700 tabular-nums">RM {overdueAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p><p className="mt-1 text-xs text-slate-500">Invois melepasi tempoh matang bayaran perlukan susulan segera oleh PIC.</p></CardContent></Card>
      <Card className="border-amber-200/80 bg-white shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Amaran Berkeutamaan Tinggi</span><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><AlertTriangle className="h-4 w-4" /></span></div><p className="mt-2 text-[32px] font-semibold leading-[1.2] text-amber-700 tabular-nums">{highPriority} Isu Kritikal</p><p className="mt-1 text-xs text-slate-500">Percanggahan padanan, PO hilang, atau kelewatan pembayaran serius.</p></CardContent></Card>
    </div>
    <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm"><CardHeader className="border-b border-slate-100 bg-slate-50 pb-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-base font-bold text-slate-900">Tindakan Operasi Diperlukan</CardTitle><p className="mt-0.5 text-xs text-slate-500">Senarai semak automatik bagi rantaian dokumen Quotation → PO → Invois → Latihan.</p></div><div className="relative w-full sm:w-64"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Tapis senarai tindakan..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none" /></div></div></CardHeader><CardContent className="p-4 sm:p-5">{filteredActions.length === 0 ? <div className="py-10 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" /><p className="mt-2 text-sm font-semibold text-slate-800">Tiada Item Tindakan Diperlukan</p><p className="text-xs text-slate-500">Semua rekod program dan invois berada dalam keadaan teratur.</p></div> : <div className="overflow-x-auto"><div className="min-w-[760px] space-y-2"><div className="grid grid-cols-[110px_150px_minmax(240px,1fr)_120px] gap-3 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500"><span>Priority</span><span>Category</span><span>Title / Client</span><span>Action</span></div>{filteredActions.map((row) => <div key={row.record_id ?? `${row.program_code}-${row.category}`} className="grid grid-cols-[110px_150px_minmax(240px,1fr)_120px] items-center gap-3 rounded-lg border border-slate-200 p-3 text-[13px] hover:bg-slate-50"><Badge className={priorityBadge(row.priority)}>{row.priority ?? 'LOW'}</Badge><Badge className="border-slate-200 bg-slate-100 text-slate-700">{row.category ?? 'ACTION'}</Badge><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{row.company_name ?? 'Syarikat / Klien Tidak Diketahui'}</p><p className="text-xs text-slate-500">{row.program_code ?? 'Tiada Kod Program'} · {row.days_outstanding ?? 0} hari tertunggak</p></div>{row.program_code ? <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs"><Link href={`/dashboard/programs/${encodeURIComponent(row.program_code)}`}>Buka Program<ChevronRight className="h-3.5 w-3.5" /></Link></Button> : <ArrowRight className="h-4 w-4 text-slate-300" />}</div>)}</div></div>}</CardContent></Card>
  </div>
}
