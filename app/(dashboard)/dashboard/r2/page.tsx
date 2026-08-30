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

  const [{ data: rosterRows, error: rosterError }, { data: sessionRows, error: sessionError }, { data: programRows, error: programError }] = await Promise.all([
    supabase.from('participant_roster').select('*').order('full_name', { ascending: true }).limit(500),
    supabase.from('training_sessions').select('*'),
    supabase.from('programs').select('id, program_code, title, needs_review'),
  ])

  const sessionById = new Map((sessionRows ?? []).map((row) => [row.id, row]))
  const programById = new Map((programRows ?? []).map((row) => [row.id, row]))
  const roster = (rosterRows ?? []).map((row) => {
    const session = row.training_session_id ? sessionById.get(row.training_session_id) : undefined
    const program = session ? programById.get(session.program_id) : undefined
    return { ...row, session, program }
  })
  const certified = roster.filter((row) => row.participation_type === 'CERTIFIED')
  const attended = roster.filter((row) => row.participation_type === 'ATTENDED')
  const rosterSessions = new Set(roster.map((row) => row.training_session_id).filter(Boolean)).size
  const needsReview = roster.filter((row) => row.session?.r2_status === 'PENDING_DATA' || row.program?.needs_review)
  const hasRosterLoadError = Boolean(rosterError || sessionError || programError)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">R2 — Overall Report</h1>
        <p className="mt-1 text-sm text-slate-500">Dijana daripada training_sessions + participant_counts (view `vw_r2_overall_report`); roster dipaparkan daripada participant_roster.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Sessions</p><p className="mt-2 text-2xl font-bold">{sessions}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Categories Rows</p><p className="mt-2 text-2xl font-bold">{rows.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Certified Roster</p><p className="mt-2 text-2xl font-bold">{certified.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Attendance Rows</p><p className="mt-2 text-2xl font-bold">{attended.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Roster Sessions</p><p className="mt-2 text-2xl font-bold">{rosterSessions}</p></CardContent></Card>
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

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Participant Roster &amp; Attendance</h2>
              <p className="mt-1 text-xs text-slate-500">Dari sheet Attendance list melalui `commit_r2_roster()`. Baris attendance direkodkan per minggu (Week 1 / Week 2).</p>
            </div>
            {hasRosterLoadError ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">Data roster tidak lengkap</Badge> : null}
          </div>

          {needsReview.length > 0 ? (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {needsReview.length} baris tergolong dalam sesi attendance tanpa padanan exact dalam Overall report; ia telah dicipta sebagai sesi standalone dan masih perlu disemak (r2_status PENDING_DATA).
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3 text-left">Program</th>
                  <th className="p-3 text-left">Session</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Cert No</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Week</th>
                  <th className="p-3 text-left">Bumi</th>
                  <th className="p-3 text-left">Review</th>
                  <th className="p-3 text-right">Source Row</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((row) => {
                  const needsReviewRow = row.session?.r2_status === 'PENDING_DATA' || row.program?.needs_review
                  return (
                    <tr key={row.id} className="border-t transition-colors hover:bg-slate-50">
                      <td className="p-3 font-medium text-blue-600">{row.program?.program_code ?? '—'}</td>
                      <td className="max-w-[280px] truncate p-3">{row.session?.session_title ?? '—'}</td>
                      <td className="max-w-[240px] truncate p-3">{row.full_name}</td>
                      <td className="p-3 text-xs">{row.cert_no ?? '—'}</td>
                      <td className="p-3"><Badge className={row.participation_type === 'CERTIFIED' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}>{row.participation_type}</Badge></td>
                      <td className="p-3">{row.week_label ?? '—'}</td>
                      <td className="p-3">{row.is_bumiputera == null ? '—' : row.is_bumiputera ? 'Bumi' : 'Non-Bumi'}</td>
                      <td className="p-3">{needsReviewRow ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">Review</Badge> : '—'}</td>
                      <td className="p-3 text-right tabular-nums">{row.source_row ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {roster.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">Tiada participant roster. Import &amp; commit R2 untuk mengisi jadual ini.</p> : null}
          {roster.length > 0 ? <p className="mt-3 text-xs text-slate-500">{certified.length} certified · {attended.length} attendance records · {needsReview.length} perlu review. Menunjukkan sehingga 500 baris.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
