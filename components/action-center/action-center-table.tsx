'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CheckCircle2, ExternalLink, Search } from 'lucide-react'
import type { Database } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type ActionRow = Database['public']['Views']['vw_action_required']['Row']

type ActionCenterTableProps = { rows: ActionRow[] }

function priorityClass(priority: string | null) {
  switch (priority?.toUpperCase()) {
    case 'HIGH': return 'border-red-200 bg-red-50 text-red-700'
    case 'MEDIUM': return 'border-amber-200 bg-amber-50 text-amber-700'
    default: return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
}

function categoryClass(category: string | null) {
  switch (category?.toUpperCase()) {
    case 'OVERDUE': return 'border-red-200 bg-red-50 text-red-700'
    case 'INVOICE': return 'border-violet-200 bg-violet-50 text-violet-700'
    case 'PAYMENT': return 'border-blue-200 bg-blue-50 text-blue-700'
    default: return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

export function ActionCenterTable({ rows }: ActionCenterTableProps) {
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('ALL')
  const [followedUp, setFollowedUp] = useState<Set<string>>(new Set())

  const filteredRows = useMemo(() => rows.filter((row) => {
    const needle = search.trim().toLowerCase()
    const matchesSearch = !needle || [row.company_name, row.program_code, row.category].some((value) => value?.toLowerCase().includes(needle))
    const matchesPriority = priority === 'ALL' || row.priority?.toUpperCase() === priority
    return matchesSearch && matchesPriority
  }), [rows, search, priority])

  function markFollowedUp(key: string) {
    setFollowedUp((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return <Card>
    <CardContent className="p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, program ID or category" className="pl-9" /></div>
        <div className="flex gap-2">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((value) => <Button key={value} type="button" size="sm" variant={priority === value ? 'default' : 'outline'} onClick={() => setPriority(value)}>{value === 'ALL' ? 'All' : value}</Button>)}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3 text-left">Priority</th><th className="p-3 text-left">Category</th><th className="p-3 text-left">Program</th><th className="p-3 text-left">Company</th><th className="p-3 text-right">Amount</th><th className="p-3 text-right">Days</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody>{filteredRows.map((row) => { const key = row.record_id ?? `${row.category}-${row.program_code ?? row.company_name ?? 'action'}`; const done = followedUp.has(key); return <tr key={key} className="border-t transition-colors hover:bg-slate-50"><td className="p-3"><Badge className={priorityClass(row.priority)}>{row.priority ?? 'LOW'}</Badge></td><td className="p-3"><Badge className={categoryClass(row.category)}>{row.category ?? 'ACTION'}</Badge></td><td className="p-3 font-medium">{row.program_code ?? '—'}</td><td className="max-w-[220px] truncate p-3">{row.company_name ?? '—'}</td><td className="p-3 text-right tabular-nums">{row.amount == null ? '—' : `RM ${Number(row.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}</td><td className="p-3 text-right tabular-nums">{row.days_outstanding ?? '—'}</td><td className="p-3"><div className="flex justify-end gap-2">{row.program_code ? <Button asChild size="sm" variant="outline"><Link href={`/dashboard/programs/${encodeURIComponent(row.program_code)}`}><ExternalLink className="mr-1.5 h-3.5 w-3.5" />View Program</Link></Button> : null}<Button size="sm" variant={done ? 'secondary' : 'outline'} onClick={() => markFollowedUp(key)}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />{done ? 'Followed Up' : 'Mark Followed Up'}</Button></div></td></tr> })}</tbody>
        </table>
      </div>
      {filteredRows.length === 0 ? <div className="py-10 text-center text-sm text-slate-500">No action items match the current filters.</div> : <p className="mt-3 text-xs text-slate-500">Showing {filteredRows.length} of {rows.length} action items.</p>}
    </CardContent>
  </Card>
}
