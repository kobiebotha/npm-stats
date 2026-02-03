import { Link } from '@tanstack/react-router'
import { BarChart3 } from 'lucide-react'

export default function Header() {
  return (
    <header className="p-4 flex items-center justify-between bg-slate-800 text-white shadow-lg border-b border-slate-700">
      <Link to="/" className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-cyan-400" />
        <h1 className="text-xl font-bold">
          <span className="text-gray-300">Package</span>{' '}
          <span className="text-cyan-400">Adoption</span>
        </h1>
      </Link>
      <nav className="flex items-center gap-4">
        <Link
          to="/dashboard"
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          Dashboard
        </Link>
        <Link
          to="/login"
          className="px-4 py-2 text-sm font-medium bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          Sign In
        </Link>
      </nav>
    </header>
  )
}
