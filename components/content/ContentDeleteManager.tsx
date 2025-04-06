'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

// Create a context to manage content deletion across components
type ContentDeleteContextType = {
  recentlyDeletedIds: string[]
  registerDelete: (contentId: string) => void
  isDeleted: (contentId: string) => boolean
}

const ContentDeleteContext = createContext<ContentDeleteContextType>({
  recentlyDeletedIds: [],
  registerDelete: () => {},
  isDeleted: () => false
})

// Provider component
export function ContentDeleteProvider({ children }: { children: ReactNode }) {
  const [recentlyDeletedIds, setRecentlyDeletedIds] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)
  
  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const registerDelete = useCallback((contentId: string) => {
    if (isMounted) {
      setRecentlyDeletedIds(prev => [...prev, contentId])
    }
  }, [isMounted])

  const isDeleted = useCallback((contentId: string) => {
    if (!isMounted) return false
    return recentlyDeletedIds.includes(contentId)
  }, [recentlyDeletedIds, isMounted])

  return (
    <ContentDeleteContext.Provider value={{ recentlyDeletedIds, registerDelete, isDeleted }}>
      {children}
    </ContentDeleteContext.Provider>
  )
}

// Hook to use the content delete context
export function useContentDelete() {
  const context = useContext(ContentDeleteContext)
  if (context === undefined) {
    throw new Error('useContentDelete must be used within a ContentDeleteProvider')
  }
  return context
}