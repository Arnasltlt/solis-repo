'use client'

import { ClientUserManagementPage } from './ClientUserManagementPage'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRoles } from '@/hooks/useAuth'
import type { User, AccessTier } from '@/lib/services/users'

interface ProtectedUserManagementProps {
  initialUsers: User[]
  accessTiers: AccessTier[]
}

export function ProtectedUserManagement(props: ProtectedUserManagementProps) {
  return (
    <ProtectedRoute requiredRole={UserRoles.ADMIN}>
      <ClientUserManagementPage {...props} />
    </ProtectedRoute>
  )
} 