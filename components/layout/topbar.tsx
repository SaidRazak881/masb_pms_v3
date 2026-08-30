'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell, ChevronRight, Menu, X, Upload, Plus, User, LogOut, Command, ArrowRight, FileText, Building2, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NAV_SECTIONS } from '@/components/layout/sidebar'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export type EnterpriseTopbarProps = { userEmail?: string; userRole?: string }
const PAGE_TITLES: Record<string, { title: string; category: string }> = {
  '/dashboard': { title: 'Dashboard Utama', category: 'Papan Pemuka' },
  '/dashboard/executive': { title: 'Executive Overview', category: 'Papan Pemuka' },
  '/dashboard/action-center': { title: 'Pusat Tindakan', category: 'Papan Pemuka' },
  '/dashboard/programs': { title: 'Program 360°', category: 'Operasi' },
  '/dashboard/r1': { title: 'R1 · Penyata Pendapatan & Invois', category: 'Kewangan' },
  '/dashboard/r2': { title: 'R2 · Laporan Latihan & Peserta', category: 'Latihan' },
  '/dashboard/imports': { title: 'Pusat Import & Kualiti Data', category: 'Integriti Data' },
  '/dashboard/reports': { title: 'Penjana Laporan & Audit', category: 'Laporan' },
  '/dashboard/settings': { title: 'Tetapan Sistem & Profil', category: 'Pentadbiran' },
}

type SearchResult = { title: string; subtitle: string; href: string; type: 'program' | 'client' | 'invoice' | 'quotation' }

