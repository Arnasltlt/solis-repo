'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CheckIcon } from "@heroicons/react/24/solid"
import type { ContentFormData } from "@/lib/types/content"
import type { AgeGroup, Category, AccessTier } from "@/lib/types/database"
import { ContentFormStepBasics } from './content-form-step-basics'
import { ContentFormStepMedia } from './content-form-step-media'
import { ContentFormStepContent } from './content-form-step-content'
import { ContentFormStepMetadata } from './content-form-step-metadata'
import { ContentFormStepPreview } from './content-form-step-preview'
import { toast } from "@/components/ui/use-toast"

interface Step {
  id: string
  title: string
  description: string
}

const steps: Step[] = [
  {
    id: 'basics',
    title: 'Pagrindinė informacija',
    description: 'Įveskite pagrindinę informaciją apie turinį'
  },
  {
    id: 'media',
    title: 'Medija',
    description: 'Įkelkite nuotraukas ir video'
  },
  {
    id: 'content',
    title: 'Turinys',
    description: 'Sukurkite turinio turinį'
  },
  {
    id: 'metadata',
    title: 'Metaduomenys',
    description: 'Pridėkite papildomą informaciją'
  },
  {
    id: 'preview',
    title: 'Peržiūra',
    description: 'Peržiūrėkite ir publikuokite'
  }
]

interface ContentFormStepperProps {
  ageGroups: AgeGroup[]
  categories: Category[]
  accessTiers: AccessTier[]
  onSubmit: (data: ContentFormData) => Promise<void>
  isLoading?: boolean
  editContentId?: string
}

export function ContentFormStepper({
  ageGroups,
  categories,
  accessTiers,
  onSubmit,
  isLoading = false,
  editContentId
}: ContentFormStepperProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<ContentFormData>>({
    published: false,
    accessTierId: accessTiers.find(tier => tier.name === 'free')?.id
  })
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null)
  const [isLoadingDraft, setIsLoadingDraft] = useState(true)

  // Auto-save functionality
  useEffect(() => {
    if (isLoadingDraft) return // Don't auto-save while loading draft

    const saveToLocalStorage = () => {
      try {
        setAutoSaveStatus('saving')
        localStorage.setItem('content-form-draft', JSON.stringify(formData))
        setAutoSaveStatus('saved')
      } catch (error) {
        console.error('Error saving draft:', error)
        setAutoSaveStatus('error')
      }
    }

    const timeoutId = setTimeout(saveToLocalStorage, 1000)
    return () => clearTimeout(timeoutId)
  }, [formData, isLoadingDraft])

  // Load draft or existing content on initial render
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('content-form-draft')
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft)
        setFormData(parsedDraft)
        
        // Mark all steps as completed when editing
        if (editContentId) {
          setCompletedSteps(['basics', 'media', 'content', 'metadata', 'preview'])
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error)
    } finally {
      setIsLoadingDraft(false)
    }
  }, [editContentId])

  const updateFormData = (stepData: Partial<ContentFormData>) => {
    if (isLoadingDraft) return
    setFormData(prev => ({ ...prev, ...stepData }))
  }

  const handleStepComplete = (stepId: string) => {
    if (isLoadingDraft) return
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId])
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.type) {
        throw new Error('Required fields are missing')
      }

      await onSubmit(formData as ContentFormData)
      
      // Clear draft after successful submission
      localStorage.removeItem('content-form-draft')
      
      // Show success message
      toast({
        title: editContentId ? "Turinys atnaujintas" : "Turinys sukurtas",
        description: editContentId 
          ? "Jūsų turinys sėkmingai atnaujintas"
          : "Jūsų turinys sėkmingai sukurtas",
      })
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        variant: "destructive",
        title: "Klaida",
        description: editContentId 
          ? "Nepavyko atnaujinti turinio"
          : "Nepavyko sukurti turinio",
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {/* Steps */}
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center w-28">
              <div 
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white transition-colors duration-300",
                  currentStep === index && "border-primary bg-primary text-white",
                  currentStep > index && "border-primary bg-primary text-white",
                  currentStep < index && "border-gray-300 bg-white text-gray-500",
                  completedSteps.includes(step.id) && "border-primary bg-primary text-white"
                )}
              >
                {completedSteps.includes(step.id) ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="text-center mt-3">
                <div className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  currentStep === index && "text-primary",
                  currentStep > index && "text-primary",
                  currentStep < index && "text-gray-500"
                )}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 mt-1 w-28 mx-auto">
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-save status */}
      <div className="mb-4 text-sm text-right">
        {autoSaveStatus === 'saving' && (
          <span className="text-gray-500">Saugoma...</span>
        )}
        {autoSaveStatus === 'saved' && (
          <span className="text-green-600">Juodraštis išsaugotas</span>
        )}
        {autoSaveStatus === 'error' && (
          <span className="text-red-600">Klaida saugant juodraštį</span>
        )}
      </div>

      {/* Form content */}
      <Card className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">{steps[currentStep].title}</h2>
          <p className="text-gray-600">{steps[currentStep].description}</p>
        </div>

        {/* Step content */}
        {currentStep === 0 && (
          <ContentFormStepBasics
            initialData={formData}
            onUpdate={updateFormData}
            onComplete={handleStepComplete}
          />
        )}
        {currentStep === 1 && (
          <ContentFormStepMedia
            initialData={formData}
            onUpdate={updateFormData}
            onComplete={handleStepComplete}
            contentType={formData.type}
          />
        )}
        {currentStep === 2 && (
          <ContentFormStepContent
            initialData={formData}
            onUpdate={updateFormData}
            onComplete={handleStepComplete}
            contentType={formData.type}
          />
        )}
        {currentStep === 3 && (
          <ContentFormStepMetadata
            initialData={formData}
            onUpdate={updateFormData}
            onComplete={handleStepComplete}
            ageGroups={ageGroups}
            categories={categories}
            accessTiers={accessTiers}
          />
        )}
        {currentStep === 4 && (
          <ContentFormStepPreview
            formData={formData}
            onComplete={handleStepComplete}
            ageGroups={ageGroups}
            categories={categories}
            accessTiers={accessTiers}
          />
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
          >
            Atgal
          </Button>
          <div className="flex gap-2">
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Saugoma...' : 'Publikuoti'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isLoading}
              >
                Toliau
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
} 