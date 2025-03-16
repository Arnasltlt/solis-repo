'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User,
  Session,
  AuthError,
  AuthResponse
} from '@supabase/supabase-js'
import { useSupabase } from '@/components/supabase-provider'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  userRole: 'free' | 'premium' | 'administrator' | null
  signUp: (email: string, password: string) => Promise<AuthResponse>
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signOut: () => Promise<{ error: AuthError | null }>
  passwordReset: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { supabase, session: initialSession } = useSupabase()
  const [session, setSession] = useState<Session | null>(initialSession)
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<'free' | 'premium' | 'administrator' | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  // Update the session and user when auth state changes
  useEffect(() => {
    if (!supabase) return
    
    console.log('Setting up auth state change listener')
    
    // First, immediately check the current session state
    const checkCurrentSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          console.log('Initial session found:', data.session.user.email)
          setSession(data.session)
          setUser(data.session.user)
          setIsAuthenticated(true)
        } else {
          console.log('No initial session found')
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Error checking initial session:', error)
        setIsLoading(false)
      }
    }
    
    checkCurrentSession()
    
    // Then set up the listener for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      setSession(session)
      setUser(session?.user || null)
      setIsAuthenticated(!!session?.user)
      setIsLoading(false)
    })

    return () => {
      console.log('Unsubscribing from auth state changes')
      subscription.unsubscribe()
    }
  }, [supabase])

  // Fetch the user role from the database
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !supabase) return
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('subscription_tier_id')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Error fetching user role:', error)
          return
        }
        
        if (data?.subscription_tier_id) {
          // Get the tier name from the access_tiers table
          const { data: tierData, error: tierError } = await supabase
            .from('access_tiers')
            .select('name')
            .eq('id', data.subscription_tier_id)
            .single()
            
          if (tierError) {
            console.error('Error fetching tier data:', tierError)
            return
          }
          
          setUserRole(tierData?.name as 'free' | 'premium' | 'administrator')
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error)
      }
    }
    
    fetchUserRole()
  }, [user, supabase])

  // Authentication methods
  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    try {
      console.log('Attempting signup with email:', email)
      // Include the redirect URL for email confirmation
      const response = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      })
      
      console.log('Supabase signUp response:', response)
      return response
    } catch (error) {
      console.error('Error in signUp method:', error)
      throw error
    }
  }
  
  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized')
    return await supabase.auth.signInWithPassword({ email, password })
  }
  
  const signOut = async () => {
    if (!supabase) throw new Error('Supabase client not initialized')
    return await supabase.auth.signOut()
  }
  
  const passwordReset = async (email: string) => {
    if (!supabase) throw new Error('Supabase client not initialized')
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  }
  
  const updatePassword = async (password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized')
    return await supabase.auth.updateUser({ password })
  }

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated,
    userRole,
    signUp,
    signIn,
    signOut,
    passwordReset,
    updatePassword,
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