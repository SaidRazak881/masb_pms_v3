'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type ImportKind = 'quotations' | 'invoices' | 'cost-of-sales' | 'r2'

const KINDS: Array<{ key: ImportKind; label: string; description: string }> = [
  { key: 'quotations', label: 'Quotation Tracker', description: 'POST /api/import/quotations' },
  { key: 'invoices', label: 'Invoice 2026', description: 'POST /api/import/invoices' },
  { key: 'cost-of-sales', label: 'Cost of Sales', description: 'POST /api/import/cost-of-sales' },
  { key: 'r2', label: 'R2 Overall Report', description: 'POST /api/import/r2' },
]

export function ImportCenterClient() {
  const [file, setFile] = useState<File | null>(null)
  const [kind, setKind] = useState<ImportKind>('r2')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function upload() {
    if (!file) {
      setMessage('Pilih fail terlebih dahulu.')
      return
    }
    setUploading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`/api/import/${kind}`, { method: 'POST', body: formData })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setMessage(`Import gagal (${response.status}): ${payload?.error ?? 'unknown'}`)
        return
      }
      setMessage(`Import berjaya: batch ${payload?.data?.batchId ?? '—'} (${payload?.data?.stagedRows ?? 0} rows staged).`)
      window.location.reload()
    } catch (error) {
      setMessage(`Ralat rangkaian: ${error instanceof Error ? error.message : 'unknown'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
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
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm"
          />
          <Button type="button" onClick={upload} disabled={uploading || !file}>
            {uploading ? 'Importing…' : 'Import'}
          </Button>
          <span className="text-xs text-slate-500">Batch akan di-*stage* dahulu, kemudian di-commit melalui endpoint commit.</span>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      </CardContent>
    </Card>
  )
}
