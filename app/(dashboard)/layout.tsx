import { requireUser } from '@/lib/auth'
import { EnterpriseSidebar } from '@/components/layout/sidebar'
import { EnterpriseTopbar } from '@/components/layout/topbar'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user, role } = await requireUser()
  return <div className="min-h-screen bg-slate-50"><EnterpriseSidebar role={role} email={user.email} /><main className="min-h-screen lg:pl-72"><EnterpriseTopbar />{children}</main></div>
}
