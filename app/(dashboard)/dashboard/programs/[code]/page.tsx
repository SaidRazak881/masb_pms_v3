import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Row } from '@/types/database'

export const dynamic = 'force-dynamic'

type Program = Row<'programs'>
type Company = Row<'companies'>
type PipelineRow = Row<'pipeline_stage_history'>
type Quotation = Row<'quotations'>
type PurchaseOrder = Row<'purchase_orders'>
type Invoice = Row<'invoices'>
type Payment = Row<'payments'>
type TrainingSession = Row<'training_sessions'>
type ParticipantCount = Row<'participant_counts'>
type ParticipantRoster = Row<'participant_roster'>

const money = (value: number | null | undefined): string =>
  `RM ${Number(value ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`

const date = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleDateString('en-MY') : '—'

function stageClass(stage: string | null) {
  switch (stage?.toUpperCase()) {
    case 'PAID':
    case 'TRAINING_COMPLETED': return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'LOST': return 'border-red-200 bg-red-50 text-red-700'
    case 'PO_RECEIVED':
    case 'INVOICED': return 'border-blue-200 bg-blue-50 text-blue-700'
    default: return 'border-amber-200 bg-amber-50 text-amber-700'
  }
}

function paymentClass(status: string | null) {
  switch (status?.toUpperCase()) {
    case 'PAID': return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'PARTIAL': return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'OVERDUE': return 'border-red-200 bg-red-50 text-red-700'
    default: return 'border-amber-200 bg-amber-50 text-amber-700'
  }
}

