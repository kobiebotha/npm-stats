import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0'

const NPM_API_URL = 'https://api.npmjs.org'

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
      .eq('package_manager', 'npm')

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
