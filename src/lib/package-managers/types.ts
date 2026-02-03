import type { PackageManagerType } from '@/types/database'

export interface PackageStats {
  downloadsDay: number
  downloadsWeek: number
  downloadsMonth: number
  downloadsYear: number
  rawData?: Record<string, unknown>
}

export interface HistoricalDownloads {
  startDate: string
  endDate: string
  downloads: number
}

export interface PackageInfo {
  name: string
  description?: string
  version?: string
  homepage?: string
  repository?: string
}

export interface PackageManagerAdapter {
  type: PackageManagerType
  
  getPackageInfo(packageName: string): Promise<PackageInfo | null>
  
  getCurrentStats(packageName: string): Promise<PackageStats | null>
  
  getHistoricalDownloads(
    packageName: string,
    startDate: string,
    endDate: string
  ): Promise<HistoricalDownloads[]>
  
  validatePackageUrl(url: string): boolean
  
  extractPackageName(url: string): string | null
}