export default async function Program360({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const programResult = await supabase.from('programs').select('*').eq('program_code', code).single()
  if (programResult.error || !programResult.data) notFound()

  const program: Program = programResult.data
  const [companyResult, pipelineResult, quotationsResult, purchaseOrdersResult, invoicesResult, trainingResult] = await Promise.all([
    supabase.from('companies').select('*').eq('id', program.company_id).single(),
    supabase.from('pipeline_stage_history').select('*').eq('program_id', program.id).order('changed_at', { ascending: false }).limit(20),
    supabase.from('quotations').select('*').eq('program_id', program.id).order('quotation_date', { ascending: false }),
    supabase.from('purchase_orders').select('*').eq('program_id', program.id).order('po_date', { ascending: false }),
    supabase.from('invoices').select('*').eq('program_id', program.id).order('invoice_date', { ascending: false }),
    supabase.from('training_sessions').select('*').eq('program_id', program.id).order('start_date', { ascending: false }),
  ])

  const company = companyResult.data as Company | null
  const pipeline = (pipelineResult.data ?? []) as PipelineRow[]
  const quotations = (quotationsResult.data ?? []) as Quotation[]
  const purchaseOrders = (purchaseOrdersResult.data ?? []) as PurchaseOrder[]
  const invoices = (invoicesResult.data ?? []) as Invoice[]
  const trainingSessions = (trainingResult.data ?? []) as TrainingSession[]

  const sessionIds = trainingSessions.map((session) => session.id)
  const invoiceIds = invoices.map((invoice) => invoice.id)

  const [countsResult, rosterResult, paymentsResult] = await Promise.all([
    sessionIds.length ? supabase.from('participant_counts').select('*').in('training_session_id', sessionIds) : Promise.resolve({ data: [], error: null }),
    sessionIds.length ? supabase.from('participant_roster').select('*').in('training_session_id', sessionIds) : Promise.resolve({ data: [], error: null }),
    invoiceIds.length ? supabase.from('payments').select('*').in('invoice_id', invoiceIds).order('payment_date', { ascending: false }) : Promise.resolve({ data: [], error: null }),
  ])

  const participantCounts = (countsResult.data ?? []) as ParticipantCount[]
  const roster = (rosterResult.data ?? []) as ParticipantRoster[]
  const payments = (paymentsResult.data ?? []) as Payment[]

  const countsBySession = new Map<string, { total: number; bumi: number; non: number }>()
  for (const row of participantCounts) {
    const current = countsBySession.get(row.training_session_id) ?? { total: 0, bumi: 0, non: 0 }
    current.total += Number(row.workshop_count ?? 0) + Number(row.training_count ?? 0)
    current.bumi += Number(row.bumiputera_count ?? 0)
    current.non += Number(row.non_bumiputera_count ?? 0)
    countsBySession.set(row.training_session_id, current)
  }

  const rosterBySession = new Map<string, { certified: number; attended: number; bumi: number; non: number }>()
  for (const row of roster) {
    const current = rosterBySession.get(row.training_session_id) ?? { certified: 0, attended: 0, bumi: 0, non: 0 }
    if (row.participation_type === 'CERTIFIED') current.certified += 1
    if (row.participation_type === 'ATTENDED') current.attended += 1
    if (row.is_bumiputera === true) current.bumi += 1
    if (row.is_bumiputera === false) current.non += 1
    rosterBySession.set(row.training_session_id, current)
  }

  const securedValue = purchaseOrders.reduce((sum, row) => sum + Number(row.po_value ?? 0), 0)
  const invoicedValue = invoices.reduce((sum, row) => sum + Number(row.total_value ?? 0), 0)
  const paymentsByInvoice = new Map<string, Payment[]>()
  for (const payment of payments) {
    const list = paymentsByInvoice.get(payment.invoice_id) ?? []
    list.push(payment)
    paymentsByInvoice.set(payment.invoice_id, list)
  }

  return (
    <main className="space-y-6 p-6">
      <a href="/dashboard/programs" className="text-sm text-blue-600">← Program list</a>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-blue-600">{program.program_code}</div>
              <h1 className="mt-1 text-2xl font-bold">{program.title}</h1>
              <p className="mt-1 text-slate-500">{company?.canonical_name ?? '—'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={stageClass(program.current_stage)}>{program.current_stage?.replaceAll('_', ' ') ?? 'UNKNOWN'}</Badge>
              {program.needs_review ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">Needs Review</Badge> : null}
              <Badge>{program.category ?? 'Uncategorized'}</Badge>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg bg-slate-50 p-4"><div className="text-xs text-slate-500">Forecast</div><div className="mt-1 font-semibold">{money(program.forecast_value)}</div></div>
            <div className="rounded-lg bg-slate-50 p-4"><div className="text-xs text-slate-500">Weighted</div><div className="mt-1 font-semibold">{money(program.weighted_value)}</div></div>
            <div className="rounded-lg bg-slate-50 p-4"><div className="text-xs text-slate-500">Secured (PO)</div><div className="mt-1 font-semibold">{money(securedValue)}</div></div>
            <div className="rounded-lg bg-slate-50 p-4"><div className="text-xs text-slate-500">Invoiced</div><div className="mt-1 font-semibold">{money(invoicedValue)}</div></div>
            <div className="rounded-lg bg-slate-50 p-4"><div className="text-xs text-slate-500">Lead Date</div><div className="mt-1 font-semibold">{date(program.lead_date)}</div></div>
          </div>
          <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
            <div>Client category: <span className="text-slate-700">{program.client_category ?? '—'}</span></div>
            <div>Sector: <span className="text-slate-700">{program.sector ?? '—'}</span></div>
            <div>Source: <span className="text-slate-700">{program.source_file ?? program.source_sheet ?? '—'}{program.source_row ? ` (row ${program.source_row})` : ''}</span></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Quotations</p><p className="mt-2 text-2xl font-bold">{quotations.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Purchase Orders</p><p className="mt-2 text-2xl font-bold">{purchaseOrders.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Invoices</p><p className="mt-2 text-2xl font-bold">{invoices.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Payments</p><p className="mt-2 text-2xl font-bold">{payments.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Training Sessions</p><p className="mt-2 text-2xl font-bold">{trainingSessions.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Pipeline History</CardTitle></CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="p-3 text-left">Stage</th><th className="p-3 text-left">Changed At</th><th className="p-3 text-left">Source</th><th className="p-3 text-left">Note</th></tr>
              </thead>
              <tbody>
                {pipeline.map((row) => (
                  <tr key={row.id} className="border-t transition-colors hover:bg-slate-50">
                    <td className="p-3"><Badge className={stageClass(row.stage)}>{row.stage}</Badge></td>
                    <td className="p-3">{date(row.changed_at)}</td>
                    <td className="p-3">{row.source_system ?? '—'}</td>
                    <td className="max-w-[320px] truncate p-3">{row.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pipeline.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Tiada rekod perubahan stage.</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Quotations</CardTitle></CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="p-3 text-left">No</th><th className="p-3 text-left">Date</th><th className="p-3 text-right">Final Price</th><th className="p-3 text-left">Status</th></tr>
                </thead>
                <tbody>
                  {quotations.map((row) => (
                    <tr key={row.id} className="border-t transition-colors hover:bg-slate-50">
                      <td className="p-3">{row.quotation_no_raw}</td>
                      <td className="p-3">{date(row.quotation_date)}</td>
                      <td className="p-3 text-right tabular-nums">{money(row.final_price)}</td>
                      <td className="p-3"><Badge>{row.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {quotations.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Tiada quotation.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Purchase Orders</CardTitle></CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="p-3 text-left">PO No</th><th className="p-3 text-left">Date</th><th className="p-3 text-right">Value</th></tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((row) => (
                    <tr key={row.id} className="border-t transition-colors hover:bg-slate-50">
                      <td className="p-3">{row.po_no ?? '—'}</td>
                      <td className="p-3">{date(row.po_date)}</td>
                      <td className="p-3 text-right tabular-nums">{money(row.po_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {purchaseOrders.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Tiada purchase order.</p> : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Invoices &amp; Payments</CardTitle></CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="p-3 text-left">Invoice</th><th className="p-3 text-left">Date</th><th className="p-3 text-right">Total</th><th className="p-3 text-left">Due</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Payments</th></tr>
              </thead>
              <tbody>
                {invoices.map((row) => {
                  const invoicePayments = paymentsByInvoice.get(row.id) ?? []
                  return (
                    <tr key={row.id} className="border-t transition-colors hover:bg-slate-50">
                      <td className="p-3 font-medium">{row.invoice_no}</td>
                      <td className="p-3">{date(row.invoice_date)}</td>
                      <td className="p-3 text-right tabular-nums">{money(row.total_value)}</td>
                      <td className="p-3">{date(row.due_date)}</td>
                      <td className="p-3"><Badge className={paymentClass(row.payment_status)}>{row.payment_status}</Badge></td>
                      <td className="p-3">
                        {invoicePayments.length === 0 ? '—' : invoicePayments.map((payment) => (
                          <div key={payment.id} className="text-xs">RM {Number(payment.amount).toLocaleString('en-MY')} · {date(payment.payment_date)}</div>
                        ))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {invoices.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Tiada invoice.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Training Sessions &amp; Roster</CardTitle></CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="p-3 text-left">Session</th><th className="p-3 text-left">Type</th><th className="p-3 text-left">Dates</th><th className="p-3 text-right">Days</th><th className="p-3 text-left">Status</th><th className="p-3 text-right">Reported Total</th><th className="p-3 text-right">Certified</th><th className="p-3 text-right">Attended</th><th className="p-3 text-right">Roster Bumi/Non</th></tr>
              </thead>
              <tbody>
                {trainingSessions.map((session) => {
                  const counts = countsBySession.get(session.id)
                  const roster = rosterBySession.get(session.id)
                  return (
                    <tr key={session.id} className="border-t transition-colors hover:bg-slate-50">
                      <td className="max-w-[300px] truncate p-3">{session.session_title}</td>
                      <td className="p-3">{session.session_type ?? '—'}</td>
                      <td className="p-3">{date(session.start_date)}{session.end_date && session.end_date !== session.start_date ? ` → ${date(session.end_date)}` : ''}</td>
                      <td className="p-3 text-right tabular-nums">{session.duration_days ?? '—'}</td>
                      <td className="p-3"><Badge className={session.r2_status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : session.r2_status === 'PENDING_DATA' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-blue-200 bg-blue-50 text-blue-700'}>{session.r2_status}</Badge></td>
                      <td className="p-3 text-right tabular-nums">{counts?.total ?? '—'}</td>
                      <td className="p-3 text-right tabular-nums">{roster?.certified ?? '—'}</td>
                      <td className="p-3 text-right tabular-nums">{roster?.attended ?? '—'}</td>
                      <td className="p-3 text-right tabular-nums">{roster ? `${roster.bumi}/${roster.non}` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {trainingSessions.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Tiada training session untuk program ini.</p> : null}
        </CardContent>
      </Card>
    </main>
  )
}
