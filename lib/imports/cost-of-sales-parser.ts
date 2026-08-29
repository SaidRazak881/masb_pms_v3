import * as XLSX from 'xlsx'
import { z } from 'zod'

const monetary = z.number().finite().nullable()

export type ParsedCostOfSalesRow = {
  source_row_number: number
  row_hash: string
  raw_data: Record<string, unknown>
  normalized_data: {
    invoice_number: string | null
    invoice_value: number | null
    collection: number | null
    cost_of_sales_amount: number | null
    mimos_academy_cost: number | null
    commission: number | null
    bro_incentive: number | null
    net_profit: number | null
    profit_percentage: number | null
    had_formula_error: boolean
  }
  validation_status: 'VALID' | 'WARNING' | 'ERROR'
  error_message: string | null
  warning_message: string | null
}

const headers = ['Invoice No','Invoice Value','Collection','Cost of Sales','MIMOS Academy Cost','Commission','BRO Incentive','Net Profit','Profit Percentage'] as const
const clean = (value: unknown): string | null => value == null || String(value).trim() === '' ? null : String(value).trim()
const money = (value: unknown): number | null => {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}
const percent = (value: unknown): number | null => {
  if (value == null || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(String(value).replace('%','').trim())
  if (!Number.isFinite(parsed)) return null
  return parsed > 1 ? parsed / 100 : parsed
}
const hash = (value: string) => Array.from(new TextEncoder().encode(value)).reduce((h, c) => ((h << 5) - h + c) | 0, 0).toString(16)

export class CostOfSalesParser {
  parse(buffer: Buffer): ParsedCostOfSalesRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellFormula: true, cellNF: true, cellText: true })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) throw new Error('COST_OF_SALES_WORKSHEET_NOT_FOUND')
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: true })
    return rows.map((raw, index) => {
      const invoice_number = clean(raw['Invoice No'])
      const invoice_value = money(raw['Invoice Value'])
      const collection = money(raw['Collection'])
      const cost_of_sales_amount = money(raw['Cost of Sales'])
      const mimos_academy_cost = money(raw['MIMOS Academy Cost'])
      const commission = money(raw['Commission'])
      const bro_incentive = money(raw['BRO Incentive'])
      const net_profit = money(raw['Net Profit'])
      const profit_percentage = percent(raw['Profit Percentage'])
      const rawText = JSON.stringify(raw)
      const had_formula_error = headers.some((header) => {
        const value = raw[header]
        return typeof value === 'string' && /#(REF|DIV\/0|VALUE|NAME|N\/A|NUM|NULL)!?/i.test(value)
      }) || /#(REF|DIV\/0|VALUE|NAME|N\/A|NUM|NULL)!?/i.test(rawText)
      const errors: string[] = []
      const warnings: string[] = []
      if (!invoice_number) errors.push('MISSING_INVOICE_NUMBER')
      if (had_formula_error) errors.push('FORMULA_ERROR')
      if (raw['Profit Percentage'] != null && profit_percentage == null) errors.push('INVALID_PROFIT_PERCENTAGE')
      else if (profit_percentage != null && (profit_percentage < 0 || profit_percentage > 1)) errors.push('INVALID_PROFIT_PERCENTAGE')
      const validation_status = errors.length ? 'ERROR' : warnings.length ? 'WARNING' : 'VALID'
      return {
        source_row_number: index + 2,
        row_hash: hash(rawText),
        raw_data: raw,
        normalized_data: { invoice_number, invoice_value, collection, cost_of_sales_amount, mimos_academy_cost, commission, bro_incentive, net_profit, profit_percentage, had_formula_error },
        validation_status,
        error_message: errors.length ? errors.join('; ') : null,
        warning_message: warnings.length ? warnings.join('; ') : null,
      }
    })
  }
}

export const costOfSalesParser = new CostOfSalesParser()
