'use client'

import * as React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { GraduationCap, Users, UserCheck, BookOpen, Layers } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export type R2DemographicsProps = {
  sessions: number
  participants: number
  bumiputera: number
  nonBumiputera: number
  workshopCount?: number
  trainingCount?: number
  categories?: { name: string; count: number }[]
}

const DEMO_COLORS = {
  bumiputera: '#10B981', // emerald
  nonBumiputera: '#0EA5E9', // sky
}

export function R2DemographicsInteractive({
  sessions,
  participants,
  bumiputera,
  nonBumiputera,
  workshopCount = 0,
  trainingCount = 0,
  categories = [],
}: R2DemographicsProps) {
  const [viewType, setViewType] = React.useState<'demographics' | 'categories'>('demographics')

  const totalDemo = bumiputera + nonBumiputera
  const bumiRate = totalDemo > 0 ? (bumiputera / totalDemo) * 100 : 0
  const nonBumiRate = totalDemo > 0 ? (nonBumiputera / totalDemo) * 100 : 0
  const avgParticipants = sessions > 0 ? Math.round(participants / sessions) : 0

  const demoPieData = [
    { name: 'Bumiputera', value: bumiputera, color: DEMO_COLORS.bumiputera },
    { name: 'Non-Bumiputera', value: nonBumiputera, color: DEMO_COLORS.nonBumiputera },
  ]

  const categoryChartData = categories.map((c, i) => ({
    name: c.name.length > 15 ? c.name.substring(0, 13) + '…' : c.name,
    fullName: c.name,
    count: c.count,
    fill: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][i % 5],
  }))

  return (
    <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-100 text-teal-700">
                <GraduationCap className="h-3.5 w-3.5" />
              </span>
              <CardTitle className="text-base font-bold text-slate-900">
                R2 Training Delivery &amp; Demographics
              </CardTitle>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Pencapaian penyampaian kursus, bilangan peserta berdaftar, dan pecahan demografi peserta.
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewType('demographics')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                viewType === 'demographics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demografi Etnik
            </button>
            <button
              type="button"
              onClick={() => setViewType('categories')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                viewType === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kategori Program
            </button>
          </div>
        </div>

        {/* Micro KPI Ribbon */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-3 border-t border-slate-200/60">
          <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
            <p className="text-[11px] font-medium text-slate-500">Total Sesi Latihan</p>
            <p className="text-sm font-bold text-slate-900 tabular-nums">{sessions} Sesi</p>
          </div>
          <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
            <p className="text-[11px] font-medium text-slate-500">Jumlah Peserta</p>
            <p className="text-sm font-bold text-teal-700 tabular-nums">
              {participants.toLocaleString('en-MY')} Orang
            </p>
          </div>
          <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
            <p className="text-[11px] font-medium text-slate-500">Purata Peserta / Sesi</p>
            <p className="text-sm font-bold text-blue-700 tabular-nums">{avgParticipants} Peserta</p>
          </div>
          <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
            <p className="text-[11px] font-medium text-slate-500">Nisbah Bumiputera</p>
            <p className="text-sm font-bold text-emerald-700 tabular-nums">{bumiRate.toFixed(1)}%</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Visualizer (2 cols) */}
          <div className="lg:col-span-2">
            {viewType === 'demographics' ? (
              <div className="flex flex-col sm:flex-row items-center justify-around h-[240px]">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demoPieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {demoPieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3 w-full sm:w-1/2">
                  <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        Bumiputera
                      </span>
                      <span className="font-bold text-emerald-700 tabular-nums">
                        {bumiputera.toLocaleString('en-MY')} ({bumiRate.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={bumiRate} max={100} indicatorClassName="bg-emerald-500" className="h-1.5" />
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                        Non-Bumiputera
                      </span>
                      <span className="font-bold text-sky-700 tabular-nums">
                        {nonBumiputera.toLocaleString('en-MY')} ({nonBumiRate.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={nonBumiRate} max={100} indicatorClassName="bg-sky-500" className="h-1.5" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[240px] w-full">
                {categoryChartData.length === 0 ? (
                  <p className="pt-20 text-center text-sm text-slate-400">Tiada kategori direkodkan.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0].payload
                          return (
                            <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md">
                              <p className="text-xs font-bold text-slate-800">{d.fullName}</p>
                              <p className="text-xs text-blue-600 font-semibold mt-1">{d.count} program</p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {categoryChartData.map((entry) => (
                          <Cell key={entry.fullName} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </div>

          {/* Delivery Ratio / Highlights (1 col) */}
          <div className="space-y-3 rounded-xl bg-slate-50 p-4 border border-slate-100 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700">Pecahan Modul Latihan</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Klasifikasi program mengikut jenis penyampaian.</p>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Bengkel / Workshop:</span>
                  <span className="font-bold text-slate-900">{workshopCount} Sesi</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Latihan Berjadual (Training):</span>
                  <span className="font-bold text-slate-900">{trainingCount} Sesi</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-3 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">In-House vs Public Target</span>
                <span className="font-semibold text-emerald-600">92% On Track</span>
              </div>
              <Progress value={92} max={100} indicatorClassName="bg-emerald-600" className="h-1.5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
