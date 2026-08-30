import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImportCenterClient } from '@/components/imports/import-center-client'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

type Batch = Database['public']['Tables']['import_batches']['Row']
type Exception = Database['public']['Tables']['data_quality_exceptions']['Row']

const batchStatusClass = (status: string | null) => {
  switch (status) {
    case 'COMPLETED': return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'FAILED':
    case 'PARSING_FAILED':
    case 'VALIDATION_FAILED':
    case 'MATCHING_FAILED':
    case 'ROLLED_BACK': return 'border-red-200 bg-red-50 text-red-700'
    case 'UPLOADED':
    case 'PARSING':
    case 'STAGED':
    case 'VALIDATING':
    case 'MATCHING':
    case 'READY':
    case 'COMMITTING': return 'border-blue-200 bg-blue-50 text-blue-700'
    default: return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

export default async function ImportCenterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle()
  if (!profile || !profile.is_active || !['super_admin', 'admin', 'manager'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const [batchesResult, exceptionsResult] = await Promise.all([
    supabase.from('import_batches').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('data_quality_exceptions').select('*').order('created_at', { ascending: false }).limit(30).eq('status', 'OPEN'),
  ])

  const batches: Batch[] = batchesResult.data ?? []
  const exceptions: Exception[] = exceptionsResult.data ?? []

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import &amp; Data Quality</h1>
        <p className="mt-1 text-sm text-slate-500">Upload workbook, semak batch staging, dan pantau data quality exceptions.</p>
      </div>

      <ImportCenterClient batches={batches} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold">Data Quality Exceptions (Open)</h2>
            <div className="mt-3 space-y-2">
              {exceptions.length === 0 ? <p className="text-sm text-slate-500">Tiada exception terbuka.</p> : exceptions.map((exception) => (
                <div key={exception.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{exception.type}</p>
                    <Badge className={exception.severity === 'HIGH' || exception.severity === 'CRITICAL' ? 'border-red-200 bg-red-50 text-red-700' : exception.severity === 'MEDIUM' || exception.severity === 'MED' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-700'}>{exception.severity}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{exception.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
