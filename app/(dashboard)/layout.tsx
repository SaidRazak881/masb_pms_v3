import { requireUser } from '@/lib/auth'
import { EnterpriseSidebar } from '@/components/layout/sidebar'
import { EnterpriseTopbar } from '@/components/layout/topbar'
import { Program360MutationPanel } from '@/components/programs/program360-mutation-panel'
import { Program360CreateActions } from '@/components/programs/program360-create-actions'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user, role } = await requireUser()
  const effectiveRole = role ?? 'viewer'
  return (
    <div className="min-h-screen overflow-x-clip bg-slate-50 antialiased">
      <EnterpriseSidebar userEmail={user.email ?? ''} userRole={effectiveRole} />
      <div className="flex min-h-screen min-w-0 flex-col pl-0 lg:pl-[var(--sidebar-width,260px)] transition-[padding] duration-200">
        <EnterpriseTopbar userEmail={user.email ?? ''} userRole={effectiveRole} />
        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
      <Program360MutationPanel />
      <Program360CreateActions />
    </div>
  )
}
