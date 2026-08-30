import * as XLSX from 'xlsx'
import { createHash } from 'node:crypto'
import type { Json } from '@/types/database'

export type ParticipantCategoryValue = 'WAFER_FAB' | 'FA_MA' | 'AI' | 'OTHERS'

export interface R2CategoryCounts {
  category: ParticipantCategoryValue
  workshop_count: number
  training_count: number
}

export interface R2OverallNormalized {
  row_no: number | null
  training_title: string
  company_name: string | null
  session_type: string | null
  start_date: string | null
  end_date: string | null
  duration_days: number | null
  total_charges: number | null
  bumiputera_count: number
  non_bumiputera_count: number
  categories: R2CategoryCounts[]
}

export interface R2AttendanceNormalized {
  row_no: number | null
  full_name: string
  cert_no: string | null
  is_bumiputera: boolean
}

export interface ParsedR2OverallRow {
  source_row_number: number
  raw_data: Json
  normalized_data: R2OverallNormalized
  row_hash: string
  validation_status: 'VALID' | 'WARNING' | 'ERROR'
  error_message: string | null
  warning_message: string | null
}

export interface ParsedR2AttendanceRow {
  source_row_number: number
  raw_data: Json
  normalized_data: R2AttendanceNormalized
  row_hash: string
  validation_status: 'VALID' | 'WARNING' | 'ERROR'
  error_message: string | null
  warning_message: string | null
}

type Cell = string | number | boolean | Date | null

const toText = (value: Cell): string | null => {
  if (value === null || value === undefined) return null
  const text = String(value).trim().replace(/[ \t]+/g, ' ').replace(/\r\n/g, '\n')
  return text.length > 0 ? text : null
}

const toNumber = (value: Cell): number | null => {
  if (value === null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const parsed = Number(String(value).replace(/[(),\sRM$€£]/gi, '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

const excelDateToIso = (value: Cell): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString()
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = XLSX.SSF.parse_date_code(value)
    if (!date) return null
    const utc = new Date(Date.UTC(date.y, date.m - 1, date.d, date.H ?? 0, date.M ?? 0, Math.floor(date.S ?? 0)))
    return Number.isNaN(utc.getTime()) ? null : utc.toISOString()
  }
  const text = toText(value)
  if (!text) return null
  const timestamp = Date.parse(text)
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString()
}

/**
 * Parses the R2 "Date" column which mixes forms like:
 *   "6-Jan-26", "28- 29 Jan 26", "9-10 Feb 26", "13-15 April 26",
 *   "5-6 Mar 26", "2- 3 April 2026", "5 March 2026".
 * Returns [startISO, endISO].
 */
export function parseR2DateRange(value: Cell): [string | null, string | null] {
  const text = toText(value)
  if (!text) return [null, null]
  const year = 2026
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  }

  const buildIso = (day: number): string | null => {
    if (!Number.isInteger(day) || day < 1 || day > 31) return null
    return new Date(Date.UTC(year, 0, day)).toISOString().slice(0, 10)
  }

  // Normalize separators and whitespace.
  const cleaned = text.replace(/[,.;]+/g, ' ').replace(/\s+/g, ' ').trim()
  const match = cleaned.match(/(\d{1,2})\s*[-–—to]+\s*(\d{1,2})\s+([A-Za-z]{3,9})/)
  if (match) {
    const startDay = Number(match[1])
    const endDay = Number(match[2])
    const month = months[match[3].slice(0, 3).toLowerCase()]
    if (month === undefined) return [null, null]
    return [buildIsoWithMonth(startDay, month), buildIsoWithMonth(endDay, month)]
  }

  const single = cleaned.match(/(\d{1,2})\s+([A-Za-z]{3,9})/)
  if (single) {
    const day = Number(single[1])
    const month = months[single[2].slice(0, 3).toLowerCase()]
    if (month === undefined) return [null, null]
    return [buildIsoWithMonth(day, month), null]
  }

  const direct = cleaned.match(/(\d{1,2})\s*[-–—]\s*(\d{1,2})?[\s/]*([A-Za-z]{3,9})/)
  if (direct) {
    const day = Number(direct[1])
    const month = months[(direct[3] ?? match?.[3] ?? '').slice(0, 3).toLowerCase()]
    if (month !== undefined) return [buildIsoWithMonth(day, month), null]
  }

  return [null, null]

  function buildIsoWithMonth(day: number, month: number): string | null {
    if (day < 1 || day > 31) return null
    return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10)
  }
}

const durationValue = (value: Cell): number | null => {
  const text = toText(value)
  if (!text) return null
  const match = text.match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const years = /year/i.test(text)
  return years ? Number(match[1]) * 365 : Number(match[1])
}

function titleAndCompany(value: Cell): { title: string; company: string | null; session_type: string | null } {
  const text = toText(value)
  if (!text) return { title: '', company: null, session_type: null }
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const title = lines[0] ?? text
  let company: string | null = null
  let session_type: string | null = null
  for (const line of lines.slice(1)) {
    const match = line.match(/^\(?\s*(.+?)\s*\)?$/)
    if (match) {
      const cleaned = match[1].trim()
      if (/in[- ]?house/i.test(cleaned)) {
        session_type = 'IN_HOUSE'
      } else if (/public|open/i.test(cleaned)) {
        session_type = 'PUBLIC'
      }
      if (!company) company = cleaned
    }
  }
  if (!company && /in[- ]?house/i.test(text)) {
    company = 'MIMOS Academy In-House'
    session_type = 'IN_HOUSE'
  }
  if (!company) {
    company = 'MIMOS Academy'
    session_type = 'PUBLIC'
  }
  return { title, company, session_type }
}

