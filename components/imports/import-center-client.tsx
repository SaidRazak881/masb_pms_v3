'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database'

type Batch = Database['public']['Tables']['import_batches']['Row']
type Exception = Database['public']['Tables']['data_quality_exceptions']['Row']
type ImportKind = 'quotations' | 'invoices' | 'cost-of-sales' | 'r2' | 'r3'

const KINDS: Array<{ key: ImportKind; label: string; description: string }> = [
  { key: 'quotations', label: 'Quotation Tracker', description: 'POST /api/import/quotations' },
  { key: 'invoices', label: 'Invoice 2026', description: 'POST /api/import/invoices' },
  { key: 'cost-of-sales', label: 'Cost of Sales', description: 'POST /api/import/cost-of-sales' },
  { key: 'r2', label: 'R2 Overall Report', description: 'POST /api/import/r2' },
  { key: 'r3', label: 'R3 / Sales Pipeline', description: 'POST /api/import/r3' },
]

const statusClass = (status: string | null) => {
  switch (status) {
    case 'COMPLETED': return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'FAILED':
    case 'PARSING_FAILED':
    case 'VALIDATION_FAILED':
    case 'MATCHING_FAILED':
    case 'ROLLED_BACK': return 'border-red-200 bg-red-50 text-red-700'
    case 'UPLOADED':
    case 'PARSING':
    case 'STAGED':
    case 'VALIDATING':
    case 'MATCHING':
    case 'READY':
    case 'COMMITTING': return 'border-blue-200 bg-blue-50 text-blue-700'
    default: return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

async function postJson(url: string, body: Record<string, unknown> = {}): Promise<{ ok: boolean; status: number; message?: string; data?: unknown }> {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const payload = await response.json().catch(() => null)
  return { ok: response.ok, status: response.status, message: payload?.error ?? (response.ok ? undefined : 'unknown'), data: payload?.data }
}

export function ImportCenterClient({ batches: initialBatches, exceptions: initialExceptions }: { batches: Batch[]; exceptions: Exception[] }) {
  const [batches, setBatches] = useState<Batch[]>(initialBatches)
  const [exceptions, setExceptions] = useState<Exception[]>(initialExceptions)
  const [file, setFile] = useState<File | null>(null)
  const [r3File, setR3File] = useState<File | null>(null)
  const [officeFile, setOfficeFile] = useState<File | null>(null)
  const [salesFile, setSalesFile] = useState<File | null>(null)
  const [kind, setKind] = useState<ImportKind>('r2')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [busyBatchId, setBusyBatchId] = useState<string | null>(null)

  async function upload() {
    if (kind === 'r3' && !r3File && !officeFile && !salesFile) { setMessage('Pilih sekurang-kurangnya satu fail R3 / office / sales.'); return }
    if (kind !== 'r3' && !file) { setMessage('Pilih fail terlebih dahulu.'); return }
    setUploading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      if (kind === 'r3') {
        if (r3File) formData.append('r3', r3File)
        if (officeFile) formData.append('office', officeFile)
        if (salesFile) formData.append('sales', salesFile)
      } else {
        if (file) formData.append('file', file)
      }
      const response = await fetch(`/api/import/${kind}`, { method: 'POST', body: formData })
      const payload = await response.json().catch(() => null)
      if (!response.ok) { setMessage(`Import gagal (${response.status}): ${payload?.error ?? 'unknown'}`); return }
      setMessage(`Import berjaya: batch ${payload?.data?.batchId ?? '—'} (${payload?.data?.stagedRows ?? 0} rows staged).`)
      window.location.reload()
    } catch (error) {
      setMessage(`Ralat rangkaian: ${error instanceof Error ? error.message : 'unknown'}`)
    } finally { setUploading(false) }
  }

  async function runExceptionAction(id: string, status: 'RESOLVED' | 'IGNORED') {
    setBusyBatchId(id)
    setMessage(null)
    try {
      const response = await fetch(`/api/import/exceptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution_note: status === 'RESOLVED' ? 'Resolved from Import Center' : 'Ignored from Import Center' }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) { setMessage(`Gagal kemas kini exception (${response.status}): ${payload?.error ?? 'unknown'}`); return }
      setExceptions((current) => current.filter((item) => item.id !== id))
      setMessage(`Exception ${status === 'RESOLVED' ? 'diselesaikan' : 'diabaikan'}.`)
    } catch (error) {
      setMessage(`Ralat rangkaian: ${error instanceof Error ? error.message : 'unknown'}`)
    } finally { setBusyBatchId(null) }
  }

  async function runBatchAction(batchId: string, action: 'match-engine' | 'match' | 'commit' | 'r2-commit' | 'r3-commit') {
    setBusyBatchId(batchId)
    setMessage(null)
    try {
      let result
      if (action === 'match-engine') {
        result = await postJson(`/api/import/${batchId}/match-engine`)
        if (result.ok) setMessage(`Matching selesai: total=${(result.data as { total?: number } | undefined)?.total ?? '—'}`)
      } else if (action === 'match') {
        result = await postJson(`/api/import/${batchId}/match`)
        if (result.ok) setMessage(`Resolution selesai: resolved=${(result.data as { resolved?: number } | undefined)?.resolved ?? '—'}`)
      } else if (action === 'r2-commit') {
        result = await postJson('/api/import/r2/commit', { batch_id: batchId })
        if (result.ok) {
          const audit = (result.data as { audit?: { checked_sessions?: number; created_exceptions?: number; mismatch_sessions?: number } } | undefined)?.audit
          setMessage(`Commit R2 selesai. Roster audit: ${audit?.checked_sessions ?? '—'} sesi disemak, ${audit?.mismatch_sessions ?? '—'} mismatch, ${audit?.created_exceptions ?? '—'} exception baharu.`)
        }
      } else if (action === 'r3-commit') {
        result = await postJson('/api/import/r3/commit', { batch_id: batchId })
      } else {
        result = await postJson('/api/import/commit', { batch_id: batchId })
      }
      if (!result.ok) { setMessage(`Operasi gagal (${result.status}): ${result.message ?? 'unknown'}`); return }
      setMessage(`Operasi selesai (${action}). Muat semula...`)
      window.location.reload()
    } catch (error) {
      setMessage(`Ralat rangkaian: ${error instanceof Error ? error.message : 'unknown'}`)
    } finally { setBusyBatchId(null) }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold">Upload Workbook</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {KINDS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setKind(item.key)}
                className={`rounded-lg border p-3 text-left transition-colors ${kind === item.key ? 'border-blue-400 bg-blue-50' : 'hover:bg-slate-50'}`}
              >
                <p className="text-sm font-medium">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.description}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {kind === 'r3' ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs text-slate-500">R3 Funnel
                  <input type="file" accept=".xlsx,.xls" onChange={(event) => setR3File(event.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm" />
                </label>
                <label className="text-xs text-slate-500">Office Funnel
                  <input type="file" accept=".xlsx,.xls" onChange={(event) => setOfficeFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm" />
                </label>
                <label className="text-xs text-slate-500">Sales Report
                  <input type="file" accept=".xlsx,.xls" onChange={(event) => setSalesFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm" />
                </label>
              </div>
            ) : (
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm"
              />
            )}
            <div className="flex items-center gap-3">
              <Button type="button" onClick={upload} disabled={uploading || (kind === 'r3' ? (!r3File && !officeFile && !salesFile) : !file)}>
                {uploading ? 'Importing…' : 'Import'}
              </Button>
              <span className="text-xs text-slate-500">Batch akan di-*stage* dahulu, kemudian di-commit.</span>
            </div>
          </div>
          {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold">Import Batches</h2>
          <div className="mt-3 space-y-2">
            {batches.length === 0 ? <p className="text-sm text-slate-500">Tiada batch import lagi.</p> : batches.map((batch) => (
              <div key={batch.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{batch.file_name}</p>
                  <p className="text-xs text-slate-500">{batch.source_type} · {batch.total_rows} rows</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusClass(batch.status)}>{batch.status}</Badge>
                  <Button size="sm" variant="outline" disabled={busyBatchId === batch.id} onClick={() => runBatchAction(batch.id, 'match-engine')}>Match</Button>
                  <Button size="sm" variant="outline" disabled={busyBatchId === batch.id} onClick={() => runBatchAction(batch.id, 'match')}>Resolve</Button>
                  {batch.source_type === 'r2_overall_report'
                    ? <Button size="sm" disabled={busyBatchId === batch.id} onClick={() => runBatchAction(batch.id, 'r2-commit')}>Commit R2</Button>
                    : batch.source_type === 'r3_sales_pipeline'
                      ? <Button size="sm" disabled={busyBatchId === batch.id} onClick={() => runBatchAction(batch.id, 'r3-commit')}>Commit R3</Button>
                      : <Button size="sm" disabled={busyBatchId === batch.id} onClick={() => runBatchAction(batch.id, 'commit')}>Commit</Button>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold">Data Quality Exceptions (Open)</h2>
          <div className="mt-3 space-y-2">
            {exceptions.length === 0 ? <p className="text-sm text-slate-500">Tiada exception terbuka.</p> : exceptions.map((exception) => (
              <div key={exception.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{exception.type}</p>
                    <Badge className={exception.severity === 'HIGH' || exception.severity === 'CRITICAL' ? 'border-red-200 bg-red-50 text-red-700' : exception.severity === 'MEDIUM' || exception.severity === 'MED' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-700'}>{exception.severity}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{exception.description}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" disabled={busyBatchId === exception.id} onClick={() => runExceptionAction(exception.id, 'RESOLVED')}>Resolve</Button>
                  <Button size="sm" variant="secondary" disabled={busyBatchId === exception.id} onClick={() => runExceptionAction(exception.id, 'IGNORED')}>Ignore</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
