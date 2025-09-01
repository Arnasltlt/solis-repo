'use client'

import { useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ContentImage } from "@/components/ui/content-image"
import { RichContentForm } from './rich-content-form'
import type { ContentFormData } from "@/lib/types/content"
import type { AgeGroup, Category, AccessTier } from "@/lib/types/database"

interface ContentFormStepPreviewProps {
  formData: Partial<ContentFormData>
  onComplete: (stepId: string) => void
  ageGroups: AgeGroup[]
  categories: Category[]
  accessTiers: AccessTier[]
}

export function ContentFormStepPreview({
  formData,
  onComplete,
  ageGroups,
  categories,
  accessTiers
}: ContentFormStepPreviewProps) {
  // Mark step as complete when mounted
  useEffect(() => {
    onComplete('preview')
  }, [onComplete])

  // Get the selected age groups and categories
  const selectedAgeGroups = ageGroups.filter(group => formData.ageGroups?.includes(group.id))
  const selectedCategories = categories.filter(category => formData.categories?.includes(category.id))
  const accessTier = accessTiers.find(tier => tier.id === formData.accessTierId)
  const isPremium = accessTier?.name === 'premium'

  // Create object URL for thumbnail preview
  const thumbnailUrl = formData.thumbnail instanceof File 
    ? URL.createObjectURL(formData.thumbnail)
    : null

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl)
      }
    }
  }, [thumbnailUrl])

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">{formData.title}</h2>
        {isPremium && (
          <Badge variant="premium">Premium</Badge>
        )}
        {formData.published && (
          <Badge variant="secondary">Bus publikuota</Badge>
        )}
      </div>

      {/* Thumbnail */}
      <Card className="overflow-hidden">
        <ContentImage
          src={thumbnailUrl}
          alt={formData.title || 'Content thumbnail'}
          aspectRatio="video"
          className="w-full"
        />
      </Card>

      {/* Description */}
      {formData.description && (
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Aprašymas</h3>
          <p className="text-gray-600">{formData.description}</p>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Metaduomenys</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Amžiaus grupės</h4>
            <div className="flex flex-wrap gap-2">
              {selectedAgeGroups.map(group => (
                <Badge key={group.id} variant="outline">
                  {group.range}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Temos</h4>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(category => (
                <Badge key={category.id} variant="outline">
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Content Body */}
      {formData.contentBody && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Turinys</h3>
          <RichContentForm
            contentBody={formData.contentBody}
            onChange={() => {}}
            readOnly
          />
        </Card>
      )}

      {/* Media URL */}
      {formData.mediaUrl && (formData.type === 'video' || formData.type === 'audio') && (
        <Card className="p-6">
          <h3 className="font-semibold mb-2">
            {formData.type === 'video' ? 'Video URL' : 'Audio URL'}
          </h3>
          <p className="text-gray-600 break-all">{formData.mediaUrl}</p>
        </Card>
      )}
    </div>
  )
} 