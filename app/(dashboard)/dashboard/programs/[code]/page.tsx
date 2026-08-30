import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChainStepper, type ChainStepItem } from '@/components/programs/chain-stepper'
import type { Row } from '@/types/database'

export const dynamic = 'force-dynamic'

type Program = Row<'programs'>
type Quotation = Row<'quotations'>
type PurchaseOrder = Row<'purchase_orders'>
type Invoice = Row<'invoices'>
type Payment = Row<'payments'>
type TrainingSession = Row<'training_sessions'>

type Company = Row<'companies'>

const money = (value: number | null | undefined) => `RM ${Number(value ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`
const date = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString('en-MY') : '—'

function stageClass(stage: string | null) {
  switch (stage?.toUpperCase()) {
    case 'PAID':
    case 'TRAINING_COMPLETED': return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'LOST': return 'border-rose-200 bg-rose-50 text-rose-700'
    case 'PO_RECEIVED':
    case 'INVOICED': return 'border-blue-200 bg-blue-50 text-blue-700'
    default: return 'border-amber-200 bg-amber-50 text-amber-700'
  }
}

function paymentClass(status: string | null) {
  switch (status?.toUpperCase()) {
    case 'PAID': return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'PARTIAL': return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'OVERDUE': return 'border-rose-200 bg-rose-50 text-rose-700'
    default: return 'border-amber-200 bg-amber-50 text-amber-700'
  }
}

