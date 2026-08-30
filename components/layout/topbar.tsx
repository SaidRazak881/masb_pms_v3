'use client'

import { Bell, ChevronRight, Search } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function EnterpriseTopbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const crumbs = useMemo(() => pathname.split('/').filter(Boolean).map((part) => part.replaceAll('-', ' ')), [pathname])
  return <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur lg:px-7"><div className="flex items-center gap-4"><div className="hidden min-w-0 flex-1 items-center gap-1 text-sm text-slate-500 md:flex"><span className="font-medium text-slate-900">MIMOS Academy</span>{crumbs.map((crumb, i) => <span key={`${crumb}-${i}`} className="flex items-center gap-1"><ChevronRight className="h-3.5 w-3.5" /><span className={i === crumbs.length - 1 ? 'font-medium capitalize text-slate-900' : 'capitalize'}>{crumb}</span></span>)}</div><div className="relative ml-auto hidden w-full max-w-sm md:block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) router.push(`/dashboard/programs?search=${encodeURIComponent(query.trim())}`) }} placeholder="Carian global…" className="pl-9" /></div><Button variant="outline" size="sm" onClick={() => router.push('/dashboard/action-center')} className="gap-2"><Bell className="h-4 w-4" /><span className="hidden sm:inline">Pusat Tindakan</span><span className="h-2 w-2 rounded-full bg-amber-500" /></Button></div></header>
}
