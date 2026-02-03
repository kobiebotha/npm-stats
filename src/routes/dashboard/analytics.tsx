import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { format, subDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useOrganizations } from '@/hooks/use-organizations'
import { useProjectsByOrganizations } from '@/hooks/use-projects'
import { useStatsForProjects, useDownloadHistoryForProjects } from '@/hooks/use-stats'
import { DownloadsChart } from '@/components/charts/downloads-chart'
import { StatsSummary, ProjectStatsTable } from '@/components/charts/stats-summary'
import { DateRangePicker } from '@/components/charts/date-range-picker'

export const Route = createFileRoute('/dashboard/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { data: organizations } = useOrganizations()
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([])
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[] | null>(null)
  const [showTrendlines, setShowTrendlines] = useState(true)

  const today = new Date()
  const [startDate, setStartDate] = useState(format(subDays(today, 90), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'))

  const activeOrgIds = selectedOrgIds.length > 0 
    ? selectedOrgIds 
    : (organizations?.slice(0, 3).map(o => o.id) ?? [])

  const { data: projects } = useProjectsByOrganizations(activeOrgIds)
  const projectIds = projects?.map(p => p.id) ?? []
  const activeProjectIds = (selectedProjectIds ?? projectIds).filter((id) =>
    projectIds.includes(id)
  )
  const activeProjects = projects?.filter((p) => activeProjectIds.includes(p.id)) ?? []
  const { data: stats } = useStatsForProjects(activeProjectIds)
  const { data: history } = useDownloadHistoryForProjects(activeProjectIds, startDate, endDate)

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

  const selectedOrgs = organizations?.filter(o => activeOrgIds.includes(o.id)) ?? []

  const vendorHistory = useMemo(() => {
    if (!projects || !history) return {}

    const historyByVendor: Record<string, typeof history[string]> = {}

    for (const org of selectedOrgs) {
      const orgProjects = activeProjects.filter((p) => p.organization_id === org.id)
      const dateMap = new Map<string, number>()

      for (const project of orgProjects) {
        const entries = history[project.id] ?? []
        for (const entry of entries) {
          const current = dateMap.get(entry.start_date) ?? 0
          dateMap.set(entry.start_date, current + entry.downloads)
        }
      }

      const rows = Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, downloads]) => ({
          id: `${org.id}-${date}`,
          project_id: org.id,
          start_date: date,
          end_date: date,
          downloads,
          created_at: date,
        }))

      historyByVendor[org.id] = rows
    }

    return historyByVendor
  }, [activeProjects, history, projects, selectedOrgs])

  const toggleProject = (projectId: string) => {
    const current = selectedProjectIds ?? projectIds
    if (current.includes(projectId)) {
      setSelectedProjectIds(current.filter((id) => id !== projectId))
      return
    }
    setSelectedProjectIds([...current, projectId])
  }

  const selectAllProjects = () => {
    setSelectedProjectIds(projectIds)
  }

  const clearProjects = () => {
    setSelectedProjectIds([])
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-gray-400">Deep dive into package adoption trends</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {organizations?.map(org => (
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
          {selectedOrgs.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-400">Viewing:</span>
              {selectedOrgs.map(org => (
                <Badge key={org.id} variant="secondary">{org.name}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {projects && projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm text-gray-400">
                Showing {activeProjectIds.length} of {projects.length} projects
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAllProjects}>
                  Select all
                </Button>
                <Button variant="outline" size="sm" onClick={clearProjects}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {projects.map((project) => {
                const isActive = activeProjectIds.includes(project.id)
                return (
                  <Button
                    key={project.id}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleProject(project.id)}
                  >
                    {project.name}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {activeProjects.length > 0 ? (
        <>
          <StatsSummary projects={activeProjects} statsByProject={stats ?? {}} />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>Download History</CardTitle>
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
                projects={activeProjects}
                historyByProject={history ?? {}}
                showTrendlines={showTrendlines}
              />
            </CardContent>
          </Card>

          {selectedOrgs.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle>Vendor Trends</CardTitle>
                  <div className="text-sm text-gray-400">
                    Aggregated by organization
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DownloadsChart
                  projects={selectedOrgs.map((org) => ({
                    id: org.id,
                    name: org.name,
                    organization_id: org.id,
                    package_name: org.name,
                    package_manager: 'npm',
                    package_url: null,
                    description: null,
                    created_at: '',
                    updated_at: '',
                  }))}
                  historyByProject={vendorHistory}
                  showTrendlines={showTrendlines}
                />
              </CardContent>
            </Card>
          )}

          <Separator />

          {selectedOrgs.map(org => {
            const orgProjects = activeProjects.filter(p => p.organization_id === org.id)
            if (orgProjects.length === 0) return null

            return (
              <Card key={org.id}>
                <CardHeader>
                  <CardTitle>{org.name} - Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectStatsTable projects={orgProjects} statsByProject={stats ?? {}} />
                </CardContent>
              </Card>
            )
          })}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">
              {organizations?.length === 0
                ? 'Create an organization and add projects to see analytics'
                : 'Select organizations to view their analytics'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
