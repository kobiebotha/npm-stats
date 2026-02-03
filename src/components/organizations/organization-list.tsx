import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Building2, Trash2, Edit2 } from 'lucide-react'
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
import { useOrganizations, useCreateOrganization, useDeleteOrganization } from '@/hooks/use-organizations'
import type { Organization } from '@/types/database'

export function OrganizationList() {
  const { data: organizations, isLoading } = useOrganizations()
  const createOrg = useCreateOrganization()
  const deleteOrg = useDeleteOrganization()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgDescription, setNewOrgDescription] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createOrg.mutateAsync({
      name: newOrgName,
      description: newOrgDescription || undefined,
    })
    setNewOrgName('')
    setNewOrgDescription('')
    setIsCreateOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this organization? All projects will be deleted.')) {
      await deleteOrg.mutateAsync(id)
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
        <h2 className="text-2xl font-bold text-white">Organizations</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Create a new organization to group your projects
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Name</Label>
                <Input
                  id="org-name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="My Organization"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-description">Description (optional)</Label>
                <Input
                  id="org-description"
                  value={newOrgDescription}
                  onChange={(e) => setNewOrgDescription(e.target.value)}
                  placeholder="A brief description..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={createOrg.isPending}>
                {createOrg.isPending ? 'Creating...' : 'Create Organization'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!organizations || organizations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-400 text-center">
              No organizations yet. Create one to start tracking packages.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <OrganizationCard
              key={org.id}
              organization={org}
              onDelete={() => handleDelete(org.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function OrganizationCard({
  organization,
  onDelete,
}: {
  organization: Organization
  onDelete: () => void
}) {
  return (
    <Card className="hover:border-cyan-500/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-lg">
              <Link
                to="/dashboard/organizations/$orgId"
                params={{ orgId: organization.id }}
                className="hover:text-cyan-400 transition-colors"
              >
                {organization.name}
              </Link>
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to="/dashboard/organizations/$orgId" params={{ orgId: organization.id }}>
                <Edit2 className="w-4 h-4" />
              </Link>
            </Button>
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
        {organization.description && (
          <CardDescription>{organization.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gray-500">
          Created {new Date(organization.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  )
}
