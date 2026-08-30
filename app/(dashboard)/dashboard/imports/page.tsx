import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ImportCenterClient } from '@/components/imports/import-center-client'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
type Batch = Database['public']['Tables']['import_batches']['Row']
type Exception = Database['public']['Tables']['data_quality_exceptions']['Row']

export default async function ImportCenterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle()
  if (!profile || !profile.is_active || profile.role !== 'super_admin') redirect('/dashboard')
  const [batchesResult, exceptionsResult] = await Promise.all([
    supabase.from('import_batches').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('data_quality_exceptions').select('*').order('created_at', { ascending: false }).limit(30).eq('status', 'OPEN'),
  ])
  const batches: Batch[] = batchesResult.data ?? []
  const exceptions: Exception[] = exceptionsResult.data ?? []
  return <div className="space-y-6 p-6"><div><h1 className="text-2xl font-bold tracking-tight">Import &amp; Data Quality</h1><p className="mt-1 text-sm text-slate-500">Super Admin only: upload raw workbooks, review staging batches, and monitor data quality exceptions.</p></div><ImportCenterClient batches={batches} exceptions={exceptions} /></div>
}
