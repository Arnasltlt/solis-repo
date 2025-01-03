'use client'

import { useState, useEffect } from 'react'
import { getAgeGroups, getCategories } from '@/lib/services/content'
import { useContent } from '@/lib/hooks/useContent'
import { handleError } from '@/lib/utils/error'
import { useAuth } from '@/lib/context/auth'
import { useRouter } from 'next/navigation'
import type { AgeGroup, Category } from '@/lib/types/database'
import { toast } from '@/hooks/use-toast'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { ContentLayout } from '@/components/content/content-layout'

export default function Home() {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | undefined>()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showPremiumOnly, setShowPremiumOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  const { 
    content, 
    isLoading: isLoadingContent,
    error: contentError,
    refresh: refreshContent
  } = useContent({
    ageGroup: selectedAgeGroup,
    categories: selectedCategories,
    searchQuery,
    initialLoad: false
  })

  useEffect(() => {
    async function loadInitialData() {
      try {
        setError(null)
        const [ageGroupsData, categoriesData] = await Promise.all([
          getAgeGroups(),
          getCategories()
        ])
        setAgeGroups(ageGroupsData)
        setCategories(categoriesData)
        await refreshContent()
      } catch (err) {
        const error = handleError(err)
        setError(error)
      } finally {
        setIsInitializing(false)
      }
    }

    loadInitialData()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Klaida
          </h2>
          <p className="text-gray-600">
            {error.message}
          </p>
        </div>
      </div>
    )
  }

  const isLoading = isInitializing || isLoadingContent || authLoading

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Logo size="medium" />
            <div className="flex items-center gap-4">
              <input
                type="search"
                placeholder="Ieškoti..."
                className="input-brand"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {user ? (
                <>
                  <Button
                    onClick={() => router.push('/manage/content')}
                    className="btn-primary"
                  >
                    + Pridėti turinį
                  </Button>
                  <div className="relative group">
                    <button
                      onClick={async () => {
                        try {
                          await signOut()
                          router.push('/')
                        } catch (error) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: "Nepavyko atsijungti"
                          })
                        }
                      }}
                      className="text-sm text-gray-600 hover:text-foreground flex items-center gap-2"
                    >
                      <span>{user.email}</span>
                      <span className="text-xs">(Atsijungti)</span>
                    </button>
                  </div>
                </>
              ) : (
                <Button
                  onClick={() => router.push('/login')}
                  className="btn-primary"
                >
                  Prisijungti
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <ContentLayout 
          content={content}
          ageGroups={ageGroups}
          categories={categories}
          selectedAgeGroup={selectedAgeGroup}
          selectedCategories={selectedCategories}
          showPremiumOnly={showPremiumOnly}
          isLoading={isLoading}
          onAgeGroupSelect={setSelectedAgeGroup}
          onCategorySelect={(id) => {
            setSelectedCategories(prev => 
              prev.includes(id)
                ? prev.filter(catId => catId !== id)
                : [...prev, id]
            )
          }}
          onPremiumToggle={() => setShowPremiumOnly(!showPremiumOnly)}
          onRefresh={refreshContent}
        />
      </main>

      {contentError && (
        <div className="text-center py-4">
          <p className="text-red-600">
            Klaida kraunant turinį: {contentError.message}
          </p>
        </div>
      )}
    </div>
  )
}

