import { requireUser } from '@/lib/auth'
import { EnterpriseSidebar } from '@/components/layout/sidebar'
import { EnterpriseTopbar } from '@/components/layout/topbar'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user, role } = await requireUser()

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased">
      {/* Enterprise Nav Sidebar */}
      <EnterpriseSidebar userEmail={user.email ?? ''} userRole={role ?? 'user'} />

      {/* Main Content Area */}
      <div className="flex flex-col lg:pl-64">
        {/* Sticky Topbar */}
        <EnterpriseTopbar userEmail={user.email ?? ''} userRole={role ?? 'user'} />

        {/* Dynamic Page Views */}
        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  )
}
