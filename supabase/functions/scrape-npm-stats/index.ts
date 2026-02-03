import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0'

const NPM_API_URL = 'https://api.npmjs.org'
const DOCKER_HUB_API = 'https://hub.docker.com/v2/repositories'

interface Project {
  id: string
  package_name: string
  package_manager: string
  stats_refresh_mode?: string | null
}

interface DownloadResponse {
  downloads: number
  start: string
  end: string
  package: string
}

interface DailyDownload {
  day: string
  downloads: number
}

interface RangeResponse {
  downloads: Array<DailyDownload>
  start: string
  end: string
  package: string
}

interface DockerPullResponse {
  pull_count?: number
}

async function fetchNpmDownloads(
  packageName: string,
  period: string
): Promise<DownloadResponse | null> {
  try {
    const response = await fetch(
      `${NPM_API_URL}/downloads/point/${period}/${encodeURIComponent(packageName)}`
    )
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

async function fetchNpmDownloadsRange(
  packageName: string,
  startDate: string,
  endDate: string
): Promise<RangeResponse | null> {
  try {
    const response = await fetch(
      `${NPM_API_URL}/downloads/range/${startDate}:${endDate}/${encodeURIComponent(packageName)}`
    )
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function subDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

function subMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() - months)
  return result
}

function subYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() - years)
  return result
}

function parseDockerImage(image: string): { namespace: string; repository: string; tag?: string } | null {
  const trimmed = image.trim()

  try {
    const url = new URL(trimmed)
    if (url.hostname.includes('hub.docker.com')) {
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts[0] === 'r' && parts.length >= 3) {
        return {
          namespace: parts[1],
          repository: parts[2],
          tag: url.searchParams.get('name') || undefined,
        }
      }
    }
  } catch {
    // Not a URL.
  }

  const withoutDigest = trimmed.split('@')[0]
  const [namePart, tag] = withoutDigest.split(':')
  if (!namePart) return null

  const segments = namePart.split('/').filter(Boolean)
  if (segments.length === 1) {
    return { namespace: 'library', repository: segments[0], tag }
  }
  if (segments.length === 2) {
    return { namespace: segments[0], repository: segments[1], tag }
  }
  return null
}

async function fetchDockerPullCount(image: string): Promise<{ pulls: number; tag?: string } | null> {
  const ref = parseDockerImage(image)
  if (!ref) return null

  const namespace = encodeURIComponent(ref.namespace)
  const repository = encodeURIComponent(ref.repository)

  const fetchPulls = async (url: string): Promise<number | null> => {
    const response = await fetch(url)
    if (!response.ok) return null
    const data = (await response.json()) as DockerPullResponse
    return typeof data.pull_count === 'number' ? data.pull_count : null
  }

  if (ref.tag) {
    const tag = encodeURIComponent(ref.tag)
    const tagPulls = await fetchPulls(`${DOCKER_HUB_API}/${namespace}/${repository}/tags/${tag}/`)
    if (typeof tagPulls === 'number') {
      return { pulls: tagPulls, tag: ref.tag }
    }
  }

  const repoPulls = await fetchPulls(`${DOCKER_HUB_API}/${namespace}/${repository}/`)
  if (typeof repoPulls !== 'number') return null
  return { pulls: repoPulls, tag: ref.tag }
}