export function EnterpriseTopbar({ userEmail, userRole }: EnterpriseTopbarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([])
  const [searching, setSearching] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)
  const searchRef = React.useRef<HTMLInputElement>(null)
  const searchRequestRef = React.useRef(0)
  const activeInfo = PAGE_TITLES[pathname] || { title: 'Sistem Pengurusan R1/R2/R3', category: 'MIMOS Academy' }

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        requestAnimationFrame(() => searchRef.current?.focus())
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setProfileOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  React.useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) {
      setSearchResults([])
      setSearching(false)
      return
    }

    const requestId = ++searchRequestRef.current
    const timer = window.setTimeout(async () => {
      setSearching(true)
      try {
        const supabase = createClient()
        const pattern = `%${q.replace(/[%_]/g, (value) => `\\${value}`)}%`
        const [programsRes, companiesRes, invoicesRes, quotationsRes] = await Promise.all([
          supabase.from('programs').select('id, program_code, title, company_id').or(`program_code.ilike.${pattern},title.ilike.${pattern}`).limit(5),
          supabase.from('companies').select('id, canonical_name').ilike('canonical_name', pattern).limit(5),
          supabase.from('invoices').select('invoice_no, program_id').ilike('invoice_no', pattern).limit(5),
          supabase.from('quotations').select('quotation_no_raw, program_id').ilike('quotation_no_raw', pattern).limit(5),
        ])

        if (requestId !== searchRequestRef.current) return

        const programs = (programsRes.data ?? []) as { id: string; program_code: string; title: string; company_id: string }[]
        const companies = (companiesRes.data ?? []) as { id: string; canonical_name: string }[]
        const invoices = (invoicesRes.data ?? []) as { invoice_no: string; program_id: string }[]
        const quotations = (quotationsRes.data ?? []) as { quotation_no_raw: string; program_id: string }[]
        const companyById = new Map(companies.map((company) => [company.id, company.canonical_name]))
        const programById = new Map(programs.map((program) => [program.id, program]))

        const results: SearchResult[] = [
          ...programs.map((program) => ({
            title: program.program_code,
            subtitle: `${program.title}${companyById.has(program.company_id) ? ` · ${companyById.get(program.company_id)}` : ''}`,
            href: `/dashboard/programs/${encodeURIComponent(program.program_code)}`,
            type: 'program' as const,
          })),
          ...companies.map((company) => ({
            title: company.canonical_name,
            subtitle: 'Klien · buka Program 360°',
            href: '/dashboard/programs',
            type: 'client' as const,
          })),
          ...invoices.map((invoice) => ({
            title: invoice.invoice_no,
            subtitle: programById.get(invoice.program_id)?.title ? `Invois · ${programById.get(invoice.program_id)?.title}` : 'Invois R1',
            href: '/dashboard/r1',
            type: 'invoice' as const,
          })),
          ...quotations.map((quotation) => ({
            title: quotation.quotation_no_raw,
            subtitle: programById.get(quotation.program_id)?.title ? `Sebutharga · ${programById.get(quotation.program_id)?.title}` : 'Sebutharga R3',
            href: programById.has(quotation.program_id) ? `/dashboard/programs/${encodeURIComponent(programById.get(quotation.program_id)!.program_code)}` : '/dashboard/programs',
            type: 'quotation' as const,
          })),
        ]
        setSearchResults(results.slice(0, 10))
      } finally {
        if (requestId === searchRequestRef.current) setSearching(false)
      }
    }, 220)

    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const signOut = async () => {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  const resultIcon = (type: SearchResult['type']) => {
    if (type === 'client') return Building2
    if (type === 'invoice') return Receipt
    if (type === 'quotation') return FileText
    return ArrowRight
  }

  return <>
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/dashboard" className="hidden items-center gap-2 lg:flex" aria-label="MIMOS Academy Executive Portal"><img src="/mimos-icon.svg" alt="MIMOS Academy" className="h-8 w-8 rounded-lg" /><div className="leading-tight"><p className="text-xs font-bold text-slate-900">MIMOS Academy</p><p className="text-[10px] font-semibold text-slate-500">R1/R2/R3 Executive Portal</p></div></Link>
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden"><img src="/mimos-icon.svg" alt="MIMOS Academy" className="h-8 w-8 rounded-lg" /><span className="text-sm font-extrabold text-slate-900">MIMOS Academy</span></Link>
        <button type="button" onClick={() => setMobileMenuOpen((v) => !v)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Buka menu navigasi">{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        <div className="hidden items-center gap-1.5 text-xs text-slate-500 xl:flex"><ChevronRight className="h-3 w-3 text-slate-300" /><span className="font-medium text-slate-400">{activeInfo.category}</span><ChevronRight className="h-3 w-3 text-slate-300" /><span className="max-w-[240px] truncate font-semibold text-slate-800">{activeInfo.title}</span></div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block md:w-56 lg:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input ref={searchRef} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }} onFocus={() => setSearchOpen(true)} placeholder="Cari program, klien, invois..." className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-14 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white" aria-label="Global Search" />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400"><Command className="mr-0.5 inline h-2.5 w-2.5" />K</kbd>
          {searchOpen && searchQuery.trim().length >= 2 && <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            {searching ? <div className="px-3 py-4 text-center text-xs text-slate-500">Mencari rekod...</div> : searchResults.length ? searchResults.map((result) => { const Icon = resultIcon(result.type); return <Link key={`${result.type}-${result.title}`} href={result.href} onClick={() => { setSearchOpen(false); setSearchQuery('') }} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-xs hover:bg-slate-50"><span className="flex min-w-0 items-center gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500"><Icon className="h-3.5 w-3.5" /></span><span className="min-w-0"><span className="block truncate font-semibold text-slate-800">{result.title}</span><span className="block truncate text-[10px] text-slate-400">{result.subtitle}</span></span></span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" /></Link> }) : <div className="px-3 py-4 text-center text-xs text-slate-500">Tiada rekod sepadan.</div>}
          </div>}
        </div>
        <Button asChild size="sm" className="hidden h-9 gap-1.5 bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 sm:inline-flex"><Link href="/dashboard/programs"><Plus className="h-3.5 w-3.5" />Rekod Baharu</Link></Button>
        <Button asChild size="sm" variant="outline" className="hidden h-9 gap-1.5 border-slate-200 text-xs sm:inline-flex"><Link href="/dashboard/imports"><Upload className="h-3.5 w-3.5 text-blue-600" />Upload Excel</Link></Button>
        <Link href="/dashboard/action-center" className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Pusat Tindakan"><Bell className="h-4 w-4" /><span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white ring-2 ring-white">3</span></Link>
        <div className="relative hidden sm:block"><button type="button" onClick={() => setProfileOpen((v) => !v)} className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 hover:bg-slate-50" aria-expanded={profileOpen} aria-label="Profil pengguna"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">{(userEmail?.[0] ?? 'U').toUpperCase()}</span><span className="hidden max-w-28 truncate text-[11px] font-semibold text-slate-700 lg:block">{userEmail ?? 'Pengguna'}</span></button>{profileOpen && <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><div className="border-b border-slate-100 px-3 py-2.5"><p className="truncate text-xs font-semibold text-slate-900">{userEmail ?? 'Pengguna'}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{userRole?.replaceAll('_', ' ') ?? 'Pengguna'}</p></div><Link href="/dashboard/settings" onClick={() => setProfileOpen(false)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><User className="h-3.5 w-3.5" />Profil &amp; Tetapan</Link><button type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><LogOut className="h-3.5 w-3.5" />Log Keluar</button></div>}</div>
      </div>
    </header>

    {mobileMenuOpen && <div className="fixed inset-0 z-40 lg:hidden"><div className="absolute inset-0 bg-slate-950/50" onClick={() => setMobileMenuOpen(false)} /><nav className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-slate-950 p-4 text-slate-100 shadow-2xl"><div className="flex items-center gap-3 border-b border-slate-800 pb-4"><img src="/mimos-icon.svg" alt="MIMOS Academy" className="h-10 w-10 rounded-lg" /><div><p className="text-sm font-bold text-white">MIMOS Academy</p><p className="text-[10px] uppercase tracking-wider text-slate-400">R1/R2/R3 Executive Portal</p></div></div><div className="mt-4 space-y-6">{NAV_SECTIONS.map((group) => <div key={group.section}><p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{group.section}</p><div className="mt-2 space-y-1">{group.items.map((item) => { const Icon = item.icon; const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)); return <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={cn('flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold', active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-900 hover:text-white')}><Icon className="h-4 w-4" />{item.title}</Link> })}</div></div>)}</div></nav></div>}
  </>
}
