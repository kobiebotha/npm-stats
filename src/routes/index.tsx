import { createFileRoute, Link } from '@tanstack/react-router'
import { BarChart3, Building2, Package, TrendingUp, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  const features = [
    {
      icon: <Building2 className="w-12 h-12 text-cyan-400" />,
      title: 'Organize by Company',
      description:
        'Group packages by organization to track adoption across different projects and competitors.',
    },
    {
      icon: <Package className="w-12 h-12 text-cyan-400" />,
      title: 'npm Package Tracking',
      description:
        'Monitor download statistics for any npm package. Extensible to support nuget, pypi, and more.',
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-cyan-400" />,
      title: 'Trend Analysis',
      description:
        'Visualize download trends with interactive charts and trendlines. Filter by date range.',
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-cyan-400" />,
      title: 'Compare Up to 3 Orgs',
      description:
        'View charts for multiple organizations side-by-side to compare adoption rates.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            <BarChart3 className="w-16 h-16 text-cyan-400" />
            <h1 className="text-5xl md:text-6xl font-black text-white">
              <span className="text-gray-300">Package</span>{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Adoption Tracker
              </span>
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Monitor open source package downloads
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Track npm package adoption across your projects and competitors.
            Visualize trends, compare organizations, and make data-driven decisions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/dashboard"
              className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 border-t border-slate-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Built with Modern Tech
          </h2>
          <p className="text-gray-400 mb-8">
            TanStack Start + React + Supabase + Recharts
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span className="px-3 py-1 bg-slate-800 rounded-full">TypeScript</span>
            <span className="px-3 py-1 bg-slate-800 rounded-full">TailwindCSS</span>
            <span className="px-3 py-1 bg-slate-800 rounded-full">shadcn/ui</span>
            <span className="px-3 py-1 bg-slate-800 rounded-full">Supabase Auth</span>
            <span className="px-3 py-1 bg-slate-800 rounded-full">Edge Functions</span>
          </div>
        </div>
      </section>
    </div>
  )
}
