import { ActionCenterTable } from '@/components/action-center/action-center-table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type ActionRow = Database['public']['Views']['vw_action_required']['Row']

export const dynamic = 'force-dynamic'

export default async function ActionCenter() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('vw_action_required').select('*').order('days_outstanding', { ascending: false })

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Action Center</h1>
          <p className="mt-1 text-sm text-slate-500">Keutamaan tindakan yang dijana daripada data operasi.</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Unable to load Action Center</h2>
            <p className="mt-2 text-sm text-slate-600">Data operasi tidak dapat dimuatkan sekarang. Sila cuba lagi.</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const rows: ActionRow[] = data ?? []
  const overdueAmount = rows.reduce(
    (sum, row) => sum + (row.category?.toUpperCase() === 'OVERDUE_INVOICE' ? Number(row.amount ?? 0) : 0),
    0,
  )
  const highPriority = rows.filter((row) => row.priority?.toUpperCase() === 'HIGH').length

  return <div className="space-y-6 p-6">
    <div><h1 className="text-2xl font-bold tracking-tight">Action Center</h1><p className="mt-1 text-sm text-slate-500">Keutamaan tindakan yang dijana daripada data operasi.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">Total Overdue Amount</p><p className="mt-2 text-2xl font-bold text-red-700">RM {overdueAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-sm font-medium text-slate-500">High-Priority Alerts</p><p className="mt-2 text-2xl font-bold text-amber-700">{highPriority}</p></CardContent></Card>
    </div>
    <ActionCenterTable rows={rows} />
  </div>
}
