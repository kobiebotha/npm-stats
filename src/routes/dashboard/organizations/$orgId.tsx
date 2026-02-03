import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrganization } from '@/hooks/use-organizations'
import { ProjectList } from '@/components/projects/project-list'

export const Route = createFileRoute('/dashboard/organizations/$orgId')({
  component: OrganizationDetailPage,
})

function OrganizationDetailPage() {
  const { orgId } = Route.useParams()
  const { data: organization, isLoading } = useOrganization(orgId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Organization not found</p>
        <Button asChild className="mt-4">
          <Link to="/dashboard/organizations">Back to Organizations</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/organizations">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">{organization.name}</h1>
          {organization.description && (
            <p className="text-gray-400 mt-1">{organization.description}</p>
          )}
        </div>
      </div>

      <ProjectList organizationId={orgId} />
    </div>
  )
}
