'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Search,
  Bell,
  Plus,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Shield,
  UploadCloud,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur sm:px-6">
      {/* Left: Breadcrumbs & Page title indicator */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
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
  )
}
