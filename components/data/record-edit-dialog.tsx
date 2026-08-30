'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Edit3, Save, X } from 'lucide-react'
import { updateEditableRecord } from '@/lib/actions/records'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type EditableTable = 'programs' | 'companies' | 'quotations' | 'purchase_orders' | 'invoices' | 'payments' | 'training_sessions' | 'participant_roster'
type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox'

type Field = {
  key: string
  label: string
  type?: FieldType
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  step?: string
  required?: boolean
}

export function RecordEditDialog({
  table,
  id,
  title,
  values,
  fields,
  onSaved,
}: {
  table: EditableTable
  id: string
  title: string
  values: Record<string, unknown>
  fields: Field[]
  onSaved?: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>(values)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) setDraft(values)
  }, [values, open])

  const dirty = useMemo(() => fields.some((field) => String(draft[field.key] ?? '') !== String(values[field.key] ?? '')), [draft, values, fields])

  function setValue(key: string, value: unknown) {
    setDraft((current) => ({ ...current, [key]: value }))
    setError(null)
  }

  function discard() {
    setDraft(values)
    setError(null)
    setOpen(false)
  }

  function closeEditor() {
    if (dirty && !window.confirm('You have unsaved changes. Discard them?')) return
    discard()
  }

  function save() {
    setError(null)
    const requiredMissing = fields.find((field) => field.required && String(draft[field.key] ?? '').trim() === '')
    if (requiredMissing) {
      setError(`${requiredMissing.label} is required.`)
      return
    }

    startTransition(async () => {
      const changes = Object.fromEntries(
        fields
          .filter((field) => String(draft[field.key] ?? '') !== String(values[field.key] ?? ''))
          .map((field) => [field.key, draft[field.key] ?? null]),
      )
      const result = await updateEditableRecord({ table, id, changes })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setOpen(false)
      onSaved?.()
      router.refresh()
    })
  }

  return <>
    <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => { setDraft(values); setError(null); setOpen(true) }}>
      <Edit3 className="h-3.5 w-3.5" /> Edit
    </Button>
    {open ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label={`Edit ${title}`}>
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Edit Record</p><h2 className="mt-0.5 text-lg font-semibold text-slate-900">{title}</h2></div>
          <button type="button" onClick={closeEditor} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close editor"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const value = draft[field.key]
              if (field.type === 'checkbox') return <label key={field.key} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 sm:col-span-2"><input type="checkbox" checked={Boolean(value)} onChange={(event) => setValue(field.key, event.target.checked)} className="h-4 w-4" /><span className="text-sm font-medium text-slate-700">{field.label}</span></label>
              return <div key={field.key} className={cn(field.type === 'text' && field.key === 'title' ? 'sm:col-span-2' : '')}>
                <Label className="mb-1.5 block text-xs font-semibold text-slate-600">{field.label}{field.required ? ' *' : ''}</Label>
                {field.type === 'select' ? <select value={String(value ?? '')} onChange={(event) => setValue(field.key, event.target.value || null)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <Input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} step={field.step} value={value == null ? '' : String(value)} onChange={(event) => setValue(field.key, field.type === 'number' ? (event.target.value === '' ? null : Number(event.target.value)) : event.target.value)} placeholder={field.placeholder} />}
              </div>
            })}
          </div>
          {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p> : null}
          {dirty ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">You have unsaved changes. Save them or discard them before closing.</p> : null}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={discard} disabled={isPending}>Discard Changes</Button>
          <Button type="button" onClick={save} disabled={!dirty || isPending} className="gap-1.5 bg-blue-600 hover:bg-blue-700"><Save className="h-4 w-4" />{isPending ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </div> : null}
  </>
}
