'use client'

import { UseFormReturn } from "react-hook-form"
import { FormSection } from "@/components/ui/form-section"
import { RadioCardGroup } from "@/components/ui/radio-card-group"
import { CheckboxCardGroup } from "@/components/ui/checkbox-card-group"
import { SparklesIcon } from "@heroicons/react/24/solid"
import type { AgeGroup, Category, AccessTier } from "@/lib/types/database"
import { ContentFormAttachments } from "./content-form-attachments"

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
  
  // Get form values for validation highlighting
  const selectedCategories = form.watch('categories') || []
  const selectedAgeGroups = form.watch('ageGroups') || []
  
  return (
    <div className="space-y-8">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-1">Prieigos nustatymai</h3>
        <p className="text-sm text-muted-foreground mb-4">Nustatykite, kas galės matyti šį turinį</p>
        
        <RadioCardGroup
          form={form}
          name="accessTierId"
          label="Prieigos lygis"
          items={accessTierItems}
        />
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-1">Amžiaus grupės</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Pasirinkite, kokioms amžiaus grupėms skirtas šis turinys
          <span className="text-destructive ml-1 font-medium">*</span>
        </p>
        
        <div className={`${selectedAgeGroups.length === 0 && form.formState.isSubmitted ? 'border-2 border-destructive p-4 rounded-lg' : ''}`}>
          <CheckboxCardGroup
            form={form}
            name="ageGroups"
            label="Amžiaus grupės"
            items={ageGroupItems}
            columns={3}
          />
          
          {selectedAgeGroups.length === 0 && form.formState.isSubmitted && (
            <p className="text-destructive text-sm mt-2">Pasirinkite bent vieną amžiaus grupę</p>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-1">Kategorijos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Pasirinkite, kokioms kategorijoms priklauso šis turinys
          <span className="text-destructive ml-1 font-medium">*</span>
        </p>
        
        <div className={`${selectedCategories.length === 0 && form.formState.isSubmitted ? 'border-2 border-destructive p-4 rounded-lg' : ''}`}>
          <CheckboxCardGroup
            form={form}
            name="categories"
            label="Kategorijos"
            items={categoryItems}
            accentColor="secondary-mint"
            columns={3}
          />
          
          {selectedCategories.length === 0 && form.formState.isSubmitted && (
            <p className="text-destructive text-sm mt-2">Pasirinkite bent vieną kategoriją</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium mb-1">Priedai</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Pridėkite failus, kuriuos vartotojai galės atsisiųsti
        </p>
        
        <ContentFormAttachments form={form} />
      </div>
    </div>
  )
} 