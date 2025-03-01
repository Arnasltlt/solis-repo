'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { SparklesIcon } from "@heroicons/react/24/solid"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import type { AgeGroup, Category, AccessTier } from "@/lib/types/database"
import type { ContentFormData } from "@/lib/types/content"
import { RichContentForm } from './rich-content-form'
import { ContentFormBasic } from './content-form-basic'
import { ContentFormMedia } from './content-form-media'
import { ContentFormMetadata } from './content-form-metadata'
import { ContentFormBody } from './content-form-body'

const formSchema = z.object({
  type: z.enum(['video', 'audio', 'lesson_plan', 'game'], {
    required_error: "Pasirinkite turinio tipą",
  }),
  title: z.string().min(1, { message: "Įveskite pavadinimą" }),
  description: z.string().optional(),
  ageGroups: z.array(z.string()).min(1, { message: "Pasirinkite bent vieną amžiaus grupę" }),
  categories: z.array(z.string()).min(1, { message: "Pasirinkite bent vieną kategoriją" }),
  accessTierId: z.string().min(1, { message: "Pasirinkite prieigos lygį" }),
  content_body: z.string().optional(),
  content_url: z.string().optional(),
  published: z.boolean().default(true),
  thumbnail: z.union([z.instanceof(File), z.null()]).optional(),
})

type FormData = z.infer<typeof formSchema>

interface ContentFormProps {
  ageGroups: AgeGroup[]
  categories: Category[]
  accessTiers: AccessTier[]
  onSubmit: (data: ContentFormData) => Promise<void>
  isLoading?: boolean
}

export function ContentForm({
  ageGroups,
  categories,
  accessTiers,
  onSubmit,
  isLoading: externalLoading = false
}: ContentFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      title: '',
      description: '',
      ageGroups: [],
      categories: [],
      accessTierId: accessTiers.find(tier => tier.name === 'free')?.id || '',
      content_body: '',
      content_url: '',
      published: true,
      thumbnail: null,
    },
    mode: 'onChange',
  })

  // Monitor form errors and update validation errors state
  useEffect(() => {
    if (formSubmitted) {
      const errors = Object.entries(form.formState.errors).map(
        ([field, error]) => `${field}: ${error?.message}`
      );
      setValidationErrors(errors);
    }
  }, [form.formState.errors, formSubmitted]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue('thumbnail', file, { shouldValidate: true })
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (values: FormData) => {
    setValidationErrors([])
    setSubmitting(true)
    setFormSubmitted(true)
    
    try {
      // Prepare data for API submission
      const formData: ContentFormData = {
        type: values.type,
        title: values.title,
        description: values.description || '',
        ageGroups: values.ageGroups,
        categories: values.categories,
        accessTierId: values.accessTierId,
        contentBody: values.content_body || '',
        published: values.published,
        thumbnail: values.thumbnail,
      }

      await onSubmit(formData)
      
      toast({
        title: "Sėkmingai išsaugota",
        description: "Turinys buvo sėkmingai sukurtas",
      })
      
      // Reset the form
      form.reset({
        type: undefined,
        title: '',
        description: '',
        ageGroups: [],
        categories: [],
        accessTierId: accessTiers.find(tier => tier.name === 'free')?.id || '',
        content_body: '',
        content_url: '',
        published: true,
        thumbnail: null,
      })
      
      setFormSubmitted(false)
    } catch (error) {
      console.error('Form submission error:', error)
      
      if (error instanceof Error) {
        setValidationErrors([error.message])
      } else {
        setValidationErrors(['Įvyko nenumatyta klaida. Bandykite dar kartą.'])
      }
      
      toast({
        variant: "destructive",
        title: "Klaida",
        description: "Nepavyko išsaugoti turinio",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = externalLoading || submitting;

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Klaida</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6">
            <ContentFormBasic form={form} />
            
            <ContentFormMedia form={form} />
            
            <ContentFormMetadata 
              form={form} 
              ageGroups={ageGroups} 
              categories={categories} 
              accessTiers={accessTiers} 
            />
            
            <ContentFormBody 
              form={form} 
              loading={isLoading} 
              contentSchema={formSchema} 
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="min-w-24"
            >
              {isLoading ? "Saugoma..." : "Išsaugoti"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 