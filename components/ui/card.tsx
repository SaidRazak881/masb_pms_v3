import * as React from 'react'
import { cn } from '@/lib/utils'
export function Card(props: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} className={cn('rounded-xl border bg-white text-slate-950 shadow-sm', props.className)} /> }
export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} className={cn('flex flex-col space-y-1.5 p-6', props.className)} /> }
export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) { return <h3 {...props} className={cn('text-2xl font-semibold leading-none tracking-tight', props.className)} /> }
export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} className={cn('p-6 pt-0', props.className)} /> }
