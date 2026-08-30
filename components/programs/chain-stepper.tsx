'use client'

import * as React from 'react'
import { Filter, FileText, FileCheck2, Receipt, Banknote, GraduationCap, Check, AlertTriangle, ChevronDown, CircleDashed } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export type ChainStepStatus = 'completed' | 'current' | 'upcoming' | 'error'
export type ChainStepIcon = 'funnel' | 'quotation' | 'po' | 'invoice' | 'payment' | 'training'
export type ChainStep = { id: string; label: string; description: string; icon: ChainStepIcon; status: ChainStepStatus; date?: string | null; amount?: number | null; detail?: string | null }

const STEP_ICONS: Record<ChainStepIcon, React.ComponentType<{ className?: string }>> = { funnel: Filter, quotation: FileText, po: FileCheck2, invoice: Receipt, payment: Banknote, training: GraduationCap }
const STATUS_META: Record<ChainStepStatus, { label: string; tone: string; ring: string }> = {
  completed: { label: 'Selesai', tone: 'bg-blue-600 text-white', ring: '' },
  current: { label: 'Sedang Berjalan', tone: 'bg-amber-500 text-white', ring: 'ring-4 ring-amber-100' },
  upcoming: { label: 'Akan Datang', tone: 'bg-slate-100 text-slate-400', ring: '' },
  error: { label: 'Perlu Tindakan', tone: 'bg-rose-600 text-white', ring: 'ring-4 ring-rose-100' },
}
const money = (value: number | null | undefined) => `RM ${Number(value ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`

export function ChainStepper({ steps }: { steps: ChainStep[] }) {
  const [activeStep, setActiveStep] = React.useState<string | null>(null)
  const selected = steps.find((s) => s.id === activeStep) ?? null
  return <div className="space-y-4">
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex min-w-[720px] items-start">
        {steps.map((step, idx) => {
          const Icon = STEP_ICONS[step.icon]
          const meta = STATUS_META[step.status]
          const isSelected = activeStep === step.id
          const isLast = idx === steps.length - 1
          return <React.Fragment key={step.id}>
            <button type="button" onClick={() => setActiveStep(isSelected ? null : step.id)} className={cn('group relative flex w-24 shrink-0 flex-col items-center gap-2 rounded-lg px-1 py-2 text-center hover:bg-slate-50', isSelected && 'bg-blue-50/60')}>
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shadow-sm transition-transform group-hover:scale-105', meta.tone, meta.ring)}>
                {step.status === 'completed' ? <Check className="h-4 w-4" strokeWidth={3} /> : step.status === 'error' ? <AlertTriangle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div><p className={cn('text-[11px] font-bold leading-tight', step.status === 'upcoming' ? 'text-slate-400' : 'text-slate-800')}>{step.label}</p><p className="mt-0.5 text-[10px] font-medium text-slate-400">{step.date ?? '—'}</p></div>
            </button>
            {!isLast && <div className="relative mt-[22px] h-0.5 flex-1 rounded-full bg-slate-200"><div className={cn('absolute inset-y-0 left-0 rounded-full transition-all', step.status === 'completed' ? 'bg-blue-600' : 'bg-slate-200')} style={{ width: step.status === 'completed' ? '100%' : '0%' }} /></div>}
          </React.Fragment>
        })}
      </div>
    </div>
    {selected ? <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', STATUS_META[selected.status].tone)}>{React.createElement(STEP_ICONS[selected.icon], { className: 'h-3.5 w-3.5' })}</span><h4 className="text-sm font-bold text-slate-900">{selected.label}</h4><Badge variant={selected.status === 'error' ? 'danger' : selected.status === 'current' ? 'warning' : selected.status === 'completed' ? 'info' : 'default'}>{STATUS_META[selected.status].label}</Badge></div><span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400"><CircleDashed className="h-3 w-3" />Langkah {steps.findIndex((s) => s.id === selected.id) + 1} daripada {steps.length}</span></div></div>
      <div className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Penerangan</p><p className="mt-1 text-xs font-medium text-slate-700">{selected.description}</p></div>
      <div className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tarikh</p><p className="mt-1 text-xs font-semibold text-slate-800">{selected.date ?? 'Belum direkod'}</p></div>
      <div className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nilai</p><p className="mt-1 text-xs font-semibold tabular-nums text-slate-800">{selected.amount != null ? money(selected.amount) : '—'}</p></div>
      <div className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p><p className="mt-1 text-xs font-semibold text-slate-800">{selected.detail ?? STATUS_META[selected.status].label}</p></div>
    </div> : <p className="flex items-center gap-1.5 px-1 text-[11px] font-medium text-slate-400"><ChevronDown className="h-3.5 w-3.5" />Klik pada setiap langkah garis masa untuk melihat butiran penuh.</p>}
  </div>
}
