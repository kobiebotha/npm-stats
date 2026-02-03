import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/db'
import type { DownloadStats, DownloadHistory } from '@/types/database'

export function useLatestStats(projectId: string) {
  return useQuery({
    queryKey: ['stats', 'latest', projectId],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('download_stats')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as DownloadStats | null
    },
    enabled: !!projectId,
  })
}

export function useStatsForProjects(projectIds: string[]) {
  return useQuery({
    queryKey: ['stats', 'latest', projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return {}
      
      const supabase = getSupabaseClient()
      
      const results: Record<string, DownloadStats> = {}
      
      for (const projectId of projectIds) {
        const { data, error } = await supabase
          .from('download_stats')
          .select('*')
          .eq('project_id', projectId)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!error && data) {
          results[projectId] = data as DownloadStats
        }
      }

      return results
    },
    enabled: projectIds.length > 0,
  })
}

export function useDownloadHistory(
  projectId: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['history', projectId, startDate, endDate],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      let query = supabase
        .from('download_history')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true })

      if (startDate) {
        query = query.gte('start_date', startDate)
      }
      if (endDate) {
        query = query.lte('end_date', endDate)
      }

      const { data, error } = await query

      if (error) throw error
      return data as DownloadHistory[]
    },
    enabled: !!projectId,
  })
}

export function useDownloadHistoryForProjects(
  projectIds: string[],
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['history', 'multi', projectIds, startDate, endDate],
    queryFn: async () => {
      if (projectIds.length === 0) return {}
      
      const supabase = getSupabaseClient()
      let query = supabase
        .from('download_history')
        .select('*')
        .in('project_id', projectIds)
        .order('start_date', { ascending: true })

      if (startDate) {
        query = query.gte('start_date', startDate)
      }
      if (endDate) {
        query = query.lte('end_date', endDate)
      }

      const { data, error } = await query

      if (error) throw error

      const grouped: Record<string, DownloadHistory[]> = {}
      for (const item of data as DownloadHistory[]) {
        if (!grouped[item.project_id]) {
          grouped[item.project_id] = []
        }
        grouped[item.project_id].push(item)
      }

      return grouped
    },
    enabled: projectIds.length > 0,
  })
}

export function useBootstrapProjectStats() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.functions.invoke('scrape-npm-stats', {
        body: {
          projectId,
          mode: 'bootstrap',
        },
      })

      if (error) throw error
      return data
    },
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['history'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', projectId] })
    },
  })
}
