import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOrganizations } from '@/hooks/use-organizations'
import { useProjectsByOrganizations } from '@/hooks/use-projects'
import { useStatsForProjects, useDownloadHistoryForProjects } from '@/hooks/use-stats'
import { DownloadsChart } from '@/components/charts/downloads-chart'
import { StatsSummary, ProjectStatsTable } from '@/components/charts/stats-summary'
import { DateRangePicker } from '@/components/charts/date-range-picker'
import { Building2, Package, TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardOverview,
})

function DashboardOverview() {
  const { data: organizations, isLoading: orgsLoading } = useOrganizations()
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([])
  const [showTrendlines, setShowTrendlines] = useState(false)

  const today = new Date()
  const [startDate, setStartDate] = useState(format(subDays(today, 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'))

  const activeOrgIds = selectedOrgIds.length > 0 
    ? selectedOrgIds 
    : (organizations?.slice(0, 3).map(o => o.id) ?? [])

  const { data: projects } = useProjectsByOrganizations(activeOrgIds)
  const projectIds = projects?.map(p => p.id) ?? []
  const { data: stats } = useStatsForProjects(projectIds)
  const { data: history } = useDownloadHistoryForProjects(projectIds, startDate, endDate)

  const handleOrgToggle = (orgId: string) => {
    setSelectedOrgIds(prev => {
      if (prev.includes(orgId)) {
        return prev.filter(id => id !== orgId)
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), orgId]
      }
      return [...prev, orgId]
    })
  }

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    )
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Adoption Tracker</h2>
        <p className="text-gray-400 mb-6">
          Get started by creating your first organization and adding npm packages to track.
        </p>
        <Button asChild>
          <Link to="/dashboard/organizations">Create Organization</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of package adoption across your organizations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{organizations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{projects?.length ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Weekly Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats ? formatNumber(
                Object.values(stats).reduce((sum, s) => sum + (s?.downloads_week ?? 0), 0)
              ) : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Organizations</CardTitle>
            <p className="text-sm text-gray-400">Select up to 3 to compare</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {organizations.map(org => (
              <Button
                key={org.id}
                variant={activeOrgIds.includes(org.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleOrgToggle(org.id)}
              >
                {org.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {projects && projects.length > 0 && (
        <>
          <StatsSummary projects={projects} statsByProject={stats ?? {}} />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>Download Trends</CardTitle>
                <div className="flex items-center gap-4">
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onRangeChange={(start, end) => {
                      setStartDate(start)
                      setEndDate(end)
                    }}
                  />
                  <Button
                    variant={showTrendlines ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowTrendlines(!showTrendlines)}
                  >
                    Trendlines
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DownloadsChart
                projects={projects}
                historyByProject={history ?? {}}
                showTrendlines={showTrendlines}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectStatsTable projects={projects} statsByProject={stats ?? {}} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function formatNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}
