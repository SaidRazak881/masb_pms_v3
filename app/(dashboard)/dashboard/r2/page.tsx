import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

type R2Row = Database['public']['Views']['vw_r2_overall_report']['Row']

const statusClass = (status: string | null) => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'PENDING_DATA': return 'border-amber-200 bg-amber-50 text-amber-700'
    default: return 'border-blue-200 bg-blue-50 text-blue-700'
  }
}

export default async function R2Page() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('vw_r2_overall_report').select('*').order('start_date', { ascending: false })

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold tracking-tight">R2 — Overall Report</h1>
        <Card><CardContent className="p-6"><p className="text-sm text-slate-600">Data R2 tidak dapat dimuatkan sekarang.</p><p className="mt-2 text-xs text-red-600">{error.message}</p></CardContent></Card>
      </div>
    )
  }

  const rows: R2Row[] = data ?? []
  const sessions = new Set(rows.map((row) => row.program_code ?? '').filter(Boolean)).size
  const totalParticipants = rows.reduce((sum, row) => sum + Number(row.total_count ?? 0), 0)
  const totalBumi = rows.reduce((sum, row) => sum + Number(row.bumiputera_count ?? 0), 0)
  const totalNonBumi = rows.reduce((sum, row) => sum + Number(row.non_bumiputera_count ?? 0), 0)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">R2 — Overall Report</h1>
        <p className="mt-1 text-sm text-slate-500">Dijana daripada training_sessions + participant_counts (view `vw_r2_overall_report`).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Sessions</p><p className="mt-2 text-2xl font-bold">{sessions}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Categories Rows</p><p className="mt-2 text-2xl font-bold">{rows.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Bumiputera</p><p className="mt-2 text-2xl font-bold">{totalBumi}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Non-Bumiputera</p><p className="mt-2 text-2xl font-bold">{totalNonBumi}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3 text-left">Program</th>
                  <th className="p-3 text-left">Session</th>
                  <th className="p-3 text-left">Company</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Start</th>
                  <th className="p-3 text-left">End</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-right">Workshop</th>
                  <th className="p-3 text-right">Training</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Bumi</th>
                  <th className="p-3 text-right">Non-Bumi</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.program_code}-${row.session_title}-${row.category}-${index}`} className="border-t transition-colors hover:bg-slate-50">
                    <td className="p-3 font-medium text-blue-600">{row.program_code ?? '—'}</td>
                    <td className="max-w-[300px] truncate p-3">{row.session_title ?? '—'}</td>
                    <td className="max-w-[220px] truncate p-3">{row.company_name ?? '—'}</td>
                    <td className="p-3">{row.session_type ?? '—'}</td>
                    <td className="p-3">{row.start_date ? new Date(row.start_date).toLocaleDateString('en-MY') : '—'}</td>
                    <td className="p-3">{row.end_date ? new Date(row.end_date).toLocaleDateString('en-MY') : '—'}</td>
                    <td className="p-3"><Badge>{row.category ?? '—'}</Badge></td>
                    <td className="p-3 text-right tabular-nums">{row.workshop_count ?? 0}</td>
                    <td className="p-3 text-right tabular-nums">{row.training_count ?? 0}</td>
                    <td className="p-3 text-right tabular-nums">{row.total_count ?? 0}</td>
                    <td className="p-3 text-right tabular-nums">{row.bumiputera_count ?? 0}</td>
                    <td className="p-3 text-right tabular-nums">{row.non_bumiputera_count ?? 0}</td>
                    <td className="p-3"><Badge className={statusClass(row.r2_status)}>{row.r2_status ?? '—'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">Tiada data R2. Import R2 Overall Report untuk melihat laporan.</p> : null}
          <p className="mt-3 text-xs text-slate-500">Total peserta kategori: {totalParticipants}</p>
        </CardContent>
      </Card>
    </div>
  )
}
