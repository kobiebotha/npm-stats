import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import regression from 'regression'
import type { DownloadHistory, Project } from '@/types/database'

interface DownloadsChartProps {
  projects: Project[]
  historyByProject: Record<string, DownloadHistory[]>
  showTrendlines?: boolean
}

const COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#ec4899', // pink
  '#3b82f6', // blue
  '#84cc16', // lime
]

export function DownloadsChart({
  projects,
  historyByProject,
  showTrendlines = false,
}: DownloadsChartProps) {
  type ChartDataPoint = { date: string } & Record<string, number | string>

  const chartData = useMemo((): ChartDataPoint[] => {
    const dateMap = new Map<string, Record<string, number>>()

    const parseDate = (value: string) => new Date(`${value}T00:00:00Z`)
    const toDateString = (value: Date) => value.toISOString().slice(0, 10)
    const addDays = (value: Date, days: number) => {
      const next = new Date(value)
      next.setUTCDate(next.getUTCDate() + days)
      return next
    }

    for (const project of projects) {
      const history = [...(historyByProject[project.id] || [])].sort((a, b) =>
        a.start_date.localeCompare(b.start_date)
      )

      if (history.length === 0) continue

      const points = history.map((entry) => ({
        date: entry.start_date,
        downloads: entry.downloads,
      }))

      for (let i = 0; i < points.length; i += 1) {
        const current = points[i]
        const next = points[i + 1]

        const currentDate = parseDate(current.date)
        const currentValue = current.downloads

        if (!dateMap.has(current.date)) {
          dateMap.set(current.date, {})
        }
        dateMap.get(current.date)![project.id] = currentValue

        if (!next) continue

        const nextDate = parseDate(next.date)
        const nextValue = next.downloads

        const days =
          (nextDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000)
        if (days <= 1) continue

        for (let step = 1; step < days; step += 1) {
          const ratio = step / days
          const interpolated = Math.round(
            currentValue + (nextValue - currentValue) * ratio
          )
          const date = toDateString(addDays(currentDate, step))
          if (!dateMap.has(date)) {
            dateMap.set(date, {})
          }
          dateMap.get(date)![project.id] = interpolated
        }
      }
    }

    const sortedDates = Array.from(dateMap.keys()).sort()
    return sortedDates.map((date) => ({
      date,
      ...dateMap.get(date),
    } as ChartDataPoint))
  }, [projects, historyByProject])

  const trendlineData = useMemo(() => {
    if (!showTrendlines || chartData.length < 2) return {}

    const trendlines: Record<string, { slope: number; intercept: number }> = {}

    for (const project of projects) {
      const points: [number, number][] = chartData
        .map((d, i) => [i, d[project.id] as number] as [number, number])
        .filter(([, y]) => y !== undefined)

      if (points.length >= 2) {
        const result = regression.linear(points)
        trendlines[project.id] = {
          slope: result.equation[0],
          intercept: result.equation[1],
        }
      }
    }

    return trendlines
  }, [chartData, projects, showTrendlines])

  const chartDataWithTrends = useMemo((): ChartDataPoint[] => {
    if (!showTrendlines || Object.keys(trendlineData).length === 0) {
      return chartData
    }

    return chartData.map((d, i) => {
      const withTrends: ChartDataPoint = { ...d }
      for (const project of projects) {
        const trend = trendlineData[project.id]
        if (trend) {
          withTrends[`${project.id}_trend`] = trend.slope * i + trend.intercept
        }
      }
      return withTrends
    })
  }, [chartData, trendlineData, projects, showTrendlines])

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
    return n.toString()
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No download history available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartDataWithTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af' }}
        />
        <YAxis
          tickFormatter={formatNumber}
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#fff' }}
          formatter={(value: number, name?: string) => {
            if (name?.includes('(trend)')) return null
            return [formatNumber(value), name ?? '']
          }}
          labelFormatter={formatDate}
        />
        <Legend />
        {projects.map((project, index) => (
          <Line
            key={project.id}
            type="monotone"
            dataKey={project.id}
            name={project.name}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
        {showTrendlines &&
          projects.map((project, index) => (
            <Line
              key={`${project.id}_trend`}
              type="monotone"
              dataKey={`${project.id}_trend`}
              name={`${project.name} (trend)`}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              legendType="none"
            />
          ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
