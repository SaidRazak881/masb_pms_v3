import * as XLSX from 'xlsx'
import { createHash } from 'node:crypto'
import type { Json } from '@/types/database'
import { mapR3Stage } from '@/lib/imports/r3-config'

export interface R3Normalized {
  row_no: number | null
  company_name: string
  project_title: string
  program_type: string | null
  forecast_value: number | null
  probability: number | null
  weighted_value: number | null
  secured_value: number | null
  status_raw: string | null
  stage: string
  speed_to_market: string | null
  sector: string | null
  remarks: string | null
}

export interface ParsedR3Row {
  source_row_number: number
  raw_data: Json
  normalized_data: R3Normalized
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

const percent = (value: Cell): number | null => {
  const parsed = toNumber(value)
  if (parsed === null) return null
  return parsed > 1 ? parsed / 100 : parsed
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

export class R3FunnelParser {
  parse(buffer: Buffer): ParsedR3Row[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: true })
    // Prefer the funnel sheet; fall back to first sheet.
    const sheetName = workbook.SheetNames.find((name) => /Funnel|Dr Nizar/i.test(name)) ?? workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) return []
    const matrix = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: null, raw: true })
    const headerIndex = matrix.findIndex((row) => row.some((cell) => /client/i.test(String(cell ?? '')) && /project|opportunit/i.test(String(row[2] ?? ''))))
    if (headerIndex < 0) return []

    const headers = (matrix[headerIndex] ?? []).map((cell) => String(cell ?? '').trim())
    const col = (alias: string[]): number => headers.findIndex((h) => alias.some((a) => h.toLowerCase().includes(a)))
    const idx = {
      no: col(['no']),
      company: col(['client', 'customer']),
      title: col(['project', 'opportunit']),
      type: col(['type']),
      forecast: col(['forecast value']),
      status: col(['status']),
      speed: col(['speed to market', 'speed']),
      probability: col(['probability']),
      weighted: col(['weighted']),
      secured: col(['po / secured', 'secured new order', 'secured']),
      sector: col(['remarks : public', 'public / private', 'sector', 'remarks']),
    }

    const rows: ParsedR3Row[] = []
    for (let i = headerIndex + 1; i < matrix.length; i += 1) {
      const cells = matrix[i] ?? []
      const rowNo = toNumber(cells[idx.no])
      const company = toText(cells[idx.company])
      const title = toText(cells[idx.title])
      if (!company && !title) continue

      const statusRaw = toText(cells[idx.status])
      const normalized: R3Normalized = {
        row_no: rowNo,
        company_name: company ?? 'MIMOS Academy',
        project_title: title ?? 'Unnamed Project',
        program_type: toText(cells[idx.type]),
        forecast_value: toNumber(cells[idx.forecast]),
        probability: percent(cells[idx.probability]),
        weighted_value: toNumber(cells[idx.weighted]),
        secured_value: toNumber(cells[idx.secured]),
        status_raw: statusRaw,
        stage: mapR3Stage(statusRaw),
        speed_to_market: toText(cells[idx.speed]),
        sector: toText(cells[idx.sector]),
        remarks: null,
      }
      // Sector lives in the "Remarks : Public / Private Sector" column in R3.
      const remarksCol = headers.find((h) => /remarks|public\s*\/\s*private/i.test(h))
      if (remarksCol !== undefined) {
        normalized.sector = toText(cells[headers.indexOf(remarksCol)])
        normalized.remarks = toText(cells[headers.indexOf(remarksCol)])
      }

      const errors: string[] = []
      const warnings: string[] = []
      if (!company) errors.push('MISSING_COMPANY')
      if (!title) errors.push('MISSING_PROJECT_TITLE')
      if (normalized.forecast_value === null) warnings.push('MISSING_FORECAST_VALUE')
      if (normalized.probability === null) warnings.push('MISSING_PROBABILITY')

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

export const r3FunnelParser = new R3FunnelParser()
