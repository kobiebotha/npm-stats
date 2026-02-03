import { createFileRoute, Outlet, Link, useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, Building2, BarChart3, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    )
  }

  if (!user) {
    navigate({ to: '/login' })
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Adoption Tracker</h1>
          <p className="text-xs text-gray-400 mt-1">{user.email}</p>
        </div>

        <nav className="space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-colors [&.active]:bg-cyan-500/20 [&.active]:text-cyan-400"
            activeOptions={{ exact: true }}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </Link>
          <Link
            to="/dashboard/organizations"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-colors [&.active]:bg-cyan-500/20 [&.active]:text-cyan-400"
          >
            <Building2 className="w-5 h-5" />
            Organizations
          </Link>
          <Link
            to="/dashboard/analytics"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-colors [&.active]:bg-cyan-500/20 [&.active]:text-cyan-400"
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </Link>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  )
}