type ScrapeMode = 'daily' | 'bootstrap'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload = await req.json().catch(() => null)
    const mode = (payload?.mode as ScrapeMode | undefined) ?? 'daily'
    const projectId = typeof payload?.projectId === 'string' ? payload.projectId : undefined

    let projectsQuery = supabase
      .from('projects')
      .select('id, package_name, package_manager, stats_refresh_mode')
      .in('package_manager', ['npm', 'docker'])

    if (mode === 'daily') {
      projectsQuery = projectsQuery.eq('stats_refresh_mode', 'daily')
    }

    if (projectId) {
      projectsQuery = projectsQuery.eq('id', projectId)
    }

    const { data: projects, error: projectsError } = await projectsQuery

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`)
    }

    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No npm projects to scrape', processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const today = new Date()
    const yesterday = subDays(today, 1)
    const weekAgo = subDays(today, 7)
    const yearAgo = subYears(today, 1)
    const monthAgo = subMonths(today, 1)
    const historyStart = mode === 'bootstrap' ? subDays(today, 365) : monthAgo

    const todayStr = formatDate(today)
    const yesterdayStr = formatDate(yesterday)
    const weekAgoStr = formatDate(weekAgo)
    const monthAgoStr = formatDate(monthAgo)
    const yearAgoStr = formatDate(yearAgo)
    const historyStartStr = formatDate(historyStart)

    const results: Array<{ projectId: string; success: boolean; error?: string }> = []

    for (const project of projects as Project[]) {
      try {
        if (project.package_manager === 'npm') {
          const [dayData, weekData, monthData, yearData] = await Promise.all([
            fetchNpmDownloads(project.package_name, `${yesterdayStr}:${yesterdayStr}`),
            fetchNpmDownloads(project.package_name, `${weekAgoStr}:${yesterdayStr}`),
            fetchNpmDownloads(project.package_name, `${monthAgoStr}:${yesterdayStr}`),
            fetchNpmDownloads(project.package_name, `${yearAgoStr}:${yesterdayStr}`),
          ])

          const { error: statsError } = await supabase
            .from('download_stats')
            .upsert({
              project_id: project.id,
              date: todayStr,
              downloads_day: dayData?.downloads ?? 0,
              downloads_week: weekData?.downloads ?? 0,
              downloads_month: monthData?.downloads ?? 0,
              downloads_year: yearData?.downloads ?? 0,
              raw_data: {
                day: dayData,
                week: weekData,
                month: monthData,
                year: yearData,
              },
            }, {
              onConflict: 'project_id,date',
            })

          if (statsError) {
            throw new Error(`Failed to upsert stats: ${statsError.message}`)
          }

          const rangeData = await fetchNpmDownloadsRange(
            project.package_name,
            historyStartStr,
            yesterdayStr
          )

          if (rangeData?.downloads) {
            const historyRecords = rangeData.downloads.map((d) => ({
              project_id: project.id,
              start_date: d.day,
              end_date: d.day,
              downloads: d.downloads,
            }))

            const { error: historyError } = await supabase
              .from('download_history')
              .upsert(historyRecords, {
                onConflict: 'project_id,start_date,end_date',
              })

            if (historyError) {
              throw new Error(`Failed to upsert history: ${historyError.message}`)
            }
          }
        }

        if (project.package_manager === 'docker') {
          const pullInfo = await fetchDockerPullCount(project.package_name)
          if (!pullInfo) {
            throw new Error('Failed to fetch Docker Hub pull count')
          }

          const { data: latestStats } = await supabase
            .from('download_stats')
            .select('raw_data')
            .eq('project_id', project.id)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle()

          const previousTotal = (latestStats?.raw_data as { pull_count?: number } | null)?.pull_count
          const hasBaseline = typeof previousTotal === 'number'
          const downloadsDay = hasBaseline
            ? Math.max(pullInfo.pulls - previousTotal, 0)
            : pullInfo.pulls

          const { error: historyError } = await supabase
            .from('download_history')
            .upsert({
              project_id: project.id,
              start_date: todayStr,
              end_date: todayStr,
              downloads: pullInfo.pulls,
            }, {
              onConflict: 'project_id,start_date,end_date',
            })

          if (historyError) {
            throw new Error(`Failed to upsert history: ${historyError.message}`)
          }

          const { data: historyRows, error: historyFetchError } = await supabase
            .from('download_history')
            .select('start_date, downloads')
            .eq('project_id', project.id)
            .gte('start_date', yearAgoStr)
            .order('start_date', { ascending: true })

          if (historyFetchError) {
            throw new Error(`Failed to fetch history: ${historyFetchError.message}`)
          }

          const computeDelta = (rows: Array<{ start_date: string; downloads: number }>) => {
            if (rows.length === 0) return 0
            if (rows.length === 1) return rows[0].downloads
            const first = rows[0].downloads
            const last = rows[rows.length - 1].downloads
            return Math.max(last - first, 0)
          }

          const rows = historyRows ?? []
          const rowsWeek = rows.filter((row) => row.start_date >= weekAgoStr)
          const rowsMonth = rows.filter((row) => row.start_date >= monthAgoStr)
          const rowsYear = rows.filter((row) => row.start_date >= yearAgoStr)

          const totals = {
            week: computeDelta(rowsWeek),
            month: computeDelta(rowsMonth),
            year: computeDelta(rowsYear),
          }

          const { error: statsError } = await supabase
            .from('download_stats')
            .upsert({
              project_id: project.id,
              date: todayStr,
              downloads_day: downloadsDay,
              downloads_week: totals.week,
              downloads_month: totals.month,
              downloads_year: totals.year,
              raw_data: {
                pull_count: pullInfo.pulls,
                tag: pullInfo.tag,
                baseline: !hasBaseline,
              },
            }, {
              onConflict: 'project_id,date',
            })

          if (statsError) {
            throw new Error(`Failed to upsert stats: ${statsError.message}`)
          }
        }

        if (mode === 'bootstrap') {
          await supabase
            .from('projects')
            .update({
              stats_refresh_mode: 'daily',
              stats_bootstrapped_at: today.toISOString(),
              updated_at: today.toISOString(),
            })
            .eq('id', project.id)
        }

        results.push({ projectId: project.id, success: true })

        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        results.push({
          projectId: project.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return new Response(
      JSON.stringify({
        message: `Processed ${projects.length} projects`,
        successful,
        failed,
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
