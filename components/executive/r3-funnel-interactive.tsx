'use client'

import * as React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts'
import { Filter, Layers, Target, TrendingUp, DollarSign, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export type FunnelStageItem = {
  name: string
  count: number
  amount?: number
  weighted?: number
  probability?: number
}

export type R3FunnelInteractiveProps = {
  stages: FunnelStageItem[]
  totalForecast: number
  totalWeighted: number
  totalSecured: number
  totalOpportunities: number
}

const STAGE_THEMES: Record<string, { color: string; bg: string; text: string; badge: string }> = {
  lead: { color: '#64748B', bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' },
  proposal: { color: '#3B82F6', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  negotiation: { color: '#8B5CF6', bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  contract: { color: '#0EA5E9', bg: 'bg-sky-50', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-800' },
  secured: { color: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  invoiced: { color: '#059669', bg: 'bg-teal-50', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800' },
  lost: { color: '#EF4444', bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
  default: { color: '#2563EB', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
}

function getStageTheme(stageName: string) {
  const normalized = stageName.toLowerCase()
  if (normalized.includes('lead') || normalized.includes('early') || normalized.includes('prospect')) return STAGE_THEMES.lead
  if (normalized.includes('proposal') || normalized.includes('tender') || normalized.includes('submitted')) return STAGE_THEMES.proposal
  if (normalized.includes('negotiat') || normalized.includes('progress') || normalized.includes('review')) return STAGE_THEMES.negotiation
  if (normalized.includes('contract') || normalized.includes('po') || normalized.includes('signed')) return STAGE_THEMES.contract
  if (normalized.includes('secured') || normalized.includes('won') || normalized.includes('award')) return STAGE_THEMES.secured
  if (normalized.includes('invoice') || normalized.includes('billed')) return STAGE_THEMES.invoiced
  if (normalized.includes('lost') || normalized.includes('cancel')) return STAGE_THEMES.lost
  return STAGE_THEMES.default
}

export function R3FunnelInteractive({
  stages,
  totalForecast,
  totalWeighted,
  totalSecured,
  totalOpportunities,
}: R3FunnelInteractiveProps) {
  const [selectedStage, setSelectedStage] = React.useState<string | null>(null)
  const [viewMetric, setViewMetric] = React.useState<'count' | 'value'>('count')

  const chartData = stages.map((s) => {
    const theme = getStageTheme(s.name)
    return {
      ...s,
      fill: theme.color,
      displayName: s.name.length > 18 ? s.name.substring(0, 16) + '…' : s.name,
    }
  })

  const winRate = totalForecast > 0 ? (totalSecured / totalForecast) * 100 : 0
  const weightedVelocity = totalForecast > 0 ? (totalWeighted / totalForecast) * 100 : 0

  return (
    <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                <Target className="h-3.5 w-3.5" />
              </span>
              <CardTitle className="text-base font-bold text-slate-900">
                R3 Sales Pipeline &amp; Conversion Funnel
              </CardTitle>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Analisis peringkat peluang jualan, kadar kebarangkalian (probability), dan unjuran nilai tertimbang.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMetric('count')}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  viewMetric === 'count' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bilangan Program
              </button>
              <button
                type="button"
                onClick={() => setViewMetric('value')}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  viewMetric === 'value' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nilai Unjuran (RM)
              </button>
            </div>
          </div>
        </div>

        {/* Micro KPI ribbon */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-3 border-t border-slate-200/60">
          <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
            <p className="text-[11px] font-medium text-slate-500">Total Pipeline Value</p>
            <p className="text-sm font-bold text-slate-900 tabular-nums">
              RM {totalForecast.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
            <p className="text-[11px] font-medium text-slate-500">Weighted Forecast</p>
            <p className="text-sm font-bold text-indigo-700 tabular-nums">
              RM {totalWeighted.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
            <p className="text-[11px] font-medium text-slate-500">Secured (PO/Contract)</p>
            <p className="text-sm font-bold text-emerald-700 tabular-nums">
              RM {totalSecured.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
            <p className="text-[11px] font-medium text-slate-500">Pipeline Velocity</p>
            <p className="text-sm font-bold text-blue-700 tabular-nums">
              {weightedVelocity.toFixed(1)}% <span className="text-[10px] font-normal text-slate-400">weighted index</span>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {chartData.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">Tiada rekod funnel untuk dipaparkan.</div>
        ) : (
          <div className="space-y-6">
            {/* Interactive Bar Chart */}
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="displayName"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    allowDecimals={false}
                    tickFormatter={(val) =>
                      viewMetric === 'value'
                        ? `RM ${(val / 1000).toFixed(0)}k`
                        : `${val}`
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const d = payload[0].payload as (typeof chartData)[0]
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                          <p className="text-xs font-bold text-slate-900">{d.name}</p>
                          <div className="mt-2 space-y-1 text-xs">
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Bilangan Peluang:</span>
                              <span className="font-semibold text-slate-800">{d.count} program</span>
                            </div>
                            {d.amount !== undefined ? (
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Nilai Peringkat:</span>
                                <span className="font-semibold text-blue-600">
                                  RM {Number(d.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey={viewMetric === 'value' ? 'amount' : 'count'}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                    onClick={(entry) => setSelectedStage(entry.name === selectedStage ? null : entry.name)}
                    cursor="pointer"
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.fill}
                        opacity={selectedStage === null || selectedStage === entry.name ? 1 : 0.4}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stage Cards Flow (Bento Pills) */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {stages.map((stage, idx) => {
                const theme = getStageTheme(stage.name)
                const isSelected = selectedStage === stage.name
                return (
                  <button
                    key={stage.name}
                    type="button"
                    onClick={() => setSelectedStage(isSelected ? null : stage.name)}
                    className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200/70 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: theme.color }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">{stage.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {stage.amount
                            ? `RM ${stage.amount.toLocaleString('en-MY', { maximumFractionDigits: 0 })}`
                            : 'Peringkat Funnel'}
                        </p>
                      </div>
                    </div>

                    <div className="ml-2 shrink-0">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${theme.badge}`}>
                        {stage.count}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
