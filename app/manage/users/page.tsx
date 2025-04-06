import { Metadata } from 'next'
import { getAccessTiers } from '@/lib/services/users'
import { serializeForClient } from '@/lib/utils/serialization'
import { ProtectedUserManagement } from './ProtectedUserManagement'
// We'll use client component wrapper approach instead of direct import
// import { ProtectedRoute } from '@/components/auth/protected-route'
// import { UserRoles } from '@/hooks/useAuth'

// Force dynamic rendering to avoid static generation issues with cookies
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'User Management | Solis',
  description: 'Solis platform user management dashboard',
}

export default async function UserManagementPage() {
  // Only get access tiers server-side, users will be loaded client-side
  const accessTiers = await getAccessTiers()

  // Serialize data before passing to client component
  const serializedAccessTiers = serializeForClient(accessTiers)

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <ProtectedUserManagement
        initialUsers={[]} // Empty array - users will be loaded client-side
        accessTiers={serializedAccessTiers}
      />
    </div>
  )
} 