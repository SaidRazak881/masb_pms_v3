import * as XLSX from 'xlsx'
import { createHash } from 'node:crypto'
import type { Json } from '@/types/database'

type Cell = string | number | boolean | Date | null

export type NormalizedQuotation = {
  quotation_number: string | null
  revision_number: number | null
  company_name: string | null
  project_title: string | null
  quotation_date: string | null
  quotation_status: string | null
  payment_status: string | null
  price_values: Record<string, number | null>
}

export type ParsedQuotationRow = {
  source_row_number: number
  raw_data: Json
  normalized_data: NormalizedQuotation
  row_hash: string
  validation_status: 'PENDING' | 'VALID' | 'WARNING' | 'ERROR'
  error_message: string | null
  warning_message: string | null
}

const ALIASES = {
  quotation_number: ['quotation no', 'quotation number', 'quotation_no', 'quotation_number', 'quote no', 'quote number', 'quote no.'],
  revision_number: ['revision', 'revision no', 'revision number', 'revision_no', 'rev', 'rev no', 'version'],
  company_name: ['company', 'company name', 'customer', 'customer name', 'client', 'client name'],
  project_title: ['project', 'project title', 'project name', 'title', 'project_title'],
  quotation_date: ['quotation date', 'quotation_date', 'quote date', 'date', 'date of quotation'],
  quotation_status: ['quotation status', 'quotation_status', 'quote status', 'status'],
  payment_status: ['payment status', 'payment_status', 'collection status', 'payment'],
  price_values: ['price', 'quotation value', 'quotation amount', 'quoted price', 'total', 'total value', 'amount', 'value', 'selling price'],
} as const

const canonicalize = (value: Cell): string => String(value ?? '').trim().toLowerCase().replace(/[\u0000-\u001f]/g, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ')
const text = (value: Cell): string | null => { const v = String(value ?? '').trim().replace(/\s+/g, ' '); return v || null }
const identifier = (value: Cell): string | null => { const v = text(value); return v ? v.toUpperCase() : null }
const numberValue = (value: Cell): number | null => {
  if (value === null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const parsed = Number(String(value).replace(/[(),\sRM$€£]/gi, '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}
const revision = (value: Cell): number | null => {
  const v = text(value)
  if (!v) return null
  const match = v.match(/(?:rev(?:ision)?\s*)?([0-9]+)/i)
  return match ? Number(match[1]) : null
}
const excelDate = (value: Cell): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString()
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = XLSX.SSF.parse_date_code(value)
    return d ? new Date(Date.UTC(d.y, d.m - 1, d.d, d.H ?? 0, d.M ?? 0, Math.floor(d.S ?? 0))).toISOString() : null
  }
  const v = text(value); if (!v) return null
  const parsed = Date.parse(v); return Number.isNaN(parsed) ? null : new Date(parsed).toISOString()
}
const find = (headers: string[], aliases: readonly string[]): number | null => {
  for (const alias of aliases) { const i = headers.indexOf(canonicalize(alias)); if (i >= 0) return i }
  return null
}
const rowJson = (headers: string[], cells: readonly Cell[]): Json => {
  const result: Record<string, Json> = {}
  headers.forEach((header, i) => {
    if (!header) return
    const value = cells[i] ?? null
    result[header] = value instanceof Date ? value.toISOString() : value
  })
  return result
}
const hashRow = (value: NormalizedQuotation, row: number): string => createHash('sha256').update(JSON.stringify({ row, value })).digest('hex')

const VALID_STATUSES = new Set(['DRAFT', 'SUBMITTED', 'SENT', 'PENDING', 'APPROVED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'WON', 'LOST', 'CLOSED', 'OPEN'])

export class QuotationParser {
  parse(buffer: Buffer): ParsedQuotationRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: true })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error('QUOTATION_WORKBOOK_HAS_NO_SHEETS')
    const matrix = XLSX.utils.sheet_to_json<Cell[]>(workbook.Sheets[sheetName], { header: 1, defval: null, raw: true })
    const headerIndex = matrix.findIndex(row => row.some(cell => ['quotation no', 'quotation number', 'quote no', 'quote number'].includes(canonicalize(cell))))
    if (headerIndex < 0) throw new Error('QUOTATION_HEADER_NOT_FOUND')
    const headers = (matrix[headerIndex] ?? []).map(canonicalize)
    const indexes = {
      quotation_number: find(headers, ALIASES.quotation_number), revision_number: find(headers, ALIASES.revision_number),
      company_name: find(headers, ALIASES.company_name), project_title: find(headers, ALIASES.project_title),
      quotation_date: find(headers, ALIASES.quotation_date), quotation_status: find(headers, ALIASES.quotation_status),
      payment_status: find(headers, ALIASES.payment_status),
    }
    const priceIndexes = new Map<string, number>()
    for (const alias of ALIASES.price_values) { const i = find(headers, [alias]); if (i !== null) priceIndexes.set(canonicalize(alias), i) }
    const seen = new Map<string, Set<number | null>>()
    const rows: ParsedQuotationRow[] = []
    for (let i = headerIndex + 1; i < matrix.length; i += 1) {
      const cells = matrix[i] ?? []
      if (cells.every(cell => text(cell) === null)) continue
      const normalized: NormalizedQuotation = {
        quotation_number: indexes.quotation_number === null ? null : identifier(cells[indexes.quotation_number]),
        revision_number: indexes.revision_number === null ? null : revision(cells[indexes.revision_number]),
        company_name: indexes.company_name === null ? null : text(cells[indexes.company_name]),
        project_title: indexes.project_title === null ? null : text(cells[indexes.project_title]),
        quotation_date: indexes.quotation_date === null ? null : excelDate(cells[indexes.quotation_date]),
        quotation_status: indexes.quotation_status === null ? null : text(cells[indexes.quotation_status])?.toUpperCase() ?? null,
        payment_status: indexes.payment_status === null ? null : text(cells[indexes.payment_status])?.toUpperCase() ?? null,
        price_values: {},
      }
      for (const [name, index] of priceIndexes) normalized.price_values[name] = numberValue(cells[index])
      const errors: string[] = []
      const warnings: string[] = []
      const key = normalized.quotation_number
      if (!key) errors.push('MISSING_QUOTATION_NUMBER')
      else {
        const revisions = seen.get(key) ?? new Set<number | null>()
        if (revisions.size > 0) errors.push('DUPLICATE_QUOTATION_NUMBER')
        if (revisions.size > 0 && !revisions.has(normalized.revision_number)) errors.push('REVISION_MISMATCH')
        revisions.add(normalized.revision_number); seen.set(key, revisions)
      }
      if (!normalized.company_name) errors.push('MISSING_COMPANY')
      if (normalized.quotation_status && !VALID_STATUSES.has(normalized.quotation_status)) errors.push('INVALID_STATUS')
      else if (!normalized.quotation_status) warnings.push('MISSING_QUOTATION_STATUS')
      rows.push({ source_row_number: i + 1, raw_data: rowJson(headers, cells), normalized_data: normalized, row_hash: hashRow(normalized, i + 1), validation_status: errors.length ? 'ERROR' : warnings.length ? 'WARNING' : 'VALID', error_message: errors.length ? errors.join('; ') : null, warning_message: warnings.length ? warnings.join('; ') : null })
    }
    return rows
  }
}

export const quotationParser = new QuotationParser()
