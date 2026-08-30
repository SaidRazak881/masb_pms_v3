import * as React from 'react'
import { cn } from '@/lib/utils'

export function Separator({ orientation = 'horizontal', className }: { orientation?: 'horizontal' | 'vertical'; className?: string }) {
  return <div role="separator" className={cn('shrink-0 bg-slate-200', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)} />
}
