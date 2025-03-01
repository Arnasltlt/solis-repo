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
import { AlertCircle, Loader2 } from "lucide-react"
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
  content_body: z.string().min(1, { message: "Įveskite turinio turinį" }),
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
  const [submitSuccess, setSubmitSuccess] = useState(false)

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
    setSubmitSuccess(false)
    
    try {
      // Prepare data for API submission
      const formData: ContentFormData = {
        type: values.type,
        title: values.title,
        description: values.description || '',
        ageGroups: values.ageGroups,
        categories: values.categories,
        accessTierId: values.accessTierId,
        contentBody: values.content_body,
        published: values.published,
        thumbnail: values.thumbnail,
      }

      console.log('Submitting form data:', formData)
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
        published: true,
        thumbnail: null,
      })
      
      setFormSubmitted(false)
      setSubmitSuccess(true)
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 5000)
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
    <div className="max-w-4xl mx-auto relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-lg font-medium text-primary">Saugoma...</p>
          <p className="text-sm text-muted-foreground mt-1">Prašome palaukti, kol turinys bus išsaugotas</p>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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

          {submitSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <SparklesIcon className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Sėkmingai išsaugota</AlertTitle>
              <AlertDescription className="text-green-600">
                Turinys buvo sėkmingai sukurtas ir išsaugotas.
              </AlertDescription>
            </Alert>
          )}

          {/* Form progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Turinio informacija</span>
              <span className="text-sm font-medium">Kategorijos</span>
              <span className="text-sm font-medium">Turinys</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full" style={{ 
                width: form.formState.isSubmitted 
                  ? '100%' 
                  : form.watch('categories')?.length > 0 && form.watch('ageGroups')?.length > 0
                    ? '66%'
                    : form.watch('title') && form.watch('type')
                      ? '33%'
                      : '10%'
              }}></div>
            </div>
          </div>

          <div className="grid gap-8">
            <Card className="border-2 border-muted shadow-sm hover:border-muted-foreground/20 transition-colors">
              <CardHeader className="bg-muted/10">
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                  Pagrindinė informacija
                </CardTitle>
                <CardDescription>Įveskite pagrindinę informaciją apie turinį</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ContentFormBasic form={form} />
                <ContentFormMedia form={form} />
              </CardContent>
            </Card>
            
            <Card className="border-2 border-muted shadow-sm hover:border-muted-foreground/20 transition-colors">
              <CardHeader className="bg-muted/10">
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                  Kategorijos ir prieiga
                </CardTitle>
                <CardDescription>Nustatykite turinio prieinamumą ir kategorizaciją</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ContentFormMetadata 
                  form={form} 
                  ageGroups={ageGroups} 
                  categories={categories} 
                  accessTiers={accessTiers} 
                />
              </CardContent>
            </Card>
            
            <Card className="border-2 border-muted shadow-sm hover:border-muted-foreground/20 transition-colors">
              <CardHeader className="bg-muted/10">
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                  Turinio kūrimas
                </CardTitle>
                <CardDescription>Sukurkite ir redaguokite turinio turinį</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ContentFormBody 
                  form={form} 
                  loading={isLoading} 
                  contentSchema={formSchema} 
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-4 mt-8 sticky bottom-4 z-10 bg-background p-4 rounded-lg shadow-lg border border-muted">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="min-w-32 h-12 text-base font-medium shadow-md hover:shadow-lg transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saugoma...
                </span>
              ) : "Išsaugoti turinį"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 