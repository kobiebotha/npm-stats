import { createFileRoute, Outlet, Link, useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, Building2, BarChart3, LogOut, Bookmark, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useSavedViews, useDeleteSavedView } from '@/hooks/use-saved-views'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const { data: savedViews } = useSavedViews()
  const deleteSavedView = useDeleteSavedView()

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

        {savedViews && savedViews.length > 0 && (
          <div className="mt-6">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Saved Views</span>
            </div>
            <div className="space-y-1">
              {savedViews.map(view => (
                <div key={view.id} className="group flex items-center">
                  <Link
                    to="/dashboard/analytics"
                    search={{ viewId: view.id }}
                    className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-colors text-sm truncate"
                  >
                    <Bookmark className="w-4 h-4 shrink-0" />
                    <span className="truncate">{view.name}</span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      deleteSavedView.mutate(view.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 mr-2 text-gray-500 hover:text-red-400 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
