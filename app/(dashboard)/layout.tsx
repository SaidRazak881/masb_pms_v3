import { requireUser } from '@/lib/auth'
import { EnterpriseSidebar } from '@/components/layout/sidebar'
import { EnterpriseTopbar } from '@/components/layout/topbar'
import { Program360MutationPanel } from '@/components/programs/program360-mutation-panel'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user, role } = await requireUser()
  return (
    <div className="min-h-screen bg-slate-50 antialiased">
      <EnterpriseSidebar userEmail={user.email ?? ''} userRole={role ?? 'user'} />
      <div className="flex min-h-screen flex-col pl-0 lg:pl-[var(--sidebar-width,260px)] transition-[padding] duration-200">
        <EnterpriseTopbar userEmail={user.email ?? ''} userRole={role ?? 'user'} />
        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
      <Program360MutationPanel />
    </div>
  )
}