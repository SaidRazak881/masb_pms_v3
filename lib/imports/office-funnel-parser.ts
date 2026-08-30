import * as XLSX from 'xlsx'
import { createHash } from 'node:crypto'
import type { Json } from '@/types/database'
import { mapOfficeStage } from '@/lib/imports/r3-config'

export interface OfficeNormalized {
  client: string
  service: string | null
  action_item: string
  pic: string | null
  pic_email: string | null
  due_date: string | null
  status_raw: string | null
  stage: string
  potential_revenue: number | null
  aging_days: number | null
  notes: string | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}

export interface ParsedOfficeRow {
  source_row_number: number
  raw_data: Json
  normalized_data: OfficeNormalized
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

const excelDate = (value: Cell): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = XLSX.SSF.parse_date_code(value)
    if (!date) return null
    const utc = new Date(Date.UTC(date.y, date.m - 1, date.d, date.H ?? 0, date.M ?? 0, Math.floor(date.S ?? 0)))
    return Number.isNaN(utc.getTime()) ? null : utc.toISOString().slice(0, 10)
  }
  const text = toText(value)
  if (!text) return null
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
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

export class OfficeFunnelParser {
  parse(buffer: Buffer): ParsedOfficeRow[] {
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
      client: col(['client']),
      service: col(['service']),
      action: col(['action item']),
      pic: col(['person in charge']),
      email: col(['person email']),
      due: col(['due date']),
      status: col(['status']),
      revenue: col(['potential revenue']),
      aging: col(['aging']),
      notes: col(['notes']),
      createdBy: col(['created by']),
      createdAt: col(['created at']),
      updatedAt: col(['updated at']),
    }

    const rows: ParsedOfficeRow[] = []
    for (let i = headerIndex + 1; i < matrix.length; i += 1) {
      const cells = matrix[i] ?? []
      const client = toText(cells[idx.client])
      const action = toText(cells[idx.action])
      if (!client && !action) continue
      const statusRaw = toText(cells[idx.status])
      const normalized: OfficeNormalized = {
        client: client ?? 'MIMOS Academy',
        service: toText(cells[idx.service]),
        action_item: action ?? `${client ?? 'Task'}`,
        pic: toText(cells[idx.pic]),
        pic_email: toText(cells[idx.email]),
        due_date: excelDate(cells[idx.due]),
        status_raw: statusRaw,
        stage: mapOfficeStage(statusRaw),
        potential_revenue: toNumber(cells[idx.revenue]),
        aging_days: toNumber(cells[idx.aging]),
        notes: toText(cells[idx.notes]),
        created_by: toText(cells[idx.createdBy]),
        created_at: excelDate(cells[idx.createdAt]),
        updated_at: excelDate(cells[idx.updatedAt]),
      }
      const errors: string[] = []
      const warnings: string[] = []
      if (!client) warnings.push('MISSING_CLIENT')
      if (!action) warnings.push('MISSING_ACTION_ITEM')
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

export const officeFunnelParser = new OfficeFunnelParser()
