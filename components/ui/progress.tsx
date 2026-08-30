import * as React from 'react'
import { cn } from '@/lib/utils'

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  const safe = Math.min(100, Math.max(0, value))
  return <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe} className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}><div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${safe}%` }} /></div>
}
