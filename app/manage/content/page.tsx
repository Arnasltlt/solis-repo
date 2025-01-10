'use client'

import { useAuth } from '@/lib/context/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getAgeGroups, getCategories, getAccessTiers, createContent } from '@/lib/services/content'
import type { AgeGroup, Category, AccessTier } from '@/lib/types/database'
import type { ContentFormData } from '@/lib/types/content'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { ContentForm } from '@/components/content/content-form'

export default function ManageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accessTiers, setAccessTiers] = useState<AccessTier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    async function loadData() {
      try {
        const [ageGroupsData, categoriesData, accessTiersData] = await Promise.all([
          getAgeGroups(),
          getCategories(),
          getAccessTiers()
        ])
        setAgeGroups(ageGroupsData)
        setCategories(categoriesData)
        setAccessTiers(accessTiersData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSubmit = async (data: ContentFormData) => {
    setIsSaving(true)
    try {
      await createContent({
        ...data,
        thumbnail: data.thumbnail || null,
        published: true
      })
      router.refresh()
      router.push('/')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Logo />
              <h1 className="font-heading text-3xl text-foreground">
                Turinio valdymas
              </h1>
            </div>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
            >
              ← Grįžti
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <ContentForm
          ageGroups={ageGroups}
          categories={categories}
          accessTiers={accessTiers}
          onSubmit={handleSubmit}
          isLoading={isSaving}
        />
      </main>
    </div>
  )
} 