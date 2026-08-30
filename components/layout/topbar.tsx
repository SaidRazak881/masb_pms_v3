'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Search,
  Bell,
  ChevronRight,
  Menu,
  X,
  UploadCloud,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NAV_SECTIONS } from '@/components/layout/sidebar'
import { cn } from '@/lib/utils'

export type EnterpriseTopbarProps = {
  userEmail?: string
  userRole?: string
}

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

export function EnterpriseTopbar({ userEmail, userRole }: EnterpriseTopbarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const activeInfo = PAGE_TITLES[pathname] || {
    title: 'Sistem Pengurusan R1/R2/R3',
    category: 'MIMOS Academy',
  }

  return (
    <>
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur sm:px-6">
      {/* Left: Mobile logo, Breadcrumbs & Page title indicator */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile brand logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 lg:hidden"
          aria-label="MIMOS Academy"
        >
          <img
            src="/mimos-icon.svg"
            alt="MIMOS Academy"
            className="h-8 w-8 rounded-lg shadow-sm"
          />
          <span className="text-sm font-extrabold tracking-tight text-slate-900">MIMOS Academy</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Buka menu navigasi"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-medium text-slate-400">{activeInfo.category}</span>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <span className="font-semibold text-slate-800 truncate">{activeInfo.title}</span>
        </div>
      </div>

      {/* Right: Quick Search, Action Badges & Quick Action CTA */}
      <div className="flex items-center gap-2.5">
        {/* Global Search Quick Bar */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Carian program, invois, klien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Quick Link to Import Center */}
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 border-slate-200 text-xs text-slate-700 hover:bg-slate-50 hidden sm:inline-flex"
        >
          <Link href="/dashboard/imports">
            <UploadCloud className="h-3.5 w-3.5 text-blue-600" />
            <span>Import Excel</span>
          </Link>
        </Button>

        {/* Action Center Alert Badge */}
        <Link
          href="/dashboard/action-center"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          title="Pusat Tindakan & Amaran"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white ring-2 ring-white">
            3
          </span>
        </Link>
      </div>
    </header>

    {/* Mobile navigation drawer (Slate-950 enterprise theme) */}
    {mobileMenuOpen ? (
      <div className="fixed inset-0 z-30 lg:hidden">
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <nav className="absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-slate-800 bg-slate-950 p-4 text-slate-100 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
            <img src="/mimos-icon.svg" alt="MIMOS Academy" className="h-10 w-10 rounded-lg shadow-md" />
            <div>
              <p className="text-sm font-bold text-white">MIMOS Academy</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                PMS · Enterprise R1/R2/R3
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-6">
            {NAV_SECTIONS.map((group) => (
              <div key={group.section}>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {group.section}
                </p>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                          isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 text-slate-400" />
                          {item.title}
                        </span>
                        {item.badge ? (
                          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', isActive ? 'bg-white/20 text-white' : item.badgeTone ?? 'bg-slate-800 text-slate-300')}>
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </div>
    ) : null}
    </>
  )
}
