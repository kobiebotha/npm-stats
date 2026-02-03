export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PackageManagerType = 'npm' | 'nuget' | 'pypi' | 'maven' | 'cargo'
export type StatsRefreshMode = 'pending' | 'daily'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          description: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          package_name: string
          package_manager: PackageManagerType
          package_url: string | null
          description: string | null
          stats_refresh_mode: StatsRefreshMode
          stats_bootstrapped_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          package_name: string
          package_manager?: PackageManagerType
          package_url?: string | null
          description?: string | null
          stats_refresh_mode?: StatsRefreshMode
          stats_bootstrapped_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          package_name?: string
          package_manager?: PackageManagerType
          package_url?: string | null
          description?: string | null
          stats_refresh_mode?: StatsRefreshMode
          stats_bootstrapped_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      download_stats: {
        Row: {
          id: string
          project_id: string
          date: string
          downloads_day: number
          downloads_week: number
          downloads_month: number
          downloads_year: number
          raw_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          date: string
          downloads_day?: number
          downloads_week?: number
          downloads_month?: number
          downloads_year?: number
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          date?: string
          downloads_day?: number
          downloads_week?: number
          downloads_month?: number
          downloads_year?: number
          raw_data?: Json | null
          created_at?: string
        }
      }
      download_history: {
        Row: {
          id: string
          project_id: string
          start_date: string
          end_date: string
          downloads: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          start_date: string
          end_date: string
          downloads: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          start_date?: string
          end_date?: string
          downloads?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      package_manager_type: PackageManagerType
      stats_refresh_mode: StatsRefreshMode
    }
  }
}

export type Organization = Database['public']['Tables']['organizations']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type DownloadStats = Database['public']['Tables']['download_stats']['Row']
export type DownloadHistory = Database['public']['Tables']['download_history']['Row']