export default async function Program360({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const programResult = await supabase.from('programs').select('*').eq('program_code', code).single()
  if (programResult.error || !programResult.data) notFound()

  const program = programResult.data as Program
  const [companyResult, quotationsResult, purchaseOrdersResult, invoicesResult, trainingResult] = await Promise.all([
    supabase.from('companies').select('*').eq('id', program.company_id).single(),
    supabase.from('quotations').select('*').eq('program_id', program.id).order('quotation_date', { ascending: false }),
    supabase.from('purchase_orders').select('*').eq('program_id', program.id).order('po_date', { ascending: false }),
    supabase.from('invoices').select('*').eq('program_id', program.id).order('invoice_date', { ascending: false }),
    supabase.from('training_sessions').select('*').eq('program_id', program.id).order('start_date', { ascending: false }),
  ])

  const company = companyResult.data as Company | null
  const quotations = (quotationsResult.data ?? []) as Quotation[]
  const purchaseOrders = (purchaseOrdersResult.data ?? []) as PurchaseOrder[]
  const invoices = (invoicesResult.data ?? []) as Invoice[]
  const trainingSessions = (trainingResult.data ?? []) as TrainingSession[]
  const invoiceIds = invoices.map(invoice => invoice.id)
  const paymentsResult = invoiceIds.length
    ? await supabase.from('payments').select('*').in('invoice_id', invoiceIds).order('payment_date', { ascending: false })
    : { data: [], error: null }
  const payments = (paymentsResult.data ?? []) as Payment[]

  const securedValue = purchaseOrders.reduce((sum, row) => sum + Number(row.po_value ?? 0), 0)
  const invoicedValue = invoices.reduce((sum, row) => sum + Number(row.total_value ?? 0), 0)
  const collectedValue = payments.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const latestQuotation = quotations[0]
  const latestPO = purchaseOrders[0]
  const latestInvoice = invoices[0]
  const latestPayment = payments[0]
  const latestTraining = trainingSessions[0]

  const steps: ChainStepItem[] = [
    { id: 'pipeline', title: 'Pipeline', subtitle: program.current_stage?.replaceAll('_', ' ') || 'Program created', date: date(program.lead_date), state: program.current_stage === 'LOST' ? 'warning' : 'completed', amount: Number(program.forecast_value ?? 0) },
    { id: 'quotation', title: 'Sebut Harga', subtitle: latestQuotation ? undefined : 'Belum Dijana', docNo: latestQuotation?.quotation_no_raw, date: date(latestQuotation?.quotation_date), state: latestQuotation ? 'completed' : 'pending', amount: Number(latestQuotation?.final_price ?? 0) },
    { id: 'po', title: 'Purchase Order', subtitle: latestPO ? undefined : 'Belum Diterima', docNo: latestPO?.po_no, date: date(latestPO?.po_date), state: latestPO ? 'completed' : 'pending', amount: Number(latestPO?.po_value ?? 0) },
    { id: 'invoice', title: 'Invois', subtitle: latestInvoice ? undefined : 'Belum Dijana', docNo: latestInvoice?.invoice_no, date: date(latestInvoice?.invoice_date), state: latestInvoice?.payment_status === 'OVERDUE' ? 'warning' : latestInvoice ? 'completed' : 'pending', amount: Number(latestInvoice?.total_value ?? 0) },
    { id: 'payment', title: 'Bayaran', subtitle: latestPayment ? 'Kutipan direkodkan' : latestInvoice ? 'Menunggu kutipan' : 'Menunggu invois', date: date(latestPayment?.payment_date), state: latestPayment ? 'completed' : latestInvoice ? 'current' : 'pending', amount: collectedValue },
    { id: 'training', title: 'Latihan', subtitle: latestTraining?.session_title || 'Belum dijadualkan', date: date(latestTraining?.start_date), state: latestTraining ? (latestTraining.r2_status === 'COMPLETED' ? 'completed' : 'current') : 'pending' },
  ]

  return (
    <main className="space-y-6 p-6">
      <a href="/dashboard/programs" className="text-sm font-medium text-[#8E1B84] hover:underline">← Program list</a>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#8E1B84]">{program.program_code}</div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{program.title}</h1>
              <p className="mt-1 text-slate-500">{company?.canonical_name ?? '—'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={stageClass(program.current_stage)}>{program.current_stage?.replaceAll('_', ' ') ?? 'UNKNOWN'}</Badge>
              {program.needs_review ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">Needs Review</Badge> : null}
              <Badge>{program.category ?? 'Uncategorized'}</Badge>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Forecast</div><div className="mt-1 font-semibold tabular-nums">{money(program.forecast_value)}</div></div>
            <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Weighted</div><div className="mt-1 font-semibold tabular-nums">{money(program.weighted_value)}</div></div>
            <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Secured (PO)</div><div className="mt-1 font-semibold tabular-nums">{money(securedValue)}</div></div>
            <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Invoiced</div><div className="mt-1 font-semibold tabular-nums">{money(invoicedValue)}</div></div>
            <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Collected</div><div className="mt-1 font-semibold tabular-nums text-emerald-700">{money(collectedValue)}</div></div>
          </div>
        </CardContent>
      </Card>

      <ChainStepper steps={steps} />

      <div className="grid gap-4 md:grid-cols-5">
        {[['Quotations', quotations.length], ['Purchase Orders', purchaseOrders.length], ['Invoices', invoices.length], ['Payments', payments.length], ['Training Sessions', trainingSessions.length]].map(([label, value]) => (
          <Card key={String(label)}><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{value}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Invoices &amp; Payments</CardTitle></CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3 text-left">Invoice</th><th className="p-3 text-left">Date</th><th className="p-3 text-right">Total</th><th className="p-3 text-left">Due</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Payments</th></tr></thead>
              <tbody>
                {invoices.map(row => {
                  const invoicePayments = payments.filter(payment => payment.invoice_id === row.id)
                  return <tr key={row.id} className="border-t hover:bg-slate-50"><td className="p-3 font-medium">{row.invoice_no}</td><td className="p-3">{date(row.invoice_date)}</td><td className="p-3 text-right tabular-nums">{money(row.total_value)}</td><td className="p-3">{date(row.due_date)}</td><td className="p-3"><Badge className={paymentClass(row.payment_status)}>{row.payment_status}</Badge></td><td className="p-3">{invoicePayments.length ? invoicePayments.map(payment => <div key={payment.id} className="text-xs">{money(payment.amount)} · {date(payment.payment_date)}</div>) : '—'}</td></tr>
                })}
              </tbody>
            </table>
          </div>
          {!invoices.length ? <p className="py-6 text-center text-sm text-slate-500">Tiada invoice.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Training Sessions</CardTitle></CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[850px] text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3 text-left">Session</th><th className="p-3 text-left">Type</th><th className="p-3 text-left">Dates</th><th className="p-3 text-right">Days</th><th className="p-3 text-left">R2 Status</th></tr></thead><tbody>{trainingSessions.map(session => <tr key={session.id} className="border-t hover:bg-slate-50"><td className="p-3 font-medium">{session.session_title}</td><td className="p-3">{session.session_type ?? '—'}</td><td className="p-3">{date(session.start_date)}{session.end_date && session.end_date !== session.start_date ? ` → ${date(session.end_date)}` : ''}</td><td className="p-3 text-right tabular-nums">{session.duration_days ?? '—'}</td><td className="p-3"><Badge>{session.r2_status}</Badge></td></tr>)}</tbody></table></div>
          {!trainingSessions.length ? <p className="py-6 text-center text-sm text-slate-500">Tiada training session untuk program ini.</p> : null}
        </CardContent>
      </Card>
    </main>
  )
}