const CATEGORY_GROUPS: Array<{ category: ParticipantCategoryValue; start: number }> = [
  { category: 'WAFER_FAB', start: 6 },
  { category: 'FA_MA', start: 9 },
  { category: 'AI', start: 12 },
  { category: 'OTHERS', start: 15 },
]

function rowJson(headers: readonly Cell[], cells: readonly Cell[]): Json {
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

export class R2OverallParser {
  parse(buffer: Buffer): ParsedR2OverallRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: true })
    const sheetName = 'Overall'
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) return []

    const matrix = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: null, raw: true })
    // Header layout: row index 2 (0-based) has category groups, row index 3
    // has sub-columns. Data starts at row index 4.
    const headers = matrix[3]?.length ? matrix[3].map((value, i) => {
      const cat = CATEGORY_GROUPS.find((g) => i >= g.start && i < g.start + 3)
      return cat ? `${cat.category}_${['workshop', 'training', 'total'][i - cat.start]}` : (matrix[2]?.[i] ?? value ?? '')
    }) : []

    const rows: ParsedR2OverallRow[] = []
    for (let rowIndex = 4; rowIndex < matrix.length; rowIndex += 1) {
      const cells = matrix[rowIndex] ?? []
      const rowNo = toNumber(cells[1])
      const titleCell = cells[3]
      const title = toText(titleCell)
      if (rowNo === null && !title) continue

      const parsed = titleAndCompany(titleCell)
      const dateText = cells[2]
      const [startDate, endDate] = parseR2DateRange(dateText)

      const categories: R2CategoryCounts[] = []
      for (const group of CATEGORY_GROUPS) {
        const workshop = toNumber(cells[group.start]) ?? 0
        const training = toNumber(cells[group.start + 1]) ?? 0
        if (workshop > 0 || training > 0) {
          categories.push({ category: group.category, workshop_count: workshop, training_count: training })
        }
      }

      const normalized: R2OverallNormalized = {
        row_no: rowNo,
        training_title: parsed.title,
        company_name: parsed.company,
        session_type: parsed.session_type,
        start_date: startDate,
        end_date: endDate,
        duration_days: durationValue(cells[5]),
        total_charges: toNumber(cells[23]),
        bumiputera_count: toNumber(cells[21]) ?? 0,
        non_bumiputera_count: toNumber(cells[22]) ?? 0,
        categories,
      }

      const errors: string[] = []
      const warnings: string[] = []
      if (!normalized.training_title) errors.push('MISSING_TRAINING_TITLE')
      if (!normalized.start_date) warnings.push('MISSING_OR_INVALID_START_DATE')
      if (normalized.categories.length === 0) warnings.push('NO_CATEGORY_COUNTS')

      rows.push({
        source_row_number: rowIndex + 1,
        raw_data: rowJson(headers, cells),
        normalized_data: normalized,
        row_hash: hash({ sheet: 'Overall', row: rowIndex + 1, normalized }),
        validation_status: errors.length ? 'ERROR' : warnings.length ? 'WARNING' : 'VALID',
        error_message: errors.length ? errors.join('; ') : null,
        warning_message: warnings.length ? warnings.join('; ') : null,
      })
    }
    return rows
  }
}

export class R2AttendanceParser {
  parse(buffer: Buffer): ParsedR2AttendanceRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: true })
    const sheet = workbook.Sheets['Attendance list']
    if (!sheet) return []

    const matrix = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: null, raw: true })
    // Rows 0-1 are title/header placeholders. Row index 2 contains the header.
    const rows: ParsedR2AttendanceRow[] = []
    for (let rowIndex = 3; rowIndex < matrix.length; rowIndex += 1) {
      const cells = matrix[rowIndex] ?? []
      const rowNo = toNumber(cells[1])
      const fullName = toText(cells[2])
      const certNo = toText(cells[3])
      const isBumiRaw = cells[4]
      const isBumi = isBumiRaw != null && String(isBumiRaw).trim() !== ''
        ? Number(toNumber(isBumiRaw) ?? 0) > 0
        : false
      if (!fullName) continue

      rows.push({
        source_row_number: rowIndex + 1,
        raw_data: rowJson(['No', 'Name', 'Cert No', 'Bumi', 'Non-Bumi'], cells),
        normalized_data: { row_no: rowNo ?? null, full_name: fullName, cert_no: certNo, is_bumiputera: isBumi },
        row_hash: hash({ sheet: 'Attendance list', row: rowIndex + 1, full_name: fullName, cert_no: certNo, is_bumiputera: isBumi }),
        validation_status: 'VALID',
        error_message: null,
        warning_message: null,
      })
    }
    return rows
  }
}

export const r2OverallParser = new R2OverallParser()
export const r2AttendanceParser = new R2AttendanceParser()

// re-export for consumers that only need the date helper
export { excelDateToIso as r2ExcelDateToIso }
