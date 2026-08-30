'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepState = 'completed' | 'current' | 'pending' | 'warning'

export type ChainStepItem = {
  id: string
  title: string
  subtitle?: string
  date?: string | null
  state: StepState
  amount?: number
  docNo?: string | null
}

export function ChainStepper({ steps }: { steps: ChainStepItem[] }) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">Rantaian Dokumen Bersepadu (Lifecycle Chain)</h3>
        <p className="text-xs text-slate-500">Jejak aliran lengkap dari Corong Jualan ➔ Sebut Harga ➔ PO ➔ Invois ➔ Bayaran ➔ Latihan.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {steps.map((step, idx) => {
          const isCompleted = step.state === 'completed'
          const isCurrent = step.state === 'current'
          const isWarning = step.state === 'warning'
          return (
            <div key={step.id} className={cn('relative flex flex-col justify-between rounded-xl border p-3.5 transition-all', isCompleted && 'border-emerald-200 bg-emerald-50/40', isCurrent && 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-sm', isWarning && 'border-rose-300 bg-rose-50/50 ring-2 ring-rose-400/20', step.state === 'pending' && 'border-slate-200/70 bg-slate-50/30 opacity-70')}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Langkah {idx + 1}</span>
                <div className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold', isCompleted && 'bg-emerald-600 text-white shadow-xs', isCurrent && 'bg-blue-600 text-white animate-pulse', isWarning && 'bg-rose-600 text-white', step.state === 'pending' && 'bg-slate-200 text-slate-500')}>
                  {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : idx + 1}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">{step.title}</p>
                {step.docNo ? <p className="truncate font-mono text-[11px] font-semibold text-blue-700">{step.docNo}</p> : <p className="truncate text-[11px] text-slate-500">{step.subtitle || 'Belum Dijana'}</p>}
                {step.amount !== undefined && step.amount > 0 ? <p className="mt-1 text-xs font-bold text-slate-900 tabular-nums">RM {Number(step.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p> : null}
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[10px] text-slate-400">
                <span className="truncate">{step.date || '—'}</span>
                <span className={cn('font-semibold uppercase', isCompleted && 'text-emerald-700', isCurrent && 'font-bold text-blue-700', isWarning && 'font-bold text-rose-700', step.state === 'pending' && 'text-slate-400')}>{isCompleted ? 'Selesai' : isCurrent ? 'Aktif' : isWarning ? 'Tunggak' : 'Menunggu'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
