import { useState } from 'react'
import { Plus, Package, Trash2, ExternalLink, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/use-projects'
import { useStatsForProjects, useBootstrapProjectStats } from '@/hooks/use-stats'
import type { Project, PackageManagerType } from '@/types/database'

interface ProjectListProps {
  organizationId: string
}

export function ProjectList({ organizationId }: ProjectListProps) {
  const { data: projects, isLoading } = useProjects(organizationId)
  const projectIds = projects?.map((p) => p.id) ?? []
  const { data: stats } = useStatsForProjects(projectIds)
  const bootstrapStats = useBootstrapProjectStats()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newPackageUrl, setNewPackageUrl] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPackageManager, setNewPackageManager] = useState<PackageManagerType>('npm')
  const [bootstrapErrors, setBootstrapErrors] = useState<Record<string, string>>({})

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createProject.mutateAsync({
      organizationId,
      name: newProjectName,
      packageUrl: newPackageUrl,
      packageManager: newPackageManager,
      description: newDescription || undefined,
    })
    setNewProjectName('')
    setNewPackageUrl('')
    setNewDescription('')
    setNewPackageManager('npm')
    setIsCreateOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject.mutateAsync(id)
    }
  }

  const handleBootstrap = async (id: string) => {
    try {
      const data = await bootstrapStats.mutateAsync(id)
      const failed = typeof data?.failed === 'number' ? data.failed : 0
      if (failed > 0) {
        const firstError = data?.results?.find((r: { success: boolean }) => !r.success)
        const message = firstError?.error || 'Bootstrap failed. Check function logs.'
        setBootstrapErrors((prev) => ({ ...prev, [id]: message }))
        return
      }
      setBootstrapErrors((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bootstrap failed. Check function logs.'
      setBootstrapErrors((prev) => ({ ...prev, [id]: message }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Projects</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Project</DialogTitle>
              <DialogDescription>
                Add a package or image to track adoption metrics
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Display Name</Label>
                <Input
                  id="project-name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="React Query"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-manager">Package Manager</Label>
                <Select
                  value={newPackageManager}
                  onValueChange={(value) => setNewPackageManager(value as PackageManagerType)}
                >
                  <SelectTrigger id="package-manager" className="w-full">
                    <SelectValue placeholder="Select a package manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="npm">npm</SelectItem>
                    <SelectItem value="docker">docker hub</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-url">Package Name or URL</Label>
                <Input
                  id="package-url"
                  value={newPackageUrl}
                  onChange={(e) => setNewPackageUrl(e.target.value)}
                  placeholder={
                    newPackageManager === 'docker'
                      ? 'namespace/repo:tag or https://hub.docker.com/r/...'
                      : '@tanstack/react-query or https://npmjs.com/package/...'
                  }
                  required
                />
                <p className="text-xs text-gray-500">
                  {newPackageManager === 'docker'
                    ? 'Enter a Docker Hub image (namespace/repo:tag) or URL'
                    : 'Enter the npm package name or full URL'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description (optional)</Label>
                <Input
                  id="project-description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="A brief description..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={createProject.isPending}>
                {createProject.isPending ? 'Adding...' : 'Add Project'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!projects || projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-400 text-center">
              No projects yet. Add an npm package to start tracking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              stats={stats?.[project.id]}
              onBootstrap={() => handleBootstrap(project.id)}
              isBootstrapping={
                bootstrapStats.isPending && bootstrapStats.variables === project.id
              }
              bootstrapError={bootstrapErrors[project.id]}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({
  project,
  stats,
  onBootstrap,
  isBootstrapping,
  bootstrapError,
  onDelete,
}: {
  project: Project
  stats?: { downloads_week: number; downloads_month: number }
  onBootstrap: () => void
  isBootstrapping: boolean
  bootstrapError?: string
  onDelete: () => void
}) {
  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  const resolvePackageUrl = () => {
    if (!project.package_url) return null
    if (project.package_url.startsWith('http')) return project.package_url

    if (project.package_manager === 'docker') {
      const [image, tag] = project.package_name.split(':')
      const base = `https://hub.docker.com/r/${image}`
      return tag ? `${base}/tags?name=${encodeURIComponent(tag)}` : base
    }

    return `https://npmjs.com/package/${project.package_name}`
  }

  return (
    <Card className="hover:border-cyan-500/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-lg">{project.name}</CardTitle>
          </div>
          <div className="flex gap-1">
            {resolvePackageUrl() && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a
                  href={resolvePackageUrl() ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-400 hover:text-red-300"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{project.package_manager}</Badge>
          <code className="text-xs text-gray-400">{project.package_name}</code>
        </div>
        {project.description && (
          <CardDescription className="mt-2">{project.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stats ? (
            <>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Weekly:</span>{' '}
                  <span className="text-gray-900 font-medium">
                    {formatNumber(stats.downloads_week)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Monthly:</span>{' '}
                  <span className="text-gray-900 font-medium">
                    {formatNumber(stats.downloads_month)}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500">Daily refresh enabled.</p>
            </>
          ) : (
            <p className="text-xs text-gray-500">No stats available yet</p>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={onBootstrap}
            className="gap-2"
          >
            <History className="w-4 h-4" />
            {isBootstrapping
              ? 'Fetching history...'
              : project.stats_bootstrapped_at
                ? 'Re-fetch history'
                : 'Fetch history'}
          </Button>
          {bootstrapError ? (
            <p className="text-[11px] text-red-400">{bootstrapError}</p>
          ) : null}
          <p className="text-[11px] text-gray-500">
            {project.stats_bootstrapped_at
              ? 'Rebuilds history and keeps daily refresh on.'
              : 'Runs once to backfill history, then enables daily refresh.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
