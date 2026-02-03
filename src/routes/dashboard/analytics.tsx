import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
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
  const [showTrendlines, setShowTrendlines] = useState(true)

  const today = new Date()
  const [startDate, setStartDate] = useState(format(subDays(today, 90), 'yyyy-MM-dd'))
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

  const selectedOrgs = organizations?.filter(o => activeOrgIds.includes(o.id)) ?? []

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

      {projects && projects.length > 0 ? (
        <>
          <StatsSummary projects={projects} statsByProject={stats ?? {}} />

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
                projects={projects}
                historyByProject={history ?? {}}
                showTrendlines={showTrendlines}
              />
            </CardContent>
          </Card>

          <Separator />

          {selectedOrgs.map(org => {
            const orgProjects = projects.filter(p => p.organization_id === org.id)
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
