'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BarChart3, FileText, AlertTriangle, Layers, Receipt, GraduationCap, Upload, Settings, LogOut, Shield, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export type NavItem = { title: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: string; badgeTone?: string }
export type NavSection = { section: string; items: NavItem[] }

export const NAV_SECTIONS: NavSection[] = [
  { section: 'DASHBOARD & ANALYTICS', items: [
    { title: 'Main Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Executive Overview', href: '/dashboard/executive', icon: BarChart3, badge: 'R1-R3', badgeTone: 'bg-blue-100 text-blue-800' },
    { title: 'Action Center', href: '/dashboard/action-center', icon: AlertTriangle, badge: 'Critical', badgeTone: 'bg-rose-100 text-rose-800' },
  ] },
  { section: 'PROGRAM & OPERATIONS', items: [
    { title: 'Program 360°', href: '/dashboard/programs', icon: Layers },
    { title: 'R1 · Finance & Invoicing', href: '/dashboard/r1', icon: Receipt },
    { title: 'R2 · Training & Participants', href: '/dashboard/r2', icon: GraduationCap },
  ] },
  { section: 'DATA INTEGRITY & CONFIGURATION', items: [
    { title: 'Import & Data Quality', href: '/dashboard/imports', icon: Upload },
    { title: 'Reports & Export', href: '/dashboard/reports', icon: FileText },
    { title: 'System Settings', href: '/dashboard/settings', icon: Settings },
  ] },
]

export function EnterpriseSidebar({ userEmail, userRole }: { userEmail: string; userRole: string }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  React.useEffect(() => { const sync = () => setCollapsed(window.innerWidth < 1440); sync(); window.addEventListener('resize', sync); return () => window.removeEventListener('resize', sync) }, [])
  React.useEffect(() => { document.documentElement.style.setProperty('--sidebar-width', collapsed ? '72px' : '260px') }, [collapsed])
  const handleSignOut = async () => { await createClient().auth.signOut(); window.location.href = '/login' }
  return (
    <aside className={cn('fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-800 bg-slate-950 text-slate-100 shadow-xl lg:flex transition-[width] duration-200', collapsed ? 'w-[72px]' : 'w-[260px]')}>
      <div className={cn('flex h-16 items-center border-b border-slate-800/80', collapsed ? 'justify-center px-2' : 'gap-3 px-5')}>
        <img src="/mimos-icon.svg" alt="MIMOS Academy" className="h-9 w-9 shrink-0 rounded-lg ring-1 ring-slate-700/60" />
        {!collapsed && <div className="min-w-0"><h2 className="truncate text-sm font-bold text-white">MIMOS Academy</h2><p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400">PMS · Enterprise R1/R2/R3</p></div>}
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((group) => <div key={group.section}>{!collapsed && <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{group.section}</p>}<div className={cn('mt-2 space-y-1', collapsed && 'mt-0')}>{group.items.map((item) => { const Icon = item.icon; const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)); return <Link key={item.href} href={item.href} title={collapsed ? item.title : undefined} className={cn('group flex items-center rounded-lg text-xs font-semibold transition-colors', collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2', isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-900 hover:text-white')}><span className="flex min-w-0 items-center gap-2.5"><Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')} />{!collapsed && <span className="truncate">{item.title}</span>}</span>{!collapsed && item.badge && <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', isActive ? 'bg-white/20 text-white' : item.badgeTone ?? 'bg-slate-800 text-slate-300')}>{item.badge}</span>}</Link> })}</div></div>)}
      </div>
      <div className="border-t border-slate-800/80 bg-slate-900/50 p-3">
        <button type="button" onClick={() => setCollapsed((v) => !v)} className="mb-2 flex w-full items-center justify-center rounded-lg px-2 py-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <Menu className="h-4 w-4" /> : <><X className="h-4 w-4" /><span className="ml-2 text-[11px] font-semibold">Collapse menu</span></>}</button>
        {!collapsed && <div className="mb-2 flex items-center gap-2 px-1"><Shield className="h-3.5 w-3.5 text-emerald-400" /><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-white">{userEmail || 'admin@mimos.my'}</p><p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-500">{userRole?.replaceAll('_', ' ') || 'Super Admin'}</p></div></div>}
        <button type="button" onClick={handleSignOut} title={collapsed ? 'Sign out' : undefined} className={cn('flex w-full items-center rounded-lg border border-slate-800 bg-slate-900/80 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white', collapsed ? 'justify-center px-2' : 'justify-center gap-2 px-3')}><LogOut className="h-3.5 w-3.5 text-slate-400" />{!collapsed && 'Sign out'}</button>
      </div>
    </aside>
  )
}
