import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/settings-client'
import type { Row } from '@/types/database'

export const dynamic = 'force-dynamic'

type Profile = Row<'profiles'>
type Company = Row<'companies'>
type CompanyAlias = Row<'company_alias_map'>
type StatusDictionary = Row<'status_dictionary'>

export default async function SettingsPage() {
  await requireRole(['super_admin', 'admin'])
  const supabase = await createClient()

  const [profilesResult, companiesResult, aliasesResult, statusesResult] = await Promise.all([
    supabase.from('profiles').select('*').order('role', { ascending: true }).order('full_name', { ascending: true }),
    supabase.from('companies').select('*').order('canonical_name', { ascending: true }),
    supabase.from('company_alias_map').select('*').order('alias_text', { ascending: true }),
    supabase.from('status_dictionary').select('*').order('source_system', { ascending: true }).order('entity_type', { ascending: true }),
  ])

  const profiles = (profilesResult.data ?? []) as Profile[]
  const companies = (companiesResult.data ?? []) as Company[]
  const aliases = (aliasesResult.data ?? []) as CompanyAlias[]
  const statuses = (statusesResult.data ?? []) as StatusDictionary[]

  const loadErrors = [profilesResult.error, companiesResult.error, aliasesResult.error, statusesResult.error].filter(Boolean)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Pengurusan master data, role pengguna dan status dictionary.</p>
      </div>

      {loadErrors.length > 0 ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          Sebahagian data settings tidak dapat dimuatkan:
          {loadErrors.map((error, index) => <span key={index} className="ml-2">{error?.message}</span>)}
        </p>
      ) : null}

      <SettingsClient
        initialProfiles={profiles}
        initialCompanies={companies}
        initialAliases={aliases}
        initialStatuses={statuses}
      />
    </div>
  )
}
