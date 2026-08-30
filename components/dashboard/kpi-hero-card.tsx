import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type Variant = 'slate' | 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'violet' | 'cyan'

const variants: Record<Variant, string> = {
  slate: 'bg-slate-950 text-white', emerald: 'bg-emerald-50 text-emerald-950', blue: 'bg-blue-50 text-blue-950', indigo: 'bg-indigo-50 text-indigo-950',
  amber: 'bg-amber-50 text-amber-950', rose: 'bg-rose-50 text-rose-950', violet: 'bg-violet-50 text-violet-950', cyan: 'bg-cyan-50 text-cyan-950',
}

export function KpiHeroCard({ label, value, trend, trendLabel, progress, icon: Icon, variant = 'slate', href }: { label: string; value: string | number; trend?: number; trendLabel?: string; progress?: number; icon?: LucideIcon; variant?: Variant; href?: string }) {
  const Trend = trend === undefined ? Minus : trend >= 0 ? TrendingUp : TrendingDown
  const content = <Card className={cn('overflow-hidden border-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md', variants[variant])}><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium opacity-70">{label}</p><p className="mt-2 text-[32px] font-bold leading-none tracking-tight tabular-nums">{value}</p></div>{Icon ? <div className="rounded-xl bg-white/70 p-2.5 text-current shadow-sm"><Icon className="h-5 w-5" /></div> : null}</div>{trend !== undefined ? <div className="mt-4 flex items-center gap-1.5 text-xs font-medium"><Trend className="h-3.5 w-3.5" />{trend > 0 ? '+' : ''}{trend.toFixed(1)}% {trendLabel ?? 'vs previous period'}</div> : null}{progress !== undefined ? <div className="mt-4"><div className="mb-1.5 flex justify-between text-[11px] opacity-70"><span>Progress</span><span>{Math.round(progress)}%</span></div><Progress value={progress} className="bg-black/10" /></div> : null}</CardContent></Card>
  if (href) return <Link href={href} className="block">{content}</Link>
  return content
}
