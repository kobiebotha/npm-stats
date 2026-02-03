import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DownloadStats, Project } from '@/types/database'

interface StatsSummaryProps {
  projects: Project[]
  statsByProject: Record<string, DownloadStats>
}

export function StatsSummary({ projects, statsByProject }: StatsSummaryProps) {
  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  const totalWeekly = projects.reduce((sum, p) => {
    const stats = statsByProject[p.id]
    return sum + (stats?.downloads_week ?? 0)
  }, 0)

  const totalMonthly = projects.reduce((sum, p) => {
    const stats = statsByProject[p.id]
    return sum + (stats?.downloads_month ?? 0)
  }, 0)

  const totalYearly = projects.reduce((sum, p) => {
    const stats = statsByProject[p.id]
    return sum + (stats?.downloads_year ?? 0)
  }, 0)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">
            Weekly Downloads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(totalWeekly)}
          </div>
          <p className="text-xs text-gray-500">
            Across {projects.length} projects
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">
            Monthly Downloads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(totalMonthly)}
          </div>
          <p className="text-xs text-gray-500">
            Last 30 days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">
            Yearly Downloads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(totalYearly)}
          </div>
          <p className="text-xs text-gray-500">
            Last 365 days
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

interface ProjectStatsTableProps {
  projects: Project[]
  statsByProject: Record<string, DownloadStats>
}

export function ProjectStatsTable({ projects, statsByProject }: ProjectStatsTableProps) {
  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  const sortedProjects = [...projects].sort((a, b) => {
    const aStats = statsByProject[a.id]
    const bStats = statsByProject[b.id]
    return (bStats?.downloads_week ?? 0) - (aStats?.downloads_week ?? 0)
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Project</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Daily</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Weekly</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Monthly</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Yearly</th>
          </tr>
        </thead>
        <tbody>
          {sortedProjects.map((project) => {
            const stats = statsByProject[project.id]
            const dockerTotal =
              project.package_manager === 'docker' &&
              typeof (stats?.raw_data as { pull_count?: number } | null)?.pull_count === 'number'
                ? (stats?.raw_data as { pull_count: number }).pull_count
                : null
            return (
              <tr key={project.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{project.name}</div>
                  <div className="text-xs text-gray-500">{project.package_name}</div>
                  {dockerTotal !== null ? (
                    <div className="text-xs text-gray-500">
                      Total pulls: {formatNumber(dockerTotal)}
                    </div>
                  ) : null}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {stats ? formatNumber(stats.downloads_day) : '-'}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {stats ? formatNumber(stats.downloads_week) : '-'}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {stats ? formatNumber(stats.downloads_month) : '-'}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {stats ? formatNumber(stats.downloads_year) : '-'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
