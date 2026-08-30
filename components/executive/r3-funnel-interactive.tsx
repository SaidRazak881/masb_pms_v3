'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type R3FunnelData = { stages: { name: string; count: number; value?: number }[]; forecast: number; weighted: number; secured: number; count: number }

export function R3FunnelInteractive({ data }: { data: R3FunnelData }) {
  return <Tabs defaultValue="count" className="space-y-4"><Card><CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-base">R3 Pipeline & Funnel</CardTitle><TabsList><TabsTrigger value="count">Kiraan</TabsTrigger><TabsTrigger value="value">Nilai RM</TabsTrigger></TabsList></CardHeader><CardContent><TabsChart data={data} /></CardContent></Card></Tabs>
}

function TabsChart({ data }: { data: R3FunnelData }) {
  return <>{/* The tab content is kept in one client boundary so switching remains instant. */}<ChartView data={data} /></>
}

function ChartView({ data }: { data: R3FunnelData }) {
  const rows = data.stages.map((s) => ({ name: s.name, count: s.count, value: s.value ?? 0 }))
  return <div className="space-y-5"><div className="grid grid-cols-3 gap-3"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Forecast</p><p className="mt-1 font-semibold tabular-nums">RM {data.forecast.toLocaleString('en-MY')}</p></div><div className="rounded-lg bg-indigo-50 p-3"><p className="text-xs text-slate-500">Weighted</p><p className="mt-1 font-semibold tabular-nums">RM {data.weighted.toLocaleString('en-MY')}</p></div><div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-slate-500">Secured</p><p className="mt-1 font-semibold tabular-nums">RM {data.secured.toLocaleString('en-MY')}</p></div></div><ResponsiveContainer width="100%" height={280}><BarChart data={rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip formatter={(value, name) => name === 'value' ? `RM ${Number(value).toLocaleString('en-MY')}` : value} /><Bar dataKey="count" fill="#2563eb" radius={[5, 5, 0, 0]} /><Bar dataKey="value" fill="#6366f1" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>
}
