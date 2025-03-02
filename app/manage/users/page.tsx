import { Metadata } from 'next'
import { getUsers, getAccessTiers } from '@/lib/services/users'
import { ClientUserManagementPage } from './ClientUserManagementPage'
import { ProtectedRoute } from '@/components/auth/protected-route'

export const metadata: Metadata = {
  title: 'User Management | Solis Admin',
  description: 'Manage user access tiers and permissions',
}

export default async function UserManagementPage() {
  const users = await getUsers()
  const accessTiers = await getAccessTiers()

  return (
    <ProtectedRoute requiredRole="administrator">
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        <ClientUserManagementPage
          initialUsers={users}
          accessTiers={accessTiers}
        />
      </div>
    </ProtectedRoute>
  )
} 