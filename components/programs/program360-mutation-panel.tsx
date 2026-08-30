'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'
import { Pencil, Settings2, X } from 'lucide-react'
import { getProgramMutationSnapshot } from '@/lib/actions/program-mutations'
import { RecordEditDialog } from '@/components/data/record-edit-dialog'
import { Button } from '@/components/ui/button'
import type { Row } from '@/types/database'

type EditableRecord = Record<string, unknown> & { id: string }

type Props = { programCode?: string }

const select = (options: Array<{ value: string; label: string }>) => ({ type: 'select' as const, options })
const stageOptions = ['LEAD_REGISTERED','PROPOSAL_SUBMITTED','QUOTATION_APPROVED','PO_RECEIVED','INVOICED','PAID','TRAINING_COMPLETED','LOST'].map((value) => ({ value, label: value.replaceAll('_', ' ') }))
const quotationOptions = ['DRAFT','SENT','PENDING','APPROVED','REJECTED','EXPIRED'].map((value) => ({ value, label: value }))
const paymentOptions = ['UNPAID','PARTIAL','PAID','OVERDUE'].map((value) => ({ value, label: value }))
const r2Options = ['COMPLETED','PENDING_DATA','UPCOMING'].map((value) => ({ value, label: value.replaceAll('_', ' ') }))
const participantOptions = ['CERTIFIED','ATTENDED'].map((value) => ({ value, label: value }))
const weekOptions = ['week1','week2'].map((value) => ({ value, label: value.replace('week', 'Week ') }))

function EditRecord({ table, record, title, fields }: { table: 'programs' | 'quotations' | 'purchase_orders' | 'invoices' | 'payments' | 'training_sessions' | 'participant_roster'; record: EditableRecord; title: string; fields: any[] }) {
  return <RecordEditDialog table={table} id={record.id} title={title} values={record} fields={fields} />
}

