'use client'

import { UseFormReturn } from "react-hook-form"
import { FormSection } from "@/components/ui/form-section"
import { RadioCardGroup } from "@/components/ui/radio-card-group"
import { CheckboxCardGroup } from "@/components/ui/checkbox-card-group"
import { SparklesIcon } from "@heroicons/react/24/solid"
import type { AgeGroup, Category, AccessTier } from "@/lib/types/database"

interface ContentFormMetadataProps {
  form: UseFormReturn<any>
  ageGroups: AgeGroup[]
  categories: Category[]
  accessTiers: AccessTier[]
}

/**
 * ContentFormMetadata - Metadata form fields for content
 * 
 * This component includes form fields for:
 * - Access tier (free/premium)
 * - Age groups
 * - Categories
 */
export function ContentFormMetadata({ 
  form, 
  ageGroups, 
  categories, 
  accessTiers 
}: ContentFormMetadataProps) {
  // Prepare access tier items
  const accessTierItems = accessTiers
    .filter(tier => ['free', 'premium'].includes(tier.name))
    .sort((a, b) => (a.name === 'free' ? -1 : 1))
    .map(tier => ({
      id: tier.id,
      label: tier.name === 'free' ? 'Nemokamas' : 'Premium',
      icon: tier.name === 'premium' ? <SparklesIcon className="w-4 h-4 text-yellow-500" /> : undefined
    }))
  
  // Prepare age group items
  const ageGroupItems = ageGroups.map(group => ({
    id: group.id,
    label: group.range,
    description: group.description || undefined
  }))
  
  // Prepare category items
  const categoryItems = categories.map(category => ({
    id: category.id,
    label: category.name
  }))
  
  return (
    <FormSection
      title="Administravimas"
      description="Nustatykite turinio prieinamumą ir kategorizaciją"
    >
      <RadioCardGroup
        form={form}
        name="accessTierId"
        label="Prieigos lygis"
        items={accessTierItems}
      />
      
      <CheckboxCardGroup
        form={form}
        name="ageGroups"
        label="Amžiaus grupės"
        items={ageGroupItems}
      />
      
      <CheckboxCardGroup
        form={form}
        name="categories"
        label="Kategorijos"
        items={categoryItems}
        accentColor="secondary-mint"
      />
    </FormSection>
  )
} 