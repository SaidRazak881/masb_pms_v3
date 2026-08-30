'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export type KpiTrend = { direction: 'up' | 'down' | 'neutral'; value: string; label?: string }
export type KpiHeroCardProps = { title: string; value: string | number; unit?: string; subtitle?: string; icon: LucideIcon; tone?: 'slate' | 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'violet' | 'cyan'; trend?: KpiTrend; progress?: { current: number; target: number; label?: string }; href?: string; badgeText?: string; className?: string }

type ToneStyle = { iconBg: string; accent: string; borderHover: string; glow: string; progress: string }
const corporate: Record<'slate' | 'emerald' | 'blue' | 'amber' | 'rose', ToneStyle> = {
  slate: { iconBg: 'bg-slate-100 text-slate-700 ring-slate-200', accent: 'text-slate-900', borderHover: 'hover:border-slate-300', glow: 'group-hover:bg-slate-500/5', progress: 'bg-slate-700' },
  emerald: { iconBg: 'bg-emerald-50 text-emerald-700 ring-emerald-200', accent: 'text-emerald-700', borderHover: 'hover:border-emerald-300', glow: 'group-hover:bg-emerald-500/5', progress: 'bg-emerald-600' },
  blue: { iconBg: 'bg-blue-50 text-blue-700 ring-blue-200', accent: 'text-blue-700', borderHover: 'hover:border-blue-300', glow: 'group-hover:bg-blue-500/5', progress: 'bg-blue-600' },
  amber: { iconBg: 'bg-amber-50 text-amber-700 ring-amber-200', accent: 'text-amber-700', borderHover: 'hover:border-amber-300', glow: 'group-hover:bg-amber-500/5', progress: 'bg-amber-600' },
  rose: { iconBg: 'bg-red-50 text-red-700 ring-red-200', accent: 'text-red-700', borderHover: 'hover:border-red-300', glow: 'group-hover:bg-red-500/5', progress: 'bg-red-600' },
}
const alias: Record<NonNullable<KpiHeroCardProps['tone']>, keyof typeof corporate> = { slate: 'slate', emerald: 'emerald', blue: 'blue', indigo: 'blue', amber: 'amber', rose: 'rose', violet: 'blue', cyan: 'blue' }

export function KpiHeroCard({ title, value, unit, subtitle, icon: Icon, tone = 'slate', trend, progress, href, badgeText, className }: KpiHeroCardProps) {
  const styles = corporate[alias[tone]]
  const content = <Card className={cn('group relative h-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md', styles.borderHover, className)}>
    <div className={cn('pointer-events-none absolute inset-0 transition-colors duration-200', styles.glow)} />
    <CardContent className="flex h-full min-w-0 flex-col p-5">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5"><div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1', styles.iconBg)}><Icon className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>{badgeText && <span className="mt-0.5 inline-block max-w-full truncate rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{badgeText}</span>}</div></div>
        {trend ? <div className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', trend.direction === 'up' && 'bg-emerald-50 text-emerald-700', trend.direction === 'down' && 'bg-red-50 text-red-700', trend.direction === 'neutral' && 'bg-slate-100 text-slate-600')}>{trend.direction === 'up' ? <TrendingUp className="h-3 w-3" /> : trend.direction === 'down' ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}{trend.value}</div> : href ? <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" /> : null}
      </div>
      <div className="mt-4 min-w-0 max-w-full"><div className="flex min-w-0 max-w-full items-baseline gap-1.5 overflow-hidden"><span className={cn('min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.375rem,11cqw,2rem)] font-semibold leading-[1.2] tracking-tight tabular-nums', styles.accent)}>{typeof value === 'number' ? value.toLocaleString('en-MY') : value}</span>{unit && <span className="shrink-0 text-xs font-medium text-slate-500">{unit}</span>}</div>{subtitle && <p className="mt-1 line-clamp-1 text-xs text-slate-500">{subtitle}</p>}</div>
      {progress && <div className="mt-3.5 border-t border-slate-100 pt-3"><div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-slate-500"><span>{progress.label ?? 'Progress'}</span><span className="tabular-nums">{Math.round((progress.current / Math.max(progress.target, 1)) * 100)}%</span></div><Progress value={progress.current} max={progress.target} className="h-1.5 bg-slate-100" indicatorClassName={styles.progress} /></div>}
    </CardContent>
  </Card>
  return href ? <a href={href} className="block h-full min-w-0 no-underline focus:outline-none">{content}</a> : content
}
