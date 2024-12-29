'use client'

import { useAuth } from '@/lib/context/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getAgeGroups, getCategories, getAccessTiers, createContent } from '@/lib/services/content'
import type { AgeGroup, Category, AccessTier } from '@/lib/types/database'
import type { ContentFormData, ContentType, Attachment } from '@/lib/types/content'
import { toast } from 'react-hot-toast'
import { Logo } from '@/components/ui/logo'
import { RichContentForm } from '@/components/content/rich-content-form'
import { theme } from '@/styles/theme'

const initialFormData: ContentFormData = {
  type: null,
  title: '',
  description: '',
  ageGroups: [],
  categories: [],
  thumbnail: null,
  contentBody: '',
  accessTierId: '',
  published: false
}

interface AccessTierFeatures {
  description: string
}

export default function ManageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<ContentFormData>(initialFormData)
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accessTiers, setAccessTiers] = useState<AccessTier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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
        // Set default access tier to 'free'
        const freeTier = accessTiersData.find(tier => tier.name === 'free')
        if (freeTier) {
          setFormData(prev => ({ ...prev, accessTierId: freeTier.id }))
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (formData.thumbnail) {
      const url = URL.createObjectURL(formData.thumbnail)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [formData.thumbnail])

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    )
  }

  const handleInputChange = (field: keyof ContentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleRichContentChange = (field: string, value: any) => {
    if (field in initialFormData) {
      handleInputChange(field as keyof ContentFormData, value)
    }
  }

  const handleAccessTierChange = (tierId: string) => {
    handleInputChange('accessTierId', tierId)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleInputChange('thumbnail', file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Įveskite pavadinimą')
      return
    }

    if (formData.categories.length === 0) {
      toast.error('Pasirinkite bent vieną kategoriją')
      return
    }

    if (!formData.accessTierId) {
      toast.error('Pasirinkite prieigos lygį')
      return
    }

    try {
      setIsSaving(true)
      await createContent({
        type: formData.type,
        title: formData.title,
        description: formData.description || '',
        ageGroups: formData.ageGroups,
        categories: formData.categories,
        thumbnail: formData.thumbnail,
        contentBody: formData.contentBody,
        accessTierId: formData.accessTierId,
        published: true
      })
      
      toast.success('Turinys sėkmingai išsaugotas')
      router.push('/')
    } catch (error) {
      console.error('Error saving content:', error)
      toast.error('Klaida išsaugant turinį')
    } finally {
      setIsSaving(false)
    }
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
            <button
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              ← Grįžti
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="flex gap-8">
          {/* Form Column */}
          <div className="flex-1">
            <div className="card-brand p-6 space-y-8">
              {/* Card Information Section */}
              <div>
                <h2 className="font-heading text-2xl mb-6 text-foreground">
                  Kortelės informacija
                </h2>

                <div className="space-y-6">
                  {/* Content Type Selection - Simplified */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Turinio tipas
                    </label>
                    <select
                      value={formData.type || ''}
                      onChange={(e) => handleInputChange('type', e.target.value as ContentType)}
                      className="input-brand w-full"
                    >
                      <option value="">Pasirinkite tipą</option>
                      <option value="video">Video</option>
                      <option value="audio">Daina</option>
                      <option value="lesson_plan">Pamoka</option>
                      <option value="game">Žaidimas</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Pavadinimas
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="input-brand w-full"
                      placeholder="Įveskite pavadinimą"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Trumpas aprašymas
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="input-brand w-full"
                      placeholder="Įveskite trumpą aprašymą"
                    />
                  </div>

                  {/* Thumbnail */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Paveikslėlis
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary/10 file:text-foreground
                            hover:file:bg-primary/20"
                        />
                      </div>
                      {previewUrl && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Administration Section */}
              <div>
                <h2 className="font-heading text-2xl mb-6 text-foreground">
                  Administravimas
                </h2>
                
                <div className="space-y-6">
                  {/* Access Tier Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Prieigos lygis
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {accessTiers.map((tier) => (
                        <label
                          key={tier.id}
                          className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.accessTierId === tier.id
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 hover:border-primary/20 hover:bg-primary/5'
                          }`}
                        >
                          <input
                            type="radio"
                            name="accessTier"
                            checked={formData.accessTierId === tier.id}
                            onChange={() => handleAccessTierChange(tier.id)}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 flex items-center justify-center border-2 rounded-full transition-colors ${
                                formData.accessTierId === tier.id
                                  ? 'border-primary bg-primary'
                                  : 'border-gray-300'
                              }`}
                            >
                              {formData.accessTierId === tier.id && (
                                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {tier.name === 'free' ? 'Nemokamas' : 'Premium'}
                              </span>
                              {typeof tier.features === 'object' && tier.features !== null && 'description' in tier.features && (
                                <span className="text-xs text-gray-500">
                                  {String(tier.features.description)}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Age Groups */}
                  <div>
                    <label className="block text-sm font-medium mb-4 text-foreground">
                      Amžiaus grupės
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {ageGroups.map((group) => (
                        <label
                          key={group.id}
                          className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.ageGroups.includes(group.id)
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 hover:border-primary/20 hover:bg-primary/5'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.ageGroups.includes(group.id)}
                            onChange={(e) => {
                              const newGroups = e.target.checked
                                ? [...formData.ageGroups, group.id]
                                : formData.ageGroups.filter(id => id !== group.id)
                              handleInputChange('ageGroups', newGroups)
                            }}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 flex items-center justify-center border-2 rounded transition-colors ${
                                formData.ageGroups.includes(group.id)
                                  ? 'border-primary bg-primary'
                                  : 'border-gray-300'
                              }`}
                            >
                              {formData.ageGroups.includes(group.id) && (
                                <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12">
                                  <path
                                    d="M3.795 6.795L2.295 5.295C2.105 5.105 1.795 5.105 1.605 5.295C1.415 5.485 1.415 5.795 1.605 5.985L3.505 7.885C3.695 8.075 4.005 8.075 4.195 7.885L8.395 3.685C8.585 3.495 8.585 3.185 8.395 2.995C8.205 2.805 7.895 2.805 7.705 2.995L3.795 6.795Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">{group.range}</span>
                              {group.description && (
                                <span className="text-xs text-gray-500">{group.description}</span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="block text-sm font-medium mb-4 text-foreground">
                      Kategorijos
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.categories.includes(category.id)
                              ? 'border-secondary-mint bg-secondary-mint/10'
                              : 'border-gray-200 hover:border-secondary-mint/20 hover:bg-secondary-mint/5'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.categories.includes(category.id)}
                            onChange={(e) => {
                              const newCategories = e.target.checked
                                ? [...formData.categories, category.id]
                                : formData.categories.filter(id => id !== category.id)
                              handleInputChange('categories', newCategories)
                            }}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 flex items-center justify-center border-2 rounded transition-colors ${
                                formData.categories.includes(category.id)
                                  ? 'border-secondary-mint bg-secondary-mint'
                                  : 'border-gray-300'
                              }`}
                            >
                              {formData.categories.includes(category.id) && (
                                <svg className="w-3 h-3 text-secondary-mint-foreground" viewBox="0 0 12 12">
                                  <path
                                    d="M3.795 6.795L2.295 5.295C2.105 5.105 1.795 5.105 1.605 5.295C1.415 5.485 1.415 5.795 1.605 5.985L3.505 7.885C3.695 8.075 4.005 8.075 4.195 7.885L8.395 3.685C8.585 3.495 8.585 3.185 8.395 2.995C8.205 2.805 7.895 2.805 7.705 2.995L3.795 6.795Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm font-medium text-foreground">{category.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div>
                <h2 className="font-heading text-2xl mb-6 text-foreground">
                  Turinys
                </h2>
                
                <div className="space-y-6">
                  <RichContentForm
                    contentBody={formData.contentBody}
                    onChange={handleRichContentChange}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                  style={{
                    opacity: isSaving ? 0.5 : 1,
                    cursor: isSaving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Saugoma...
                    </div>
                  ) : (
                    'Išsaugoti'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Column */}
          <div className="w-96">
            <div className="card-brand p-6 sticky top-6">
              <h2 className="font-heading text-2xl mb-4 text-foreground">
                Peržiūra
              </h2>
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Nėra paveikslėlio
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="font-heading text-xl text-foreground">
                  {formData.title || 'Pavadinimas'}
                </h3>
                <p className="text-sm text-gray-500">
                  {formData.description || 'Aprašymas'}
                </p>
                {formData.ageGroups.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.ageGroups.map(id => {
                      const group = ageGroups.find(g => g.id === id)
                      return group ? (
                        <span
                          key={id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary-foreground"
                        >
                          {group.range}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
                {formData.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.categories.map(id => {
                      const category = categories.find(c => c.id === id)
                      return category ? (
                        <span
                          key={id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-mint/20 text-secondary-mint-foreground"
                        >
                          {category.name}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
                {formData.type && (
                  <div className="mt-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-foreground">
                      {formData.type === 'video' && 'Video'}
                      {formData.type === 'audio' && 'Daina'}
                      {formData.type === 'lesson_plan' && 'Pamoka'}
                      {formData.type === 'game' && 'Žaidimas'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
} 