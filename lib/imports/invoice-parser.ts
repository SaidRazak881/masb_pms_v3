import * as XLSX from 'xlsx'
import { createHash } from 'node:crypto'
import type { Json } from '@/types/database'

export type NormalizedInvoice = {
  invoice_number: string | null
  company_name: string | null
  quotation_number: string | null
  po_number: string | null
  invoice_date: string | null
  payment_date: string | null
  payment_status: string | null
  monetary_values: Record<string, number | null>
}

export type ParsedInvoiceRow = {
  source_row_number: number
  raw_data: Json
  normalized_data: NormalizedInvoice
  row_hash: string
  validation_status: 'PENDING' | 'VALID' | 'WARNING' | 'ERROR'
  error_message: string | null
  warning_message: string | null
}

type Cell = string | number | boolean | Date | null

type HeaderMap = Map<string, number>

const HEADER_ALIASES: Record<keyof NormalizedInvoice, readonly string[]> = {
  invoice_number: ['invoice no', 'invoice number', 'invoice_no', 'invoice_number', 'inv no', 'inv number'],
  company_name: ['company', 'company name', 'customer', 'client', 'customer name', 'company_name'],
  quotation_number: ['quotation no', 'quotation number', 'quotation_no', 'quotation_number', 'quote no', 'quotation'],
  po_number: ['po no', 'po number', 'po_no', 'po_number', 'purchase order no', 'purchase order number'],
  invoice_date: ['invoice date', 'invoice_date', 'inv date', 'date of invoice'],
  payment_date: ['payment date', 'payment_date', 'paid date', 'date paid', 'collection date'],
  payment_status: ['payment status', 'payment_status', 'status', 'collection status'],
  monetary_values: ['invoice value', 'invoice amount', 'invoice value excl sst', 'sst amount', 'total value', 'amount', 'collection', 'paid amount', 'balance', 'outstanding', 'overdue amount'],
}

const canonicalizeHeader = (value: Cell): string => String(value ?? '').trim().toLowerCase().replace(/[\u0000-\u001f]/g, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ')

const normalizeText = (value: Cell): string | null => {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ')
  return text.length > 0 ? text : null
}

const normalizeIdentifier = (value: Cell): string | null => {
  const text = normalizeText(value)
  return text ? text.toUpperCase() : null
}

const parseMoney = (value: Cell): number | null => {
  if (value === null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const text = String(value).trim()
  if (!text) return null
  const negative = /^\(.*\)$/.test(text)
  const cleaned = text.replace(/[(),\sRM$€£]/gi, '').replace(/,/g, '')
  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) return null
  return negative ? -Math.abs(parsed) : parsed
}

const excelDateToIso = (value: Cell): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString()
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = XLSX.SSF.parse_date_code(value)
    if (!date) return null
    const utc = new Date(Date.UTC(date.y, date.m - 1, date.d, date.H ?? 0, date.M ?? 0, Math.floor(date.S ?? 0)))
    return Number.isNaN(utc.getTime()) ? null : utc.toISOString()
  }
  const text = normalizeText(value)
  if (!text) return null
  const timestamp = Date.parse(text)
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString()
}

const findHeader = (headers: readonly string[], aliases: readonly string[]): number | null => {
  for (const alias of aliases) {
    const index = headers.indexOf(canonicalizeHeader(alias))
    if (index >= 0) return index
  }
  return null
}

const rowToJson = (headers: readonly string[], cells: readonly Cell[]): Json => {
  const result: Record<string, Json> = {}
  headers.forEach((header, index) => {
    if (!header) return
    const value = cells[index] ?? null
    if (value instanceof Date) result[header] = value.toISOString()
    else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) result[header] = value
    else result[header] = String(value)
  })
  return result
}

const hashRow = (value: NormalizedInvoice, sourceRowNumber: number): string => createHash('sha256').update(JSON.stringify({ sourceRowNumber, value })).digest('hex')

export class InvoiceParser {
  parse(buffer: Buffer): ParsedInvoiceRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: true })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error('INVOICE_WORKBOOK_HAS_NO_SHEETS')
    const sheet = workbook.Sheets[sheetName]
    const matrix = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: null, raw: true })
    if (matrix.length === 0) return []

    const headerIndex = matrix.findIndex((row) => row.some((cell) => canonicalizeHeader(cell) === 'invoice no' || canonicalizeHeader(cell) === 'invoice number'))
    if (headerIndex < 0) throw new Error('INVOICE_HEADER_NOT_FOUND')

    const headerCells = matrix[headerIndex] ?? []
    const headers = headerCells.map(canonicalizeHeader)
    const indexes = {
      invoice_number: findHeader(headers, HEADER_ALIASES.invoice_number),
      company_name: findHeader(headers, HEADER_ALIASES.company_name),
      quotation_number: findHeader(headers, HEADER_ALIASES.quotation_number),
      po_number: findHeader(headers, HEADER_ALIASES.po_number),
      invoice_date: findHeader(headers, HEADER_ALIASES.invoice_date),
      payment_date: findHeader(headers, HEADER_ALIASES.payment_date),
      payment_status: findHeader(headers, HEADER_ALIASES.payment_status),
    }

    const monetaryIndexes = new Map<string, number>()
    for (const alias of HEADER_ALIASES.monetary_values) {
      const index = findHeader(headers, [alias])
      if (index !== null) monetaryIndexes.set(canonicalizeHeader(alias), index)
    }

    const rows: ParsedInvoiceRow[] = []
    for (let index = headerIndex + 1; index < matrix.length; index += 1) {
      const cells = matrix[index] ?? []
      if (cells.every((cell) => normalizeText(cell) === null)) continue

      const normalized: NormalizedInvoice = {
        invoice_number: indexes.invoice_number === null ? null : normalizeIdentifier(cells[indexes.invoice_number]),
        company_name: indexes.company_name === null ? null : normalizeText(cells[indexes.company_name]),
        quotation_number: indexes.quotation_number === null ? null : normalizeIdentifier(cells[indexes.quotation_number]),
        po_number: indexes.po_number === null ? null : normalizeIdentifier(cells[indexes.po_number]),
        invoice_date: indexes.invoice_date === null ? null : excelDateToIso(cells[indexes.invoice_date]),
        payment_date: indexes.payment_date === null ? null : excelDateToIso(cells[indexes.payment_date]),
        payment_status: indexes.payment_status === null ? null : normalizeText(cells[indexes.payment_status])?.toUpperCase() ?? null,
        monetary_values: {},
      }
      for (const [name, cellIndex] of monetaryIndexes) normalized.monetary_values[name] = parseMoney(cells[cellIndex])

      const errors: string[] = []
      const warnings: string[] = []
      if (!normalized.invoice_number) errors.push('Missing invoice number')
      if (!normalized.company_name) warnings.push('Missing company name')
      if (!normalized.invoice_date) warnings.push('Missing or invalid invoice date')
      const rawData = rowToJson(headers, cells)
      rows.push({
        source_row_number: index + 1,
        raw_data: rawData,
        normalized_data: normalized,
        row_hash: hashRow(normalized, index + 1),
        validation_status: errors.length > 0 ? 'ERROR' : warnings.length > 0 ? 'WARNING' : 'VALID',
        error_message: errors.length > 0 ? errors.join('; ') : null,
        warning_message: warnings.length > 0 ? warnings.join('; ') : null,
      })
    }
    return rows
  }
}

export const invoiceParser = new InvoiceParser()