export function Program360MutationPanel({ programCode }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [snapshot, setSnapshot] = useState<any>(null)
  const [loading, startTransition] = useTransition()

  useEffect(() => {
    if (!pathname.startsWith('/dashboard/programs/')) return
    const code = programCode ?? decodeURIComponent(pathname.split('/').pop() ?? '')
    if (!code) return
    startTransition(async () => {
      const result = await getProgramMutationSnapshot(code)
      if (result.ok) setSnapshot(result)
    })
  }, [pathname, programCode])

  if (!snapshot?.canEdit) return null

  const program = snapshot.program as Row<'programs'>
  const quotations = snapshot.quotations as Row<'quotations'>[]
  const purchaseOrders = snapshot.purchaseOrders as Row<'purchase_orders'>[]
  const invoices = snapshot.invoices as Row<'invoices'>[]
  const payments = snapshot.payments as Row<'payments'>[]
  const trainingSessions = snapshot.trainingSessions as Row<'training_sessions'>[]
  const roster = snapshot.roster as Row<'participant_roster'>[]

  const programFields = [
    { key: 'title', label: 'Program Title', required: true },
    { key: 'category', label: 'Category' },
    { key: 'training_type', label: 'Training Type' },
    { key: 'current_stage', label: 'Stage', ...select(stageOptions) },
    { key: 'client_category', label: 'Client Category' },
    { key: 'sector', label: 'Sector' },
    { key: 'lead_date', label: 'Lead Date', type: 'date' as const },
    { key: 'forecast_value', label: 'Forecast Value', type: 'number' as const, step: '0.01' },
    { key: 'probability', label: 'Probability', type: 'number' as const, step: '0.01' },
    { key: 'weighted_value', label: 'Weighted Value', type: 'number' as const, step: '0.01' },
    { key: 'needs_review', label: 'Needs Review', type: 'checkbox' as const },
  ]

  return <>
    <div className="fixed bottom-5 right-5 z-40">
      <Button type="button" onClick={() => setOpen(true)} disabled={loading} className="h-10 gap-2 rounded-full bg-blue-600 px-4 text-sm font-semibold shadow-lg hover:bg-blue-700">
        <Settings2 className="h-4 w-4" /> {loading ? 'Loading editor...' : 'Manage Program Data'}
      </Button>
    </div>

    {open ? <div className="fixed inset-0 z-[90] bg-slate-950/40 p-3 sm:p-6">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Program Data Management</p><h2 className="mt-0.5 text-lg font-semibold text-slate-900">{program.program_code} · {program.title}</h2><p className="mt-0.5 text-xs text-slate-500">Role: {String(snapshot.role).replace('_', ' ')}</p></div>
          <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <section className="mb-6 rounded-xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Program</h3><EditRecord table="programs" record={program} title="Edit Program" fields={programFields} /></div><p className="text-xs text-slate-500">Update program information and pipeline stage. Save/Discard is handled by the editor.</p></section>

          <section className="mb-6"><h3 className="mb-3 text-sm font-semibold">Quotations</h3><div className="space-y-2">{quotations.length ? quotations.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{row.quotation_no_raw}</p><p className="text-xs text-slate-500">{row.status} · RM {Number(row.final_price ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p></div><EditRecord table="quotations" record={row} title={`Edit Quotation ${row.quotation_no_raw}`} fields={[{ key: 'quotation_no_raw', label: 'Quotation No', required: true }, { key: 'quotation_date', label: 'Quotation Date', type: 'date' }, { key: 'final_price', label: 'Final Price', type: 'number', step: '0.01' }, { key: 'status', label: 'Status', ...select(quotationOptions) }, { key: 'prepared_by', label: 'Prepared By' }]} /></div>) : <p className="text-xs text-slate-500">No quotations.</p>}</div></section>

          <section className="mb-6"><h3 className="mb-3 text-sm font-semibold">Purchase Orders</h3><div className="space-y-2">{purchaseOrders.length ? purchaseOrders.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"><div><p className="text-sm font-medium">{row.po_no ?? 'Unnamed PO'}</p><p className="text-xs text-slate-500">RM {Number(row.po_value ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p></div><EditRecord table="purchase_orders" record={row} title={`Edit PO ${row.po_no ?? ''}`} fields={[{ key: 'po_no', label: 'PO No' }, { key: 'po_date', label: 'PO Date', type: 'date' }, { key: 'po_value', label: 'PO Value', type: 'number', step: '0.01' }, { key: 'quotation_id', label: 'Quotation ID' }]} /></div>) : <p className="text-xs text-slate-500">No purchase orders.</p>}</div></section>

          <section className="mb-6"><h3 className="mb-3 text-sm font-semibold">Invoices</h3><div className="space-y-2">{invoices.length ? invoices.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"><div><p className="text-sm font-medium">{row.invoice_no}</p><p className="text-xs text-slate-500">{row.payment_status} · RM {Number(row.total_value ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p></div><EditRecord table="invoices" record={row} title={`Edit Invoice ${row.invoice_no}`} fields={[{ key: 'invoice_no', label: 'Invoice No', required: true }, { key: 'invoice_date', label: 'Invoice Date', type: 'date' }, { key: 'invoice_value_excl_sst', label: 'Value Excl. SST', type: 'number', step: '0.01' }, { key: 'sst_amount', label: 'SST Amount', type: 'number', step: '0.01' }, { key: 'total_value', label: 'Total Value', type: 'number', step: '0.01' }, { key: 'payment_terms_days', label: 'Payment Terms (Days)', type: 'number' }, { key: 'due_date', label: 'Due Date', type: 'date' }, { key: 'payment_status', label: 'Payment Status', ...select(paymentOptions) }, { key: 'pic', label: 'PIC' }]} /></div>) : <p className="text-xs text-slate-500">No invoices.</p>}</div></section>

          <section className="mb-6"><h3 className="mb-3 text-sm font-semibold">Payments</h3><div className="space-y-2">{payments.length ? payments.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"><div><p className="text-sm font-medium">RM {Number(row.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p><p className="text-xs text-slate-500">{row.payment_date} · {row.reference_no ?? 'No reference'}</p></div><EditRecord table="payments" record={row} title="Edit Payment" fields={[{ key: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true }, { key: 'payment_date', label: 'Payment Date', type: 'date' }, { key: 'method', label: 'Method' }, { key: 'reference_no', label: 'Reference No' }]} /></div>) : <p className="text-xs text-slate-500">No payments.</p>}</div></section>

          <section className="mb-6"><h3 className="mb-3 text-sm font-semibold">Training Sessions</h3><div className="space-y-2">{trainingSessions.length ? trainingSessions.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{row.session_title}</p><p className="text-xs text-slate-500">{row.r2_status} · {row.start_date ?? 'No date'}</p></div><EditRecord table="training_sessions" record={row} title={`Edit Training Session ${row.session_title}`} fields={[{ key: 'session_title', label: 'Session Title', required: true }, { key: 'session_type', label: 'Session Type' }, { key: 'start_date', label: 'Start Date', type: 'date' }, { key: 'end_date', label: 'End Date', type: 'date' }, { key: 'venue', label: 'Venue' }, { key: 'duration_days', label: 'Duration (Days)', type: 'number' }, { key: 'r2_status', label: 'R2 Status', ...select(r2Options) }]} /></div>) : <p className="text-xs text-slate-500">No training sessions.</p>}</div></section>

          <section><h3 className="mb-3 text-sm font-semibold">Participant Roster</h3><div className="space-y-2">{roster.slice(0, 100).map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{row.full_name}</p><p className="text-xs text-slate-500">{row.participation_type} · {row.cert_no ?? 'No certificate no.'}</p></div><EditRecord table="participant_roster" record={row} title={`Edit Participant ${row.full_name}`} fields={[{ key: 'full_name', label: 'Full Name', required: true }, { key: 'cert_no', label: 'Certificate No' }, { key: 'is_bumiputera', label: 'Bumiputera', type: 'checkbox' }, { key: 'participation_type', label: 'Participation Type', ...select(participantOptions) }, { key: 'week_label', label: 'Week', ...select(weekOptions) }, { key: 'attendance_date', label: 'Attendance Date', type: 'date' }]} /></div>)}{roster.length > 100 ? <p className="pt-2 text-xs text-slate-500">Showing first 100 participants. Use Data/R2 screens for the complete roster.</p> : null}{!roster.length ? <p className="text-xs text-slate-500">No participant roster records.</p> : null}</div></section>
        </div>
      </div>
    </div> : null}
  </>
}
