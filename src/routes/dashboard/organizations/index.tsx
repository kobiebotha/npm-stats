import { createFileRoute } from '@tanstack/react-router'
import { OrganizationList } from '@/components/organizations/organization-list'

export const Route = createFileRoute('/dashboard/organizations/')({
  component: OrganizationsPage,
})

function OrganizationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Organizations</h1>
        <p className="text-gray-400">Manage your organizations and their projects</p>
      </div>
      <OrganizationList />
    </div>
  )
}
