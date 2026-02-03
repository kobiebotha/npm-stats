import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/db'
import type { Project, PackageManagerType } from '@/types/database'
import { getPackageManagerAdapter } from '@/lib/package-managers'

export function useProjects(organizationId?: string) {
  return useQuery({
    queryKey: ['projects', organizationId],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      let query = supabase.from('projects').select('*')

      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data as Project[]
    },
  })
}

export function useProjectsByOrganizations(organizationIds: string[]) {
  return useQuery({
    queryKey: ['projects', 'byOrgs', organizationIds],
    queryFn: async () => {
      if (organizationIds.length === 0) return []
      
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .in('organization_id', organizationIds)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Project[]
    },
    enabled: organizationIds.length > 0,
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', 'detail', id],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Project
    },
    enabled: !!id,
  })
}

interface CreateProjectInput {
  organizationId: string
  name: string
  packageUrl: string
  packageManager?: PackageManagerType
  description?: string
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const packageManager = input.packageManager || 'npm'
      const adapter = getPackageManagerAdapter(packageManager)
      
      const packageName = adapter.extractPackageName(input.packageUrl)
      if (!packageName) {
        throw new Error('Invalid package URL or name')
      }

      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('projects')
        .insert({
          organization_id: input.organizationId,
          name: input.name,
          package_name: packageName,
          package_manager: packageManager,
          package_url: input.packageUrl,
          description: input.description,
        })
        .select()
        .single()

      if (error) throw error
      return data as Project
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', data.organization_id] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: string
      name?: string
      packageUrl?: string
      description?: string
      packageManager?: PackageManagerType
    }) => {
      const supabase = getSupabaseClient()
      
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (input.name) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description
      if (input.packageUrl) {
        const adapter = getPackageManagerAdapter(input.packageManager || 'npm')
        const packageName = adapter.extractPackageName(input.packageUrl)
        if (packageName) {
          updateData.package_name = packageName
          updateData.package_url = input.packageUrl
        }
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single()

      if (error) throw error
      return data as Project
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', data.id] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
