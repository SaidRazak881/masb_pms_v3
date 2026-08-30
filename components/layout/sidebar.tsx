import Link from 'next/link'
import { Activity, BarChart3, Database, FileInput, FileText, Gauge, LayoutDashboard, Settings, ShieldCheck, Users } from 'lucide-react'
import { SignOutButton } from '@/components/sign-out'

const groups = [
  { title: 'Papan Pemuka', items: [{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard }, { href: '/dashboard/executive', label: 'Executive', icon: Gauge }, { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 }, { href: '/dashboard/action-center', label: 'Pusat Tindakan', icon: Activity }] },
  { title: 'Operasi Program', items: [{ href: '/dashboard/programs', label: 'Program 360', icon: Database }, { href: '/dashboard/r1', label: 'R1 · Income', icon: FileText }, { href: '/dashboard/r2', label: 'R2 · Training', icon: Users }] },
  { title: 'Integriti Data', items: [{ href: '/dashboard/imports', label: 'Import & DQ', icon: FileInput }, { href: '/dashboard/settings', label: 'Settings', icon: Settings }] },
]

export function EnterpriseSidebar({ role, email }: { role: string; email?: string | null }) {
  const roleLabel = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager' : role
  return <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-slate-950 text-slate-200 lg:flex"><div className="flex h-16 items-center border-b border-white/10 px-6"><div><div className="text-sm font-semibold tracking-wide text-white">MIMOS Academy</div><div className="text-[11px] text-slate-400">Program Management System</div></div></div><nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6">{groups.map((group) => <div key={group.title}><p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{group.title}</p><div className="space-y-1">{group.items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"><Icon className="h-4 w-4" />{label}</Link>)}</div></div>)}</nav><div className="border-t border-white/10 p-4"><div className="mb-3 flex items-center gap-3 rounded-lg bg-white/5 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">{(email?.[0] ?? 'U').toUpperCase()}</div><div className="min-w-0"><p className="truncate text-xs text-slate-300">{email ?? 'User'}</p><span className="mt-1 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300">{roleLabel}</span></div></div><SignOutButton /></div></aside>
}
