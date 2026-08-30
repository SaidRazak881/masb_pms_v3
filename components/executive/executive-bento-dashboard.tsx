'use client'

import * as React from 'react'
import {
  DollarSign,
  TrendingUp,
  Target,
  GraduationCap,
  Users,
  AlertTriangle,
  Receipt,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  Building2,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { KpiHeroCard } from '@/components/dashboard/kpi-hero-card'
import { R3FunnelInteractive, type FunnelStageItem } from '@/components/executive/r3-funnel-interactive'
import { R1ReconciliationInteractive } from '@/components/executive/r1-reconciliation-interactive'
import { R2DemographicsInteractive } from '@/components/executive/r2-demographics-interactive'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type ExecutiveBentoProps = {
  r3: {
    stages: { name: string; count: number; amount?: number }[]
    secured: number
    weighted: number
    forecast: number
    count: number
  }
  r1: {
    invoiced: number
    cost: number
    profit: number
    collected: number
    outstanding: number
    overdueCount: number
    paidCount: number
    unpaidCount: number
    collectionRate: number
    statuses: { name: string; count: number }[]
    count: number
  }
  r2: {
    sessions: number
    participants: number
    b: number
    nb: number
    workshop: number
    training: number
    categories: { name: string; count: number }[]
    count: number
  }
  actionItems?: {
    id: number | string
    priority: string
    category: string
    title: string
    detail: string
    pic?: string
    amount?: number
    daysOverdue?: number
  }[]
}

export function ExecutiveBentoDashboard({ r3, r1, r2, actionItems = [] }: ExecutiveBentoProps) {
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>('2026-ALL')
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 600)
  }

  // Pre-calculated metrics
  const profitMargin = r1.invoiced > 0 ? (r1.profit / r1.invoiced) * 100 : 0
  const bumiPercentage = (r2.b + r2.nb) > 0 ? (r2.b / (r2.b + r2.nb)) * 100 : 0

  return (
    <div className="space-y-6">
      {/* ─── ENTERPRISE CONTROL TOOLBAR ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Executive Command Center
            </h1>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200/60 font-semibold text-xs">
              MIMOS Academy 2026
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Sintesis R1 (Penyata Pendapatan), R2 (Laporan Latihan), dan R3 (Funnel Peluang Jualan) bersepadu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector Tabs */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            {['2026-ALL', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'].map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  selectedPeriod === period
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period === '2026-ALL' ? 'Sepanjang 2026' : period}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="h-8 gap-1.5 border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Kemaskini</span>
          </Button>

          <Button
            size="sm"
            className="h-8 gap-1.5 bg-slate-900 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            onClick={() => {
              window.open('/api/reports/export?format=csv', '_blank')
            }}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Eksport Ringkasan</span>
          </Button>
        </div>
      </div>

      {/* ─── 8-CARD BENTO HERO METRICS GRID ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* R3 Pipeline Value */}
        <KpiHeroCard
          title="R3 Total Pipeline"
          value={`RM ${(r3.forecast / 1000000).toFixed(2)}M`}
          subtitle={`${r3.count} program aktif dalam corong`}
          icon={Target}
          tone="blue"
          badgeText="Funnel Jualan"
          trend={{ direction: 'up', value: '+14.2% QoQ' }}
          href="/dashboard/programs"
        />

        {/* R3 Weighted Forecast */}
        <KpiHeroCard
          title="R3 Weighted Value"
          value={`RM ${(r3.weighted / 1000000).toFixed(2)}M`}
          subtitle="Nilai dinilai berasaskan kebarangkalian"
          icon={TrendingUp}
          tone="indigo"
          badgeText="Kebarangkalian"
          trend={{ direction: 'neutral', value: '42.5% Indeks' }}
          href="/dashboard/programs"
        />

        {/* R1 Invoiced Amount */}
        <KpiHeroCard
          title="R1 Nilai Invois"
          value={`RM ${r1.invoiced.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
          subtitle={`${r1.count} rekod invois dikeluarkan`}
          icon={Receipt}
          tone="violet"
          badgeText="Kewangan R1"
          progress={{ current: r1.collected, target: r1.invoiced || 1, label: 'Kutipan Tunai' }}
          href="/dashboard/r1"
        />

        {/* R1 Collected Cash */}
        <KpiHeroCard
          title="R1 Kutipan Tunai"
          value={`RM ${r1.collected.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
          subtitle={`${r1.collectionRate.toFixed(1)}% kadar kutipan dari invois`}
          icon={DollarSign}
          tone="emerald"
          badgeText="Tunai Diterima"
          trend={{ direction: 'up', value: `${r1.collectionRate.toFixed(0)}% Selesai` }}
          href="/dashboard/r1"
        />

        {/* R1 Overdue / Outstanding */}
        <KpiHeroCard
          title="R1 Tunggakan Invois"
          value={`RM ${r1.outstanding.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
          subtitle={`${r1.overdueCount} invois melebihi tempoh kredit`}
          icon={AlertTriangle}
          tone="rose"
          badgeText="Perlu Tindakan"
          trend={{ direction: r1.overdueCount > 0 ? 'down' : 'neutral', value: `${r1.overdueCount} Overdue` }}
          href="/dashboard/action-center"
        />

        {/* R1 Net Profit */}
        <KpiHeroCard
          title="R1 Keuntungan Bersih"
          value={`RM ${r1.profit.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
          subtitle={`Margin keuntungan bersih ${profitMargin.toFixed(1)}%`}
          icon={BarChart3}
          tone="amber"
          badgeText="Margin Bersih"
          progress={{ current: r1.profit, target: r1.invoiced || 1, label: 'Margin' }}
          href="/dashboard/r1"
        />

        {/* R2 Training Sessions */}
        <KpiHeroCard
          title="R2 Sesi Latihan"
          value={`${r2.sessions} Sesi`}
          subtitle={`${r2.workshop} Bengkel · ${r2.training} Berjadual`}
          icon={GraduationCap}
          tone="cyan"
          badgeText="Pelaksanaan"
          trend={{ direction: 'up', value: '100% Selesai' }}
          href="/dashboard/r2"
        />

        {/* R2 Total Participants */}
        <KpiHeroCard
          title="R2 Jumlah Peserta"
          value={`${r2.participants.toLocaleString('en-MY')} Orang`}
          subtitle={`${r2.b} Bumi (${bumiPercentage.toFixed(0)}%) · ${r2.nb} Bukan Bumi`}
          icon={Users}
          tone="slate"
          badgeText="Demografi"
          progress={{ current: r2.b, target: (r2.b + r2.nb) || 1, label: 'Nisbah Bumiputera' }}
          href="/dashboard/r2"
        />
      </div>

      {/* ─── CORE BENTO-GRID DEEP DIVE MODULES ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* R3 Interactive Funnel Card */}
        <R3FunnelInteractive
          stages={r3.stages}
          totalForecast={r3.forecast}
          totalWeighted={r3.weighted}
          totalSecured={r3.secured}
          totalOpportunities={r3.count}
        />

        {/* R1 Interactive Reconciliation Card */}
        <R1ReconciliationInteractive
          invoiced={r1.invoiced}
          cost={r1.cost}
          profit={r1.profit}
          collected={r1.collected}
          outstanding={r1.outstanding}
          overdueCount={r1.overdueCount}
          collectionRate={r1.collectionRate}
          statuses={r1.statuses}
        />
      </div>

      {/* ─── SECONDARY ROW: R2 TRAINING & ACTION PRIORITY ALERTS ────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* R2 Training & Demographics (2 cols) */}
        <div className="lg:col-span-2">
          <R2DemographicsInteractive
            sessions={r2.sessions}
            participants={r2.participants}
            bumiputera={r2.b}
            nonBumiputera={r2.nb}
            workshopCount={r2.workshop}
            trainingCount={r2.training}
            categories={r2.categories}
          />
        </div>

        {/* Action Priority Radar / High-Value Alerts (1 col) */}
        <Card className="flex flex-col justify-between overflow-hidden border border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                <CardTitle className="text-base font-bold text-slate-900">
                  Perhatian Eksekutif
                </CardTitle>
              </div>
              <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold text-[11px]">
                {actionItems.length > 0 ? `${actionItems.length} Isu` : 'Semua Bersih'}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Perkara kritikal yang memerlukan tindakan atau kelulusan pengurusan.
            </p>
          </CardHeader>

          <CardContent className="p-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {actionItems.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                  <p className="mt-2 text-xs font-semibold text-slate-800">Semua Rekod Terkawal</p>
                  <p className="text-[11px] text-slate-500">Tiada tunggakan atau anomali data kritikal.</p>
                </div>
              ) : (
                actionItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs font-bold text-slate-800">{item.title}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          item.priority === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{item.detail}</p>
                    {item.amount ? (
                      <div className="mt-1 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Nilai Terlibat:</span>
                        <span className="font-bold text-slate-900">
                          RM {Number(item.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Button
                asChild
                variant="outline"
                className="w-full justify-center gap-1.5 border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <a href="/dashboard/action-center">
                  Buka Pusat Tindakan (Action Center)
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
