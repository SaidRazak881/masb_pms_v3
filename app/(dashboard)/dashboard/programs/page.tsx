import { ProgramsTable } from '@/components/programs/programs-table'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type FunnelRow = Database['public']['Views']['vw_r3_sales_funnel']['Row']

export default async function Programs() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('vw_r3_sales_funnel').select('*').order('weighted_value', { ascending: false })
  if (error) throw new Error(error.message)
  const rows: FunnelRow[] = data ?? []

  return <div className="space-y-6 p-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Program 360</h1>
      <p className="mt-1 text-sm text-slate-500">Program sebagai spine untuk quotation, PO, invoice, payment dan training.</p>
    </div>
    <ProgramsTable rows={rows} />
  </div>
}
