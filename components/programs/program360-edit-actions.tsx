'use client'

import { RecordEditDialog } from '@/components/data/record-edit-dialog'

type EditableRecord = Record<string, unknown> & { id: string }

type Props = {
  canEdit: boolean
  table: 'programs' | 'quotations' | 'purchase_orders' | 'invoices' | 'payments' | 'training_sessions' | 'participant_roster'
  record: EditableRecord
  title: string
  fields: Array<{
    key: string
    label: string
    type?: 'text' | 'number' | 'date' | 'select' | 'checkbox'
    placeholder?: string
    options?: Array<{ value: string; label: string }>
    step?: string
    required?: boolean
  }>
}

export function Program360EditActions({ canEdit, table, record, title, fields }: Props) {
  if (!canEdit) return null
  return <RecordEditDialog table={table} id={record.id} title={title} values={record} fields={fields} />
}
