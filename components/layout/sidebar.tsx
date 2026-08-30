'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart3,
  FileSpreadsheet,
  AlertOctagon,
  Layers,
  Receipt,
  GraduationCap,
  UploadCloud,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeTone?: string
}

export type NavSection = {
  section: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    section: 'Papan Pemuka & Analisis',
    items: [
      { title: 'Dashboard Utama', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Executive Overview', href: '/dashboard/executive', icon: BarChart3, badge: 'R1-R3', badgeTone: 'bg-blue-100 text-blue-800' },
      { title: 'Pusat Tindakan', href: '/dashboard/action-center', icon: AlertOctagon, badge: 'Kritikal', badgeTone: 'bg-rose-100 text-rose-800' },
    ],
  },
  {
    section: 'Modul Program & Operasi',
    items: [
      { title: 'Program 360°', href: '/dashboard/programs', icon: Layers },
      { title: 'R1 · Kewangan & Invois', href: '/dashboard/r1', icon: Receipt },
      { title: 'R2 · Latihan & Peserta', href: '/dashboard/r2', icon: GraduationCap },
    ],
  },
  {
    section: 'Integriti & Konfigurasi',
    items: [
      { title: 'Import & Kualiti Data', href: '/dashboard/imports', icon: UploadCloud },
      { title: 'Laporan & Eksport', href: '/dashboard/reports', icon: FileSpreadsheet },
      { title: 'Tetapan Sistem', href: '/dashboard/settings', icon: Settings },
    ],
  },
]

export function EnterpriseSidebar({
  userEmail,
  userRole,
}: {
  userEmail: string
  userRole: string
}) {
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200/90 bg-slate-950 text-slate-100 lg:flex z-30">
      {/* Brand Header — official MIMOS Academy icon */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-6">
        <img
          src="/mimos-icon.svg"
          alt="MIMOS Academy"
          className="h-9 w-9 shrink-0 rounded-lg shadow-md ring-1 ring-slate-700/60"
        />
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white">MIMOS Academy</h2>
          <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">PMS · Enterprise R1/R2/R3</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {NAV_SECTIONS.map((group) => (
          <div key={group.section}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                    className={cn(
                      'group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        )}
                      />
                      <span className="truncate">{item.title}</span>
                    </div>

                    {item.badge ? (
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-[10px] font-bold',
                          isActive ? 'bg-white/20 text-white' : item.badgeTone ?? 'bg-slate-800 text-slate-300'
                        )}
                      >
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

      {/* User Footer Profile & Sign Out */}
      <div className="border-t border-slate-800/80 p-4 bg-slate-900/50">
        <div className="mb-3 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="truncate text-xs font-semibold text-white">{userEmail || 'admin@mimos.my'}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {userRole?.replace('_', ' ') || 'Super Admin'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5 text-slate-400" />
          <span>Log Keluar</span>
        </button>
      </div>
    </aside>
  )
}
