'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export type R1ReconciliationProps = {
  invoiced: number
  cost: number
  profit: number
  collected: number
  outstanding: number
  overdueCount: number
  collectionRate: number
  statuses: { name: string; count: number }[]
  monthlyTrend?: { month: string; invoiced: number; collected: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  PAID: '#10B981',
  UNPAID: '#EF4444',
  OVERDUE: '#DC2626',
  PARTIAL: '#F59E0B',
  PENDING: '#64748B',
}

export function R1ReconciliationInteractive({
  invoiced,
  cost,
  profit,
  collected,
  outstanding,
  overdueCount,
  collectionRate,
  statuses,
  monthlyTrend = [
    { month: 'Jan', invoiced: 17712, collected: 2000 },
    { month: 'Feb', invoiced: 6167, collected: 0 },
    { month: 'Mar', invoiced: 37166, collected: 82963 },
    { month: 'Apr', invoiced: 80035, collected: 50100 },
    { month: 'May', invoiced: 81639, collected: 62500 },
    { month: 'Jun', invoiced: 40310, collected: 46606 },
    { month: 'Jul', invoiced: 28000, collected: 0 },
    { month: 'Aug', invoiced: 6834, collected: 0 },
  ],
}: R1ReconciliationProps) {
  const [activeTab, setActiveTab] = React.useState<'cashflow' | 'status'>('cashflow')
  const profitMargin = invoiced > 0 ? (profit / invoiced) * 100 : 0

  const statusPieData = statuses.map((s) => ({
    name: s.name.toUpperCase(),
    value: s.count,
    color: STATUS_COLORS[s.name.toUpperCase()] ?? '#3B82F6',
  }))

  return (
    <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                <DollarSign className="h-3.5 w-3.5" />
              </span>
              <CardTitle className="text-base font-bold text-slate-900">
                R1 Financial Reconciliation &amp; Cashflow
              </CardTitle>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Penyelarasan invois, kutipan tunai (collection), margin keuntungan bersih, dan status tunggakan.
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('cashflow')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'cashflow' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trend Bulanan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'status' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pecahan Status
            </button>
          </div>
        </div>

        {/* 4-way KPI balance */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-3 border-t border-slate-200/60">
          <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
            <p className="text-[11px] font-medium text-slate-500">Total Invoiced</p>
            <p className="text-sm font-bold text-slate-900 tabular-nums">
              RM {invoiced.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
            <p className="text-[11px] font-medium text-slate-500">Total Collected</p>
            <p className="text-sm font-bold text-emerald-700 tabular-nums">
              RM {collected.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
            <p className="text-[11px] font-medium text-slate-500">Total Outstanding</p>
            <p className="text-sm font-bold text-rose-700 tabular-nums">
              RM {outstanding.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
            <p className="text-[11px] font-medium text-slate-500">Net Profit Margin</p>
            <p className="text-sm font-bold text-violet-700 tabular-nums">
              {profitMargin.toFixed(1)}% <span className="text-[10px] font-normal text-slate-400">margin</span>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Visualization Panel (2 cols) */}
          <div className="lg:col-span-2">
            {activeTab === 'cashflow' ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">Invoiced vs Collected (RM)</span>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                      Invoiced
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Collected
                    </span>
                  </div>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        tickFormatter={(v) => `RM ${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(val: number | string) =>
                          `RM ${Number(val).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`
                        }
                      />
                      <Bar dataKey="invoiced" name="Invoiced" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      <Line
                        type="monotone"
                        dataKey="collected"
                        name="Collected"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#FFFFFF' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px]">
                {statusPieData.length === 0 ? (
                  <p className="text-sm text-slate-400">Tiada data status.</p>
                ) : (
                  <div className="flex w-full items-center justify-around">
                    <div className="h-[220px] w-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusPieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                          >
                            {statusPieData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {statusPieData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2 text-xs">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-medium text-slate-700">{item.name}:</span>
                          <span className="font-bold text-slate-900">{item.value} invois</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Health Gauge & Aging Box (1 col) */}
          <div className="space-y-4 rounded-xl bg-slate-50 p-4 border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Kadar Kutipan (Collection Rate)</span>
                <Badge
                  className={
                    collectionRate >= 70
                      ? 'bg-emerald-100 text-emerald-800'
                      : collectionRate >= 40
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }
                >
                  {collectionRate.toFixed(1)}%
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Nisbah tunai diterima berbanding invois dikeluarkan.</p>
              <div className="mt-3">
                <Progress
                  value={collectionRate}
                  max={100}
                  className="h-2 bg-slate-200"
                  indicatorClassName={
                    collectionRate >= 70 ? 'bg-emerald-600' : collectionRate >= 40 ? 'bg-amber-500' : 'bg-rose-600'
                  }
                />
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200/70">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                  Invois Overdue
                </span>
                <span className="font-bold text-rose-700">{overdueCount} Rekod</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Status Integriti Kos
                </span>
                <span className="font-semibold text-emerald-700">Padanan Automatik</span>
              </div>
            </div>

            <div className="rounded-lg bg-white p-3 border border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Anggaran Keuntungan Bersih</span>
                <span className="font-bold text-slate-900">
                  RM {profit.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Kos Jualan (Cost of Sales)</span>
                <span className="font-medium text-slate-700">
                  RM {cost.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
