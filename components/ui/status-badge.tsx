'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type StatusType =
  | 'PAID' | 'UNPAID' | 'PARTIAL' | 'OVERDUE' | 'PENDING' | 'INVOICED'
  | 'DRAFT' | 'UPCOMING' | 'PENDING_DATA' | 'COMPLETED' | 'APPROVED'
  | 'REJECTED' | 'SECURED' | 'IN_PROGRESS' | 'LOST' | 'QUOTATION_SENT'

const styles: Record<StatusType, { dot: string; text: string; surface: string }> = {
  PAID: { dot: 'bg-emerald-600', text: 'text-emerald-700', surface: 'bg-emerald-50 border-emerald-200' },
  APPROVED: { dot: 'bg-emerald-600', text: 'text-emerald-700', surface: 'bg-emerald-50 border-emerald-200' },
  SECURED: { dot: 'bg-emerald-600', text: 'text-emerald-700', surface: 'bg-emerald-50 border-emerald-200' },
  COMPLETED: { dot: 'bg-emerald-600', text: 'text-emerald-700', surface: 'bg-emerald-50 border-emerald-200' },
  UNPAID: { dot: 'bg-amber-600', text: 'text-amber-700', surface: 'bg-amber-50 border-amber-200' },
  PENDING: { dot: 'bg-slate-500', text: 'text-slate-700', surface: 'bg-slate-50 border-slate-200' },
  PENDING_DATA: { dot: 'bg-amber-600', text: 'text-amber-700', surface: 'bg-amber-50 border-amber-200' },
  IN_PROGRESS: { dot: 'bg-amber-600', text: 'text-amber-700', surface: 'bg-amber-50 border-amber-200' },
  OVERDUE: { dot: 'bg-red-600', text: 'text-red-700', surface: 'bg-red-50 border-red-200' },
  REJECTED: { dot: 'bg-red-600', text: 'text-red-700', surface: 'bg-red-50 border-red-200' },
  LOST: { dot: 'bg-red-600', text: 'text-red-700', surface: 'bg-red-50 border-red-200' },
  PARTIAL: { dot: 'bg-blue-600', text: 'text-blue-700', surface: 'bg-blue-50 border-blue-200' },
  INVOICED: { dot: 'bg-sky-600', text: 'text-sky-700', surface: 'bg-sky-50 border-sky-200' },
  QUOTATION_SENT: { dot: 'bg-sky-600', text: 'text-sky-700', surface: 'bg-sky-50 border-sky-200' },
  DRAFT: { dot: 'bg-slate-400', text: 'text-slate-600', surface: 'bg-slate-100 border-slate-200' },
  UPCOMING: { dot: 'bg-indigo-600', text: 'text-indigo-700', surface: 'bg-indigo-50 border-indigo-200' },
}

export function StatusBadge({ status, label, className }: { status: StatusType; label?: string; className?: string }) {
  const meta = styles[status] ?? styles.PENDING
  const display = label ?? status.replaceAll('_', ' ')
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4', meta.surface, meta.text, className)}>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', meta.dot, status === 'OVERDUE' && 'animate-pulse')} aria-hidden="true" />
      {display}
    </span>
  )
}
