'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export type KpiTrend = {
  direction: 'up' | 'down' | 'neutral'
  value: string
  label?: string
}

export type KpiHeroCardProps = {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  icon: LucideIcon
  tone?: 'slate' | 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'violet' | 'cyan'
  trend?: KpiTrend
  progress?: {
    current: number
    target: number
    label?: string
  }
  href?: string
  badgeText?: string
  className?: string
}

const toneStyles = {
  slate: {
    iconBg: 'bg-slate-100 text-slate-700 ring-slate-200/60',
    accent: 'text-slate-900',
    borderHover: 'hover:border-slate-300',
    glow: 'group-hover:bg-slate-500/5',
    progress: 'bg-slate-700',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
    accent: 'text-emerald-700',
    borderHover: 'hover:border-emerald-300',
    glow: 'group-hover:bg-emerald-500/5',
    progress: 'bg-emerald-600',
  },
  blue: {
    iconBg: 'bg-blue-50 text-blue-700 ring-blue-200/60',
    accent: 'text-blue-700',
    borderHover: 'hover:border-blue-300',
    glow: 'group-hover:bg-blue-500/5',
    progress: 'bg-blue-600',
  },
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-700 ring-indigo-200/60',
    accent: 'text-indigo-700',
    borderHover: 'hover:border-indigo-300',
    glow: 'group-hover:bg-indigo-500/5',
    progress: 'bg-indigo-600',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-700 ring-amber-200/60',
    accent: 'text-amber-700',
    borderHover: 'hover:border-amber-300',
    glow: 'group-hover:bg-amber-500/5',
    progress: 'bg-amber-500',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-700 ring-rose-200/60',
    accent: 'text-rose-700',
    borderHover: 'hover:border-rose-300',
    glow: 'group-hover:bg-rose-500/5',
    progress: 'bg-rose-600',
  },
  violet: {
    iconBg: 'bg-violet-50 text-violet-700 ring-violet-200/60',
    accent: 'text-violet-700',
    borderHover: 'hover:border-violet-300',
    glow: 'group-hover:bg-violet-500/5',
    progress: 'bg-violet-600',
  },
  cyan: {
    iconBg: 'bg-cyan-50 text-cyan-700 ring-cyan-200/60',
    accent: 'text-cyan-700',
    borderHover: 'hover:border-cyan-300',
    glow: 'group-hover:bg-cyan-500/5',
    progress: 'bg-cyan-600',
  },
}

export function KpiHeroCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  tone = 'slate',
  trend,
  progress,
  href,
  badgeText,
  className,
}: KpiHeroCardProps) {
  const styles = toneStyles[tone]

  const content = (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md',
        styles.borderHover,
        className
      )}
    >
      <div className={cn('absolute inset-0 pointer-events-none transition-colors duration-200', styles.glow)} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg ring-1 transition-transform group-hover:scale-105', styles.iconBg)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
              {badgeText ? (
                <span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                  {badgeText}
                </span>
              ) : null}
            </div>
          </div>

          {trend ? (
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                trend.direction === 'up' && 'bg-emerald-50 text-emerald-700',
                trend.direction === 'down' && 'bg-rose-50 text-rose-700',
                trend.direction === 'neutral' && 'bg-slate-100 text-slate-600'
              )}
            >
              {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
              {trend.direction === 'neutral' && <Minus className="h-3 w-3" />}
              <span>{trend.value}</span>
            </div>
          ) : href ? (
            <div className="rounded-md p-1 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-slate-700">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-1.5">
            <span className={cn('text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums', styles.accent)}>
              {typeof value === 'number' ? value.toLocaleString('en-MY') : value}
            </span>
            {unit ? <span className="text-xs font-medium text-slate-500">{unit}</span> : null}
          </div>

          {subtitle ? (
            <p className="mt-1 text-xs text-slate-500 line-clamp-1">{subtitle}</p>
          ) : null}
        </div>

        {progress ? (
          <div className="mt-3.5 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
              <span>{progress.label ?? 'Progress'}</span>
              <span className="tabular-nums">
                {Math.round((progress.current / progress.target) * 100)}%
              </span>
            </div>
            <Progress
              value={progress.current}
              max={progress.target}
              className="h-1.5 bg-slate-100"
              indicatorClassName={styles.progress}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <a href={href} className="block no-underline focus:outline-none">
        {content}
      </a>
    )
  }

  return content
}
