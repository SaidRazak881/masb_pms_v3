'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Row } from '@/types/database'

type Profile = Row<'profiles'>
type Company = Row<'companies'>
type CompanyAlias = Row<'company_alias_map'>
type StatusDictionary = Row<'status_dictionary'>

const ROLES: Array<Profile['role']> = ['super_admin', 'admin', 'manager', 'pic', 'viewer']

async function patchJson(url: string, body: Record<string, unknown>): Promise<{ ok: boolean; status: number; message?: string; data?: unknown }> {
  const response = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const payload = await response.json().catch(() => null)
  return { ok: response.ok, status: response.status, message: payload?.error, data: payload?.data }
}

async function postJson(url: string, body: Record<string, unknown>): Promise<{ ok: boolean; status: number; message?: string; data?: unknown }> {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const payload = await response.json().catch(() => null)
  return { ok: response.ok, status: response.status, message: payload?.error, data: payload?.data }
}

const roleClass = (role: string) => {
  switch (role) {
    case 'super_admin': return 'border-red-200 bg-red-50 text-red-700'
    case 'admin': return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'manager': return 'border-blue-200 bg-blue-50 text-blue-700'
    default: return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

export function SettingsClient({
  initialProfiles,
  initialCompanies,
  initialAliases,
  initialStatuses,
}: {
  initialProfiles: Profile[]
  initialCompanies: Company[]
  initialAliases: CompanyAlias[]
  initialStatuses: StatusDictionary[]
}) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [aliases, setAliases] = useState<CompanyAlias[]>(initialAliases)
  const [statuses, setStatuses] = useState<StatusDictionary[]>(initialStatuses)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [selectedRoles, setSelectedRoles] = useState<Record<string, Profile['role']>>({})
  const [selectedActive, setSelectedActive] = useState<Record<string, boolean>>({})
  const [aliasCompanyId, setAliasCompanyId] = useState('')
  const [aliasText, setAliasText] = useState('')
  const [statusSource, setStatusSource] = useState('')
  const [statusEntity, setStatusEntity] = useState('')
  const [statusRaw, setStatusRaw] = useState('')
  const [statusCanonical, setStatusCanonical] = useState('')

  async function saveProfile(profile: Profile) {
    setBusy(`profile-${profile.id}`)
    setMessage(null)
    try {
      const role = selectedRoles[profile.id] ?? profile.role
      const isActive = selectedActive[profile.id] ?? profile.is_active
      const result = await patchJson('/api/settings/profiles', { id: profile.id, role, is_active: isActive })
      if (!result.ok) { setMessage(`Gagal kemas kini ${profile.email}: ${result.message ?? 'unknown'}`); return }
      const updated = result.data as Profile
      setProfiles((rows) => rows.map((row) => (row.id === updated.id ? updated : row)))
      setMessage(`Role ${profile.email} dikemas kini.`)
    } catch (error) {
      setMessage(`Ralat rangkaian: ${error instanceof Error ? error.message : 'unknown'}`)
    } finally { setBusy(null) }
  }

  async function addAlias() {
    setBusy('alias')
    setMessage(null)
    try {
      if (!aliasCompanyId || !aliasText.trim()) { setMessage('Pilih syarikat dan masukkan alias.'); return }
      const result = await postJson('/api/settings/company-aliases', { company_id: aliasCompanyId, alias_text: aliasText })
      if (!result.ok) { setMessage(`Alias gagal ditambah: ${result.message ?? 'unknown'}`); return }
      const created = result.data as { company_id: string; alias_text: string }
      setAliases((rows) => [...rows, { id: `local-${Date.now()}`, company_id: created.company_id, alias_text: created.alias_text, created_at: new Date().toISOString() }])
      setAliasText('')
      setAliasCompanyId('')
      setMessage('Alias syarikat ditambah.')
    } catch (error) {
      setMessage(`Ralat rangkaian: ${error instanceof Error ? error.message : 'unknown'}`)
    } finally { setBusy(null) }
  }

  async function addStatus() {
    setBusy('status')
    setMessage(null)
    try {
      if (!statusSource.trim() || !statusRaw.trim() || !statusCanonical.trim()) { setMessage('Lengkapkan semua medan status.'); return }
      const result = await postJson('/api/settings/status-dictionary', {
        source_system: statusSource,
        entity_type: statusEntity.trim() || 'undefined',
        raw_value: statusRaw,
        canonical_value: statusCanonical,
      })
      if (!result.ok) { setMessage(`Status gagal disimpan: ${result.message ?? 'unknown'}`); return }
      const created = result.data as StatusDictionary
      setStatuses((rows) => {
        const existing = rows.findIndex((row) => row.source_system === created.source_system && row.entity_type === created.entity_type && row.raw_value === created.raw_value)
        if (existing >= 0) {
          const next = [...rows]
          next[existing] = created
          return next
        }
        return [...rows, created]
      })
      setStatusSource('')
      setStatusEntity('')
      setStatusRaw('')
      setStatusCanonical('')
      setMessage('Status dictionary disimpan.')
    } catch (error) {
      setMessage(`Ralat rangkaian: ${error instanceof Error ? error.message : 'unknown'}`)
    } finally { setBusy(null) }
  }

  const aliasesByCompany = new Map<string, CompanyAlias[]>()
  for (const alias of aliases) {
    const list = aliasesByCompany.get(alias.company_id) ?? []
    list.push(alias)
    aliasesByCompany.set(alias.company_id, list)
  }

  return (
    <div className="space-y-6">
      {message ? <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">{message}</p> : null}

      <Card>
        <CardHeader><CardTitle className="text-base">Users &amp; Roles</CardTitle></CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[900px] text-[13px] leading-[1.4]">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr><th className="border-b border-slate-200 p-3 text-left">Name</th><th className="border-b border-slate-200 p-3 text-left">Email</th><th className="border-b border-slate-200 p-3 text-left">Role</th><th className="border-b border-slate-200 p-3 text-left">Active</th><th className="border-b border-slate-200 p-3 text-right">Action</th></tr>
              </thead>
              <tbody>
                {profiles.map((profile, index) => {
                  const role = selectedRoles[profile.id] ?? profile.role
                  const isActive = selectedActive[profile.id] ?? profile.is_active
                  return (
                    <tr key={profile.id} className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${index % 2 ? 'bg-slate-50/40' : 'bg-white'}`}>
                      <td className="max-w-[240px] truncate p-3 font-medium">{profile.full_name}</td>
                      <td className="max-w-[240px] truncate p-3 text-slate-600">{profile.email}</td>
                      <td className="p-3">
                        <select value={role} onChange={(event) => setSelectedRoles((rows) => ({ ...rows, [profile.id]: event.target.value as Profile['role'] }))} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-[13px]">
                          {ROLES.map((value) => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </td>
                      <td className="p-3"><input type="checkbox" checked={isActive} onChange={(event) => setSelectedActive((rows) => ({ ...rows, [profile.id]: event.target.checked }))} className="h-4 w-4" /></td>
                      <td className="p-3 text-right"><Button size="sm" variant="outline" disabled={busy === `profile-${profile.id}`} onClick={() => saveProfile(profile)}>{busy === `profile-${profile.id}` ? 'Saving...' : 'Save'}</Button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {profiles.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Tiada pengguna.</p> : null}
          <p className="mt-3 text-xs text-slate-500">Tidak dibenarkan mengubah akaun anda sendiri melalui API ini untuk mengelakkan lockout.</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Company Aliases</CardTitle></CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1"><Label className="mb-1 block text-xs text-slate-500" htmlFor="alias-company">Company</Label><select id="alias-company" value={aliasCompanyId} onChange={(event) => setAliasCompanyId(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px]"><option value="">Pilih syarikat...</option>{initialCompanies.map((company) => <option key={company.id} value={company.id}>{company.canonical_name}</option>)}</select></div>
              <div className="flex-1"><Label className="mb-1 block text-xs text-slate-500" htmlFor="alias-text">Alias</Label><Input id="alias-text" value={aliasText} onChange={(event) => setAliasText(event.target.value)} placeholder="e.g. MIMOS Solutions SB" /></div>
              <Button type="button" disabled={busy === 'alias'} onClick={addAlias}>Add</Button>
            </div>
            {initialCompanies.map((company) => {
              const rows = aliasesByCompany.get(company.id) ?? []
              return <div key={company.id} className="border-t border-slate-200 py-3"><div className="flex items-center justify-between gap-2"><span className="text-[13px] font-medium">{company.canonical_name}</span><Badge>{rows.length} alias</Badge></div><div className="mt-2 flex flex-wrap gap-1.5">{rows.map((alias) => <Badge key={alias.id} className="border-slate-200 bg-slate-50 text-slate-600">{alias.alias_text}</Badge>)}{rows.length === 0 ? <span className="text-xs text-slate-400">Tiada alias.</span> : null}</div></div>
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Status Dictionary</CardTitle></CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-2 sm:grid-cols-2">
              <div><Label className="mb-1 block text-xs text-slate-500">Source System</Label><Input value={statusSource} onChange={(event) => setStatusSource(event.target.value)} placeholder="e.g. R3 Funnel" /></div>
              <div><Label className="mb-1 block text-xs text-slate-500">Entity Type</Label><Input value={statusEntity} onChange={(event) => setStatusEntity(event.target.value)} placeholder="e.g. pipeline_stage" /></div>
              <div><Label className="mb-1 block text-xs text-slate-500">Raw Value</Label><Input value={statusRaw} onChange={(event) => setStatusRaw(event.target.value)} placeholder="e.g. Contract signed" /></div>
              <div><Label className="mb-1 block text-xs text-slate-500">Canonical Value</Label><Input value={statusCanonical} onChange={(event) => setStatusCanonical(event.target.value)} placeholder="e.g. PO_RECEIVED" /></div>
            </div>
            <Button type="button" className="mt-3" disabled={busy === 'status'} onClick={addStatus}>Save Mapping</Button>
            <div className="mt-5 max-h-[440px] overflow-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[640px] text-[13px] leading-[1.4]">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr><th className="border-b border-slate-200 p-3 text-left">Source</th><th className="border-b border-slate-200 p-3 text-left">Entity</th><th className="border-b border-slate-200 p-3 text-left">Raw</th><th className="border-b border-slate-200 p-3 text-left">Canonical</th></tr>
                </thead>
                <tbody>
                  {statuses.map((row, index) => <tr key={row.id} className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${index % 2 ? 'bg-slate-50/40' : 'bg-white'}`}><td className="p-3">{row.source_system}</td><td className="p-3">{row.entity_type}</td><td className="p-3">{row.raw_value}</td><td className="p-3"><Badge>{row.canonical_value}</Badge></td></tr>)}
                </tbody>
              </table>
            </div>
            {statuses.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Tiada status mapping.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
