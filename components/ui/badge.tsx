import * as React from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

const variants: Record<BadgeVariant, string> = {
  default: 'border-slate-200 bg-slate-100 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
}

export function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: BadgeVariant }) {
  return <div {...props} className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-4', variants[variant], className)} />
}
