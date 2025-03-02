'use client'

import { useAuth } from './useAuth'

type Role = 'free' | 'premium' | 'administrator'

export const useAuthorization = () => {
  const { userRole, isAuthenticated, isLoading } = useAuth()

  // Helper to check if the user has at least a specific role level
  const hasMinimumRole = (requiredRole: Role): boolean => {
    if (isLoading || !isAuthenticated || !userRole) return false

    const roleValues: Record<Role, number> = {
      free: 0,
      premium: 1,
      administrator: 2,
    }

    return roleValues[userRole] >= roleValues[requiredRole]
  }

  // Specific role checks
  const isFree = (): boolean => isAuthenticated && userRole === 'free'
  const isPremium = (): boolean => hasMinimumRole('premium')
  const isAdmin = (): boolean => userRole === 'administrator'

  // Features access checks
  const canAccessPremiumContent = (): boolean => hasMinimumRole('premium')
  const canManageContent = (): boolean => userRole === 'administrator'
  const canManageUsers = (): boolean => userRole === 'administrator'

  return {
    hasMinimumRole,
    isFree,
    isPremium,
    isAdmin,
    canAccessPremiumContent,
    canManageContent,
    canManageUsers,
  }
} 