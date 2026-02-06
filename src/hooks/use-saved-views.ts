import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/db'
import type { SavedView, SavedViewConfig } from '@/types/database'

export function useSavedViews() {
  return useQuery({
    queryKey: ['saved-views'],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('saved_views')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as SavedView[]
    },
  })
}

export function useCreateSavedView() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; config: SavedViewConfig }) => {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('saved_views')
        .insert({
          name: input.name,
          config: input.config as unknown as Record<string, unknown>,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as SavedView
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views'] })
    },
  })
}

export function useDeleteSavedView() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('saved_views')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views'] })
    },
  })
}
