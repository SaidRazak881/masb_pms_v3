'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Edit3, ExternalLink, Search } from 'lucide-react'
import type { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StatusBadge, type StatusType } from '@/components/ui/status-badge'

type ProgramRow = Database['public']['Views']['vw_r3_sales_funnel']['Row']
type ProgramsTableProps = { rows: ProgramRow[] }
const PAGE_SIZE = 10

function stageStatus(stage: string | null): StatusType {
  switch (stage?.toUpperCase()) {
    case 'PAID':
    case 'TRAINING_COMPLETED': return 'COMPLETED'
    case 'LOST': return 'OVERDUE'
    case 'PO_RECEIVED':
    case 'INVOICED': return 'INVOICED'
    case 'QUOTATION_SENT': return 'PENDING'
    default: return 'PENDING'
  }
}

export function ProgramsTable({ rows }: ProgramsTableProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return rows.filter((row) => !needle || row.company_name?.toLowerCase().includes(needle) || row.title?.toLowerCase().includes(needle))
  }, [rows, search])
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  function updateSearch(value: string) { setSearch(value); setPage(1) }

  return <Card>
    <CardContent className="p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search company or program title" className="pl-9" />
        </div>
        <p className="text-xs font-medium text-slate-500">{filteredRows.length} programs</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[1000px] text-[13px] leading-[1.4]">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3 text-left">Program</th><th className="p-3 text-left">Company</th><th className="p-3 text-left">Stage</th>
              <th className="p-3 text-right">Forecast</th><th className="p-3 text-right">Weighted</th><th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, index) => {
              const key = row.program_code ?? `${row.company_name}-${row.title}-${index}`
              return <tr key={key} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/50 transition-colors hover:bg-slate-100/70">
                <td className="p-3"><div className="font-semibold text-blue-600">{row.program_code ?? '—'}</div><div className="mt-1 max-w-[320px] truncate font-medium text-slate-900">{row.title ?? 'Untitled Program'}</div></td>
                <td className="max-w-[240px] truncate p-3 text-slate-700">{row.company_name ?? '—'}</td>
                <td className="p-3"><StatusBadge status={stageStatus(row.current_stage)} label={row.current_stage?.replaceAll('_', ' ') ?? 'UNKNOWN'} /></td>
                <td className="p-3 text-right tabular-nums">RM {Number(row.forecast_value ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-medium tabular-nums">RM {Number(row.weighted_value ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right"><div className="flex justify-end gap-2">{row.program_code ? <><Button asChild size="sm" variant="outline" className="h-8 text-xs"><Link href={`/dashboard/programs/${encodeURIComponent(row.program_code)}`}><ExternalLink className="mr-1.5 h-3.5 w-3.5" />View</Link></Button><Button asChild size="sm" variant="outline" className="h-8 text-xs"><Link href={`/dashboard/programs/${encodeURIComponent(row.program_code)}/edit`}><Edit3 className="mr-1.5 h-3.5 w-3.5" />Edit</Link></Button></> : null}</div></td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
      {pageRows.length === 0 ? <div className="py-10 text-center text-sm text-slate-500">No programs match your search.</div> : null}
      <div className="mt-4 flex items-center justify-between gap-4 border-t pt-4">
        <p className="text-xs text-slate-500">Page {currentPage} of {totalPages}</p>
        <div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button><Button type="button" variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</Button></div>
      </div>
    </CardContent>
  </Card>
}
