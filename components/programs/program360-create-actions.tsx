'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { getProgramMutationSnapshot } from '@/lib/actions/program-mutations'
import { RecordCreateDialog } from '@/components/data/record-create-dialog'
import { Button } from '@/components/ui/button'
import type { Row } from '@/types/database'

const quotationStatus = ['DRAFT', 'SENT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'].map((value) => ({ value, label: value }))
const paymentStatus = ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE'].map((value) => ({ value, label: value }))
const r2Status = ['COMPLETED', 'PENDING_DATA', 'UPCOMING'].map((value) => ({ value, label: value.replaceAll('_', ' ') }))
const participationType = ['CERTIFIED', 'ATTENDED'].map((value) => ({ value, label: value }))
const weekOptions = ['week1', 'week2'].map((value) => ({ value, label: value.replace('week', 'Week ') }))

export function Program360CreateActions() {
  const pathname = usePathname()
  const [snapshot, setSnapshot] = useState<any>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!pathname.startsWith('/dashboard/programs/')) return
    const code = decodeURIComponent(pathname.split('/').pop() ?? '')
    if (!code) return
    startTransition(async () => {
      const result = await getProgramMutationSnapshot(code)
      if (result.ok) setSnapshot(result)
    })
  }, [pathname])

  if (!snapshot?.canEdit) return null

  const program = snapshot.program as Row<'programs'>
  const quotations = snapshot.quotations as Row<'quotations'>[]
  const purchaseOrders = snapshot.purchaseOrders as Row<'purchase_orders'>[]
  const invoices = snapshot.invoices as Row<'invoices'>[]
  const trainingSessions = snapshot.trainingSessions as Row<'training_sessions'>[]

  const latestQuotation = quotations[0]
  const latestPo = purchaseOrders[0]
  const latestInvoice = invoices[0]
  const latestSession = trainingSessions[0]

  return <div className="fixed bottom-5 left-5 z-40">
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
      <span className="hidden px-2 text-[11px] font-semibold text-slate-500 sm:inline">Add data</span>
      <RecordCreateDialog
        table="quotations"
        title={`New Quotation for ${program.program_code}`}
        triggerLabel="Quotation"
        initialValues={{ program_id: program.id }}
        hiddenFields={['program_id']}
        fields={[
          { key: 'program_id', label: 'Program', required: true },
          { key: 'quotation_no_raw', label: 'Quotation No', required: true },
          { key: 'quotation_date', label: 'Quotation Date', type: 'date' },
          { key: 'duration_days', label: 'Duration (Days)', type: 'number' },
          { key: 'no_of_unit', label: 'No. of Units', type: 'number' },
          { key: 'unit_price_excl_sst', label: 'Unit Price Excl. SST', type: 'number', step: '0.01' },
          { key: 'final_price', label: 'Final Price', type: 'number', step: '0.01' },
          { key: 'status', label: 'Status', type: 'select', options: quotationStatus },
          { key: 'prepared_by', label: 'Prepared By' },
        ]}
      />

      <RecordCreateDialog
        table="purchase_orders"
        title={`New Purchase Order for ${program.program_code}`}
        triggerLabel="PO"
        initialValues={{ program_id: program.id, quotation_id: latestQuotation?.id ?? null }}
        hiddenFields={['program_id', 'quotation_id']}
        fields={[
          { key: 'program_id', label: 'Program', required: true },
          { key: 'quotation_id', label: 'Quotation' },
          { key: 'po_no', label: 'PO No' },
          { key: 'po_date', label: 'PO Date', type: 'date' },
          { key: 'po_value', label: 'PO Value', type: 'number', step: '0.01' },
        ]}
      />

      <RecordCreateDialog
        table="invoices"
        title={`New Invoice for ${program.program_code}`}
        triggerLabel="Invoice"
        initialValues={{ program_id: program.id, quotation_id: latestQuotation?.id ?? null, po_id: latestPo?.id ?? null }}
        hiddenFields={['program_id', 'quotation_id', 'po_id']}
        fields={[
          { key: 'program_id', label: 'Program', required: true },
          { key: 'quotation_id', label: 'Quotation' },
          { key: 'po_id', label: 'Purchase Order' },
          { key: 'invoice_no', label: 'Invoice No', required: true },
          { key: 'invoice_date', label: 'Invoice Date', type: 'date' },
          { key: 'invoice_value_excl_sst', label: 'Value Excl. SST', type: 'number', step: '0.01' },
          { key: 'sst_amount', label: 'SST Amount', type: 'number', step: '0.01' },
          { key: 'payment_terms_days', label: 'Payment Terms (Days)', type: 'number' },
          { key: 'payment_status', label: 'Payment Status', type: 'select', options: paymentStatus },
          { key: 'pic', label: 'PIC' },
          { key: 'remark', label: 'Remark', fullWidth: true },
        ]}
      />

      <RecordCreateDialog
        table="payments"
        title="New Payment"
        triggerLabel="Payment"
        initialValues={{ invoice_id: latestInvoice?.id ?? null }}
        hiddenFields={['invoice_id']}
        fields={[
          { key: 'invoice_id', label: 'Invoice', required: true },
          { key: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
          { key: 'payment_date', label: 'Payment Date', type: 'date' },
          { key: 'method', label: 'Method' },
          { key: 'reference_no', label: 'Reference No' },
        ]}
      />

      <RecordCreateDialog
        table="cost_of_sales"
        title="New Cost of Sales"
        triggerLabel="Cost"
        initialValues={{ invoice_id: latestInvoice?.id ?? null, invoice_no: latestInvoice?.invoice_no ?? null }}
        hiddenFields={['invoice_id', 'invoice_no']}
        fields={[
          { key: 'invoice_id', label: 'Invoice', required: true },
          { key: 'invoice_no', label: 'Invoice No' },
          { key: 'invoice_value', label: 'Invoice Value', type: 'number', step: '0.01' },
          { key: 'collection', label: 'Collection', type: 'number', step: '0.01' },
          { key: 'cost_of_sales_amount', label: 'Cost of Sales Amount', type: 'number', step: '0.01', required: true },
          { key: 'mimos_academy_cost', label: 'MIMOS Academy Cost', type: 'number', step: '0.01', required: true },
          { key: 'commission', label: 'Commission', type: 'number', step: '0.01', required: true },
          { key: 'bro_incentive', label: 'BRO Incentive', type: 'number', step: '0.01', required: true },
          { key: 'net_profit', label: 'Net Profit', type: 'number', step: '0.01' },
          { key: 'profit_percentage', label: 'Profit Percentage', type: 'number', step: '0.01' },
          { key: 'had_formula_error', label: 'Formula Error', type: 'checkbox' },
        ]}
      />

      <RecordCreateDialog
        table="training_sessions"
        title={`New Training Session for ${program.program_code}`}
        triggerLabel="Training"
        initialValues={{ program_id: program.id }}
        hiddenFields={['program_id']}
        fields={[
          { key: 'program_id', label: 'Program', required: true },
          { key: 'session_title', label: 'Session Title', required: true },
          { key: 'session_type', label: 'Session Type' },
          { key: 'start_date', label: 'Start Date', type: 'date' },
          { key: 'end_date', label: 'End Date', type: 'date' },
          { key: 'venue', label: 'Venue' },
          { key: 'duration_days', label: 'Duration (Days)', type: 'number' },
          { key: 'r2_status', label: 'R2 Status', type: 'select', options: r2Status },
        ]}
      />

      <RecordCreateDialog
        table="participant_counts"
        title="New Participant Count"
        triggerLabel="Counts"
        initialValues={{ training_session_id: latestSession?.id ?? null }}
        hiddenFields={['training_session_id']
        }
        fields={[
          { key: 'training_session_id', label: 'Training Session', required: true },
          { key: 'category', label: 'Category' },
          { key: 'workshop_count', label: 'Workshop Count', type: 'number' },
          { key: 'training_count', label: 'Training Count', type: 'number' },
          { key: 'bumiputera_count', label: 'Bumiputera Count', type: 'number' },
          { key: 'non_bumiputera_count', label: 'Non-Bumiputera Count', type: 'number' },
        ]}
      />

      <RecordCreateDialog
        table="participant_roster"
        title="New Participant"
        triggerLabel="Participant"
        initialValues={{ training_session_id: latestSession?.id ?? null }}
        hiddenFields={['training_session_id']}
        fields={[
          { key: 'training_session_id', label: 'Training Session', required: true },
          { key: 'full_name', label: 'Full Name', required: true },
          { key: 'cert_no', label: 'Certificate No' },
          { key: 'is_bumiputera', label: 'Bumiputera', type: 'checkbox' },
          { key: 'participation_type', label: 'Participation Type', type: 'select', options: participationType },
          { key: 'week_label', label: 'Week', type: 'select', options: weekOptions },
          { key: 'attendance_date', label: 'Attendance Date', type: 'date' },
        ]}
      />
    </div>
  </div>
}
