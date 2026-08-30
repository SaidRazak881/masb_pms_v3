'use client'

import * as React from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  ClipboardList,
  FileText,
  ListChecks,
  GraduationCap,
  AlertTriangle,
  Receipt,
  Search,
  ChevronRight,
  CheckCircle2,
  Clock,
  Building2,
  ShieldAlert,
} from 'lucide-react'
import type { Database } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiHeroCard } from '@/components/dashboard/kpi-hero-card'

export type ActionRow = Database['public']['Views']['vw_action_required']['Row']

type Metric = {
  label: string
  value: number
  icon: LucideIcon
  href: string
  tone: 'blue' | 'violet' | 'amber' | 'emerald' | 'slate' | 'rose' | 'indigo' | 'cyan'
}

type DashboardOverviewProps = {
  metrics: Metric[]
  actions: ActionRow[]
  overdueAmount: number
}

export const dashboardMetricIcons = {
  programs: ClipboardList,
  invoices: FileText,
  actions: ListChecks,
  sessions: GraduationCap,
} satisfies Record<string, LucideIcon>

function priorityBadge(priority: string | null) {
  switch (priority?.toUpperCase()) {
    case 'HIGH':
      return 'border-rose-200 bg-rose-50 text-rose-700 font-bold'
    case 'MEDIUM':
      return 'border-amber-200 bg-amber-50 text-amber-800 font-semibold'
    default:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold'
  }
}

export function DashboardOverview({ metrics, actions, overdueAmount }: DashboardOverviewProps) {
  const [searchFilter, setSearchFilter] = React.useState('')
  const highPriority = actions.filter((row) => row.priority?.toUpperCase() === 'HIGH').length

  const filteredActions = actions.filter((item) => {
    if (!searchFilter) return true
    const term = searchFilter.toLowerCase()
    return (
      item.company_name?.toLowerCase().includes(term) ||
      item.program_code?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      {/* ─── 4 Hero KPI Cards ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <KpiHeroCard
            key={metric.label}
            title={metric.label}
            value={metric.value}
            icon={metric.icon}
            tone={metric.tone}
            href={metric.href}
            badgeText="Sistem Langsung"
          />
        ))}
      </div>

      {/* ─── Financial & Operational Risk Highlights ────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-rose-200/80 bg-gradient-to-br from-white to-rose-50/30 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Jumlah Invois Tertunggak (Overdue)
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <Receipt className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-700 tabular-nums">
              RM {overdueAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Invois melepasi tempoh matang bayaran perlukan susulan segera oleh PIC.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 bg-gradient-to-br from-white to-amber-50/30 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Amaran Berkeutamaan Tinggi (High Priority)
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-700 tabular-nums">
              {highPriority} Isu Kritikal
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Percanggahan padanan, PO hilang, atau kelewatan pembayaran serius.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Action Items Table Card ────────────────────────────────────────── */}
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Tindakan Operasi Diperlukan (Recent Action Items)
              </CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Senarai semak automatik bagi rantaian dokumen Quotation → PO → Invois → Latihan.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tapis senarai tindakan..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {filteredActions.length === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
              <p className="mt-2 text-sm font-semibold text-slate-800">Tiada Item Tindakan Diperlukan</p>
              <p className="text-xs text-slate-500">Semua rekod program dan invois berada dalam keadaan teratur.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActions.map((row) => (
                <div
                  key={row.record_id ?? `${row.program_code}-${row.category}`}
                  className="group flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white p-4 transition-all hover:border-slate-300 hover:bg-slate-50/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={priorityBadge(row.priority)}>
                        {row.priority ?? 'LOW'}
                      </Badge>
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                        {row.category ?? 'ACTION'}
                      </Badge>
                      {row.amount ? (
                        <span className="text-xs font-bold text-slate-900 tabular-nums">
                          RM {Number(row.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 truncate text-sm font-bold text-slate-900">
                      {row.company_name ?? 'Syarikat / Klien Tidak Diketahui'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.program_code ?? 'Tiada Kod Program'} ·{' '}
                      <span className={Number(row.days_outstanding ?? 0) > 60 ? 'text-rose-600 font-semibold' : ''}>
                        {row.days_outstanding ?? 0} hari tertunggak
                      </span>
                    </p>
                  </div>

                  {row.program_code ? (
                    <Button asChild size="sm" variant="outline" className="h-8 gap-1 border-slate-200 text-xs font-semibold">
                      <Link href={`/dashboard/programs/${encodeURIComponent(row.program_code)}`}>
                        <span>Buka Program</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
