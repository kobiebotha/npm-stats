import type {
  PackageManagerAdapter,
  PackageStats,
  HistoricalDownloads,
  PackageInfo,
} from './types'
import { format, subDays, subMonths, subYears } from 'date-fns'

const NPM_REGISTRY_URL = 'https://registry.npmjs.org'
const NPM_API_URL = 'https://api.npmjs.org'

export class NpmAdapter implements PackageManagerAdapter {
  type = 'npm' as const

  async getPackageInfo(packageName: string): Promise<PackageInfo | null> {
    try {
      const response = await fetch(`${NPM_REGISTRY_URL}/${encodeURIComponent(packageName)}`)
      if (!response.ok) return null

      const data = await response.json()
      const latest = data['dist-tags']?.latest
      const latestVersion = latest ? data.versions?.[latest] : null

      return {
        name: data.name,
        description: data.description,
        version: latest,
        homepage: latestVersion?.homepage || data.homepage,
        repository: typeof data.repository === 'string' 
          ? data.repository 
          : data.repository?.url,
      }
    } catch {
      return null
    }
  }

  async getCurrentStats(packageName: string): Promise<PackageStats | null> {
    try {
      const today = new Date()
      const yesterday = subDays(today, 1)
      const weekAgo = subDays(today, 7)
      const monthAgo = subMonths(today, 1)
      const yearAgo = subYears(today, 1)

      const formatDate = (d: Date) => format(d, 'yyyy-MM-dd')

      const [dayData, weekData, monthData, yearData] = await Promise.all([
        this.fetchDownloads(packageName, formatDate(yesterday), formatDate(yesterday)),
        this.fetchDownloads(packageName, formatDate(weekAgo), formatDate(yesterday)),
        this.fetchDownloads(packageName, formatDate(monthAgo), formatDate(yesterday)),
        this.fetchDownloads(packageName, formatDate(yearAgo), formatDate(yesterday)),
      ])

      return {
        downloadsDay: dayData?.downloads ?? 0,
        downloadsWeek: weekData?.downloads ?? 0,
        downloadsMonth: monthData?.downloads ?? 0,
        downloadsYear: yearData?.downloads ?? 0,
        rawData: {
          day: dayData,
          week: weekData,
          month: monthData,
          year: yearData,
        },
      }
    } catch {
      return null
    }
  }

  async getHistoricalDownloads(
    packageName: string,
    startDate: string,
    endDate: string
  ): Promise<HistoricalDownloads[]> {
    try {
      const response = await fetch(
        `${NPM_API_URL}/downloads/range/${startDate}:${endDate}/${encodeURIComponent(packageName)}`
      )
      
      if (!response.ok) return []

      const data = await response.json()
      
      if (!data.downloads || !Array.isArray(data.downloads)) {
        return []
      }

      return data.downloads.map((d: { day: string; downloads: number }) => ({
        startDate: d.day,
        endDate: d.day,
        downloads: d.downloads,
      }))
    } catch {
      return []
    }
  }

  private async fetchDownloads(
    packageName: string,
    startDate: string,
    endDate: string
  ): Promise<{ downloads: number; start: string; end: string } | null> {
    try {
      const response = await fetch(
        `${NPM_API_URL}/downloads/point/${startDate}:${endDate}/${encodeURIComponent(packageName)}`
      )
      if (!response.ok) return null
      return await response.json()
    } catch {
      return null
    }
  }

  validatePackageUrl(url: string): boolean {
    const patterns = [
      /^https?:\/\/(www\.)?npmjs\.com\/package\/[@\w\-./]+$/,
      /^[@\w\-./]+$/, // Just package name
    ]
    return patterns.some((p) => p.test(url))
  }

  extractPackageName(url: string): string | null {
    // If it's just a package name
    if (/^[@\w\-./]+$/.test(url) && !url.includes('://')) {
      return url
    }

    // Extract from npm URL
    const match = url.match(/npmjs\.com\/package\/([@\w\-./]+)/)
    return match ? match[1] : null
  }
}

export const npmAdapter = new NpmAdapter()
