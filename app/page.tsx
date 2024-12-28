'use client'

import { useState, useEffect } from 'react'
import { getAgeGroups, getCategories } from '@/lib/services/content'
import { ContentCard } from '@/components/ui/content-card'
import { useContent } from '@/lib/hooks/useContent'
import { handleError } from '@/lib/utils/error'
import { useAuth } from '@/lib/context/auth'
import { AuthForm } from '@/components/auth/auth-form'
import { useRouter } from 'next/navigation'
import type { AgeGroup, Category } from '@/lib/types/database'
import { toast } from 'react-hot-toast'
import { Logo } from '@/components/ui/logo'
import { SparklesIcon } from '@heroicons/react/24/solid'

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

  // Filter content based on premium status
  const filteredContent = content.filter(item => 
    !showPremiumOnly || (item.access_tier?.name === 'premium')
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Logo size="medium" />
            <div className="flex items-center gap-4">
              <input
                type="search"
                placeholder="Ieškoti..."
                className="px-4 py-2 border rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {user && (
                <>
                  <button
                    onClick={() => router.push('/manage/content')}
                    className="px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    + Pridėti turinį
                  </button>
                  <div className="relative group">
                    <button
                      onClick={async () => {
                        try {
                          await signOut()
                          router.push('/')
                        } catch (error) {
                          toast.error('Nepavyko atsijungti')
                        }
                      }}
                      className="text-sm text-gray-600 hover:text-black flex items-center gap-2"
                    >
                      <span>{user.email}</span>
                      <span className="text-xs">(Atsijungti)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {!user ? (
          <div className="max-w-md mx-auto">
            <AuthForm />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="mb-8 space-y-4">
              {/* Premium Filter */}
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setShowPremiumOnly(!showPremiumOnly)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showPremiumOnly
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-md'
                      : 'bg-white text-gray-700 hover:bg-yellow-50'
                  }`}
                >
                  <SparklesIcon className="w-4 h-4" />
                  Premium turinys
                </button>
                {showPremiumOnly && (
                  <span className="text-sm text-gray-500">
                    Rodomi tik premium turinio elementai
                  </span>
                )}
              </div>

              {/* Age Groups */}
              <div className="flex flex-wrap gap-2">
                {ageGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedAgeGroup(
                      selectedAgeGroup === group.id ? undefined : group.id
                    )}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      selectedAgeGroup === group.id
                        ? 'bg-yellow-500 text-black'
                        : 'bg-white text-gray-700 hover:bg-yellow-50'
                    }`}
                  >
                    {group.range}
                  </button>
                ))}
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategories(prev => 
                      prev.includes(category.id)
                        ? prev.filter(id => id !== category.id)
                        : [...prev, category.id]
                    )}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      selectedCategories.includes(category.id)
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              </div>
            ) : filteredContent.length > 0 ? (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Rasta: {filteredContent.length} {showPremiumOnly ? 'premium' : ''} elementų
                  </span>
                  <button
                    onClick={refreshContent}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Atnaujinti turinį
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContent.map((item) => (
                    <ContentCard key={item.id} content={item} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {showPremiumOnly 
                    ? 'Nerasta premium turinio pagal pasirinktus filtrus'
                    : 'Nėra turinio pagal pasirinktus filtrus'}
                </p>
              </div>
            )}

            {contentError && (
              <div className="text-center py-4">
                <p className="text-red-600">
                  Klaida kraunant turinį: {contentError.message}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

