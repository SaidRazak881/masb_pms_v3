import * as XLSX from 'xlsx'
import { createHash } from 'node:crypto'
import type { Json } from '@/types/database'
import { mapR3Stage } from '@/lib/imports/r3-config'

export interface SalesNormalized {
  row_no: number | null
  company_name: string
  project_title: string
  forecast_value: number | null
  weighted_value: number | null
  status_raw: string | null
  stage: string
  sector: string | null
  salesman: string | null
  year: number | null
  notes: string | null
}

export interface ParsedSalesRow {
  source_row_number: number
  raw_data: Json
  normalized_data: SalesNormalized
  row_hash: string
  validation_status: 'VALID' | 'WARNING' | 'ERROR'
  error_message: string | null
  warning_message: string | null
}

type Cell = string | number | boolean | Date | null

const toText = (value: Cell): string | null => {
  if (value === null || value === undefined) return null
  const text = String(value).trim().replace(/\s+/g, ' ').replace(/[ \t]+/g, ' ')
  return text.length > 0 ? text : null
}

const toNumber = (value: Cell): number | null => {
  if (value === null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const parsed = Number(String(value).replace(/[(),\sRM$€£]/gi, '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

const rowToJson = (headers: readonly string[], cells: readonly Cell[]): Json => {
  const result: Record<string, Json> = {}
  headers.forEach((header, i) => {
    if (header === null || header === undefined || String(header).trim() === '') return
    const key = String(header)
    const value = cells[i] ?? null
    result[key] = value instanceof Date ? value.toISOString() : value
  })
  return result
}

const hash = (obj: unknown): string => createHash('sha256').update(JSON.stringify(obj)).digest('hex')

export class SalesReportParser {
  parse(buffer: Buffer): ParsedSalesRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: true })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) return []
    const matrix = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: null, raw: true })
    const headerIndex = matrix.findIndex((row) => row.some((cell) => /client/i.test(String(cell ?? ''))))
    if (headerIndex < 0) return []
    const headers = (matrix[headerIndex] ?? []).map((cell) => String(cell ?? '').trim())
    const col = (alias: string[]): number => headers.findIndex((h) => alias.some((a) => h.toLowerCase().includes(a)))
    const idx = {
      no: col(['no']),
      client: col(['client']),
      project: col(['project']),
      forecast: col(['forecast']),
      weighted: col(['weighted']),
      status: col(['status']),
      sector: col(['sector']),
      salesman: col(['salesman']),
      year: col(['year']),
      notes: col(['notes']),
    }

    const rows: ParsedSalesRow[] = []
    for (let i = headerIndex + 1; i < matrix.length; i += 1) {
      const cells = matrix[i] ?? []
      const rowNo = toNumber(cells[idx.no])
      const client = toText(cells[idx.client])
      const title = toText(cells[idx.project])
      if (!client && !title) continue
      const statusRaw = toText(cells[idx.status])
      const normalized: SalesNormalized = {
        row_no: rowNo,
        company_name: client ?? 'MIMOS Academy',
        project_title: title ?? 'Unnamed Project',
        forecast_value: toNumber(cells[idx.forecast]),
        weighted_value: toNumber(cells[idx.weighted]),
        status_raw: statusRaw,
        stage: mapR3Stage(statusRaw),
        sector: toText(cells[idx.sector]),
        salesman: toText(cells[idx.salesman]),
        year: toNumber(cells[idx.year]) ? Math.floor(toNumber(cells[idx.year])!) : null,
        notes: toText(cells[idx.notes]),
      }
      const errors: string[] = []
      const warnings: string[] = []
      if (!client) errors.push('MISSING_COMPANY')
      if (!title) errors.push('MISSING_PROJECT_TITLE')
      rows.push({
        source_row_number: i + 1,
        raw_data: rowToJson(headers, cells),
        normalized_data: normalized,
        row_hash: hash({ sheet: sheetName, row: i + 1, normalized }),
        validation_status: errors.length ? 'ERROR' : warnings.length ? 'WARNING' : 'VALID',
        error_message: errors.length ? errors.join('; ') : null,
        warning_message: warnings.length ? warnings.join('; ') : null,
      })
    }
    return rows
  }
}

export const salesReportParser = new SalesReportParser()
