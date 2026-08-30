'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Gauge, GitBranch, GraduationCap, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

const money = (v: number) => `RM ${v.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function ExecutiveImpactWidgets({ forecast, secured, invoiced, collected, outstanding, overdueCount, bumi, nonBumi }: { forecast: number; secured: number; invoiced: number; collected: number; outstanding: number; overdueCount: number; bumi: number; nonBumi: number }) {
  const speed = Math.max(0, Math.min(100, invoiced > 0 ? (collected / invoiced) * 100 : 0))
  const talent = bumi + nonBumi > 0 ? (bumi / (bumi + nonBumi)) * 100 : 0
  const leakage = outstanding
  const waterfall = [
    { label: 'Forecast', value: forecast },
    { label: 'Secured PO', value: secured },
    { label: 'Invoiced', value: invoiced },
    { label: 'Net Cash', value: collected },
  ]

  return <section className="grid grid-cols-1 gap-4 xl:grid-cols-5" aria-label="Executive impact metrics">
    <Card className="xl:col-span-1"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Gauge className="h-4 w-4 text-blue-600" />Cash Conversion Speedometer</CardTitle></CardHeader><CardContent><div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-slate-200 border-t-blue-600 border-r-blue-600"><div className="text-center"><p className="text-2xl font-semibold tabular-nums text-slate-900">{speed.toFixed(0)}%</p><p className="text-[10px] font-semibold text-slate-500">Invois → Tunai</p></div></div></CardContent></Card>

    <Card className="xl:col-span-2"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><GitBranch className="h-4 w-4 text-blue-600" />Executive Waterfall Revenue Stream</CardTitle></CardHeader><CardContent><div className="space-y-3">{waterfall.map((item, i) => { const width = forecast > 0 ? Math.max(6, (item.value / forecast) * 100) : 0; return <div key={item.label}><div className="mb-1 flex justify-between text-[11px] font-semibold"><span className="text-slate-600">{item.label}</span><span className="tabular-nums text-slate-900">{money(item.value)}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${width}%` }} /></div></div> })}</div></CardContent></Card>

    <Card className="xl:col-span-1"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-red-600" />Revenue Leakage Radar</CardTitle></CardHeader><CardContent><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">RM berisiko</p><p className="mt-1 text-[28px] font-semibold leading-tight tabular-nums text-red-700">{money(leakage)}</p><p className="mt-1 text-[11px] text-slate-500">{overdueCount} rekod tunggakan dikenal pasti. Semak Pusat Tindakan untuk pecahan lanjut.</p></CardContent></Card>

    <Card className="xl:col-span-1"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><GraduationCap className="h-4 w-4 text-blue-600" />R2 National Talent Impact</CardTitle></CardHeader><CardContent><div className="flex items-end justify-between"><div><p className="text-[28px] font-semibold leading-tight tabular-nums text-slate-900">{talent.toFixed(0)}%</p><p className="text-[11px] text-slate-500">Bumiputera</p></div><div className="text-right text-[11px] font-semibold text-slate-500 tabular-nums">{bumi.toLocaleString('en-MY')} / {(bumi + nonBumi).toLocaleString('en-MY')}</div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-2 bg-blue-600" style={{ width: `${talent}%` }} /></div><div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>Bumiputera</span><span>Bukan Bumiputera</span></div></CardContent></Card>

    <div className="xl:col-span-5 flex justify-end"><Button asChild className="gap-2 bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"><a href="/api/reports/export?format=pdf" target="_blank" rel="noreferrer"><FileDown className="h-3.5 w-3.5" />Board Executive Report</a></Button></div>
  </section>
}
