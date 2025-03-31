'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { redirect, useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { toast } from '@/components/ui/use-toast'

export interface AuthUser {
  id: string
  email?: string
  role?: string
}

export interface AuthContext {
  user: AuthUser | null
  session: any | null
  loading: boolean
  signUp: (email: string, password: string, metadata?: object) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  userRole: UserRoles | null
  isAuthenticated: boolean
}

export enum UserRoles {
  FREE = 'free',
  PREMIUM = 'premium',
  ADMIN = 'administrator',
}

export function getUserRole(role: string | undefined): UserRoles | null {
  if (!role) return null
  if (Object.values(UserRoles).includes(role as UserRoles)) {
    return role as UserRoles
  }
  return null
}

export const AuthContext = createContext<AuthContext>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  userRole: null,
  isAuthenticated: false,
})

export function AuthProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode
  initialSession: any | null
}) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [session, setSession] = useState(initialSession)
  const [user, setUser] = useState<AuthUser | null>(initialSession?.user || null)
  const [userRole, setUserRole] = useState<UserRoles | null>(getUserRole(initialSession?.user?.role))
  const [loading, setLoading] = useState<boolean>(false)

  // Listen for changes to auth state
  useEffect(() => {
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setUserRole(getUserRole(session?.user?.role))
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Sign up the user
  const signUp = async (email: string, password: string, metadata?: object) => {
    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Authentication service unavailable.',
      })
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        throw error
      }

      // Redirect the user to the confirmation page
      toast({
        title: 'Success',
        description:
          'Registration successful! Please check your email for a confirmation link.',
      })
      router.push('/auth/confirm')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred during sign up.',
      })
      console.error('Error signing up:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sign in the user
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Authentication service unavailable.',
      })
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Redirect the user to the home page
      router.push('/')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred during sign in.',
      })
      console.error('Error signing in:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sign out the user
  const signOut = async () => {
    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Authentication service unavailable.',
      })
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      // Reset the user state
      setUser(null)
      setUserRole(null)

      // Redirect the user to the home page
      router.push('/')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred during sign out.',
      })
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  // Reset the user's password
  const resetPassword = async (email: string) => {
    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Authentication service unavailable.',
      })
      return
    }

    try {
      setLoading(true)
      // Use a safe approach to get origin for redirectTo
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/update-password`,
      })

      if (error) {
        throw error
      }

      toast({
        title: 'Success',
        description:
          'Password reset email sent! Please check your email for further instructions.',
      })
      router.push('/auth/confirm')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred during password reset.',
      })
      console.error('Error resetting password:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update the user's password
  const updatePassword = async (password: string) => {
    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Authentication service unavailable.',
      })
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        throw error
      }

      toast({
        title: 'Success',
        description: 'Password updated successfully!',
      })
      router.push('/')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred during password update.',
      })
      console.error('Error updating password:', error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    userRole,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 