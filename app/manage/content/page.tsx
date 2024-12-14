'use client'

import { useAuth } from '@/lib/context/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getAgeGroups, getCategories, createContent } from '@/lib/services/content'
import type { AgeGroup, Category } from '@/lib/types/database'
import { toast } from 'react-hot-toast'

type ContentType = 'video' | 'audio' | 'lesson_plan' | 'game'

interface ContentFormData {
  type: ContentType | null
  title: string
  description: string
  ageGroups: string[]
  categories: string[]
  thumbnail: File | null
  vimeoId?: string
  audioFile?: File
  documentFile?: File
  gameFiles?: File[]
  published: boolean
}

const initialFormData: ContentFormData = {
  type: null,
  title: '',
  description: '',
  ageGroups: [],
  categories: [],
  thumbnail: null,
  published: false
}

export default function ManageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<ContentFormData>(initialFormData)
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([])
  const [categories, setCategories] = useState<Category[]>([])
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
        const [ageGroupsData, categoriesData] = await Promise.all([
          getAgeGroups(),
          getCategories()
        ])
        setAgeGroups(ageGroupsData)
        setCategories(categoriesData)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleInputChange('thumbnail', file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.type) {
      toast.error('Pasirinkite turinio tipą')
      return
    }

    if (!formData.title.trim()) {
      toast.error('Įveskite pavadinimą')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Įveskite aprašymą')
      return
    }

    if (formData.ageGroups.length === 0) {
      toast.error('Pasirinkite bent vieną amžiaus grupę')
      return
    }

    if (formData.categories.length === 0) {
      toast.error('Pasirinkite bent vieną kategoriją')
      return
    }

    try {
      setIsSaving(true)
      await createContent({
        type: formData.type,
        title: formData.title,
        description: formData.description,
        ageGroups: formData.ageGroups,
        categories: formData.categories,
        thumbnail: formData.thumbnail,
        vimeoId: formData.vimeoId,
        audioFile: formData.audioFile,
        documentFile: formData.documentFile,
        gameFiles: formData.gameFiles,
        published: true // For now, publish immediately
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Turinio valdymas
            </h1>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
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
            <div className="bg-white shadow rounded-lg p-6 space-y-6">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turinio tipas
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {(['video', 'audio', 'lesson_plan', 'game'] as ContentType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleInputChange('type', type)}
                      className={`p-6 border-2 rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-colors ${
                        formData.type === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-50">
                          {type === 'video' && (
                            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                          {type === 'audio' && (
                            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                          )}
                          {type === 'lesson_plan' && (
                            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          )}
                          {type === 'game' && (
                            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                          )}
                        </div>
                        <div className="font-medium">
                          {type === 'video' && 'Video'}
                          {type === 'audio' && 'Audio'}
                          {type === 'lesson_plan' && 'Pamoka'}
                          {type === 'game' && 'Žaidimas'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pavadinimas
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Įveskite pavadinimą"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aprašymas
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Įveskite aprašymą"
                  />
                </div>
              </div>

              {/* Categories and Age Groups */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Amžiaus grupės
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {ageGroups.map((group) => (
                      <label
                        key={group.id}
                        className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.ageGroups.includes(group.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
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
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {formData.ageGroups.includes(group.id) && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12">
                                <path
                                  d="M3.795 6.795L2.295 5.295C2.105 5.105 1.795 5.105 1.605 5.295C1.415 5.485 1.415 5.795 1.605 5.985L3.505 7.885C3.695 8.075 4.005 8.075 4.195 7.885L8.395 3.685C8.585 3.495 8.585 3.185 8.395 2.995C8.205 2.805 7.895 2.805 7.705 2.995L3.795 6.795Z"
                                  fill="currentColor"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{group.range}</span>
                            {group.description && (
                              <span className="text-xs text-gray-500">{group.description}</span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Kategorijos
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.categories.includes(category.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-200 hover:bg-green-50'
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
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {formData.categories.includes(category.id) && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12">
                                <path
                                  d="M3.795 6.795L2.295 5.295C2.105 5.105 1.795 5.105 1.605 5.295C1.415 5.485 1.415 5.795 1.605 5.985L3.505 7.885C3.695 8.075 4.005 8.075 4.195 7.885L8.395 3.685C8.585 3.495 8.585 3.185 8.395 2.995C8.205 2.805 7.895 2.805 7.705 2.995L3.795 6.795Z"
                                  fill="currentColor"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paveikslėlis
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Įkelti failą</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">arba įtempkite</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG iki 10MB</p>
                  </div>
                </div>
              </div>

              {formData.type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vimeo ID
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={formData.vimeoId || ''}
                      onChange={(e) => handleInputChange('vimeoId', e.target.value)}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                      placeholder="Įveskite Vimeo video ID"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                    isSaving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
            <div className="bg-white shadow rounded-lg p-6 sticky top-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Peržiūra</h2>
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
                <h3 className="font-medium">
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
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {group.range}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
                {formData.categories.length > 0 && (
                  <div className="flex gap-2">
                    {formData.categories.map(id => (
                      <span
                        key={id}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {categories.find(c => c.id === id)?.name}
                      </span>
                    ))}
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