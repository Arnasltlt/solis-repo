'use client'

import { useAuth, UserRoles } from './useAuth'

type Role = 'free' | 'premium' | 'administrator'

export const useAuthorization = () => {
  const { user, loading } = useAuth()

  const currentUserRole = user?.role as Role | undefined | null



  const hasMinimumRole = (requiredRole: Role): boolean => {
    if (loading || !user || !currentUserRole) return false

    const roleValues: Record<Role, number> = {
      [UserRoles.FREE]: 0,
      [UserRoles.PREMIUM]: 1,
      [UserRoles.ADMIN]: 2,
    }

    if (!(currentUserRole in roleValues)) {
        return false;
    }

    const userRoleValue = roleValues[currentUserRole];
    const requiredRoleValue = roleValues[requiredRole] || 999;
    return userRoleValue >= requiredRoleValue
  }

  const isFree = (): boolean => !!user && currentUserRole === UserRoles.FREE
  const isPremium = (): boolean => hasMinimumRole(UserRoles.PREMIUM)
  const isAdmin = (): boolean => !!user && currentUserRole === UserRoles.ADMIN

  const canAccessPremiumContent = (): boolean => hasMinimumRole(UserRoles.PREMIUM)
  const canManageContent = (): boolean => isAdmin()
  const canManageUsers = (): boolean => isAdmin()

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