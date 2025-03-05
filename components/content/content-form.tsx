'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { SparklesIcon, XMarkIcon } from "@heroicons/react/24/solid"
import { CheckboxCardGroup } from "@/components/ui/checkbox-card-group"
import { RichContentForm } from './rich-content-form'
import type { AgeGroup, Category, AccessTier } from "@/lib/types/database"
import type { ContentFormData } from "@/lib/types/content"
import { useSupabase } from '@/components/supabase-provider'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

const formSchema = z.object({
  type: z.enum(['video', 'audio', 'lesson_plan', 'game'], {
    required_error: "Pasirinkite turinio tipą",
  }),
  title: z.string().min(1, { message: "Įveskite pavadinimą" }),
  description: z.string().optional(),
  thumbnail: z.any().optional(),
  contentBody: z.string().min(1, { message: "Įveskite turinio turinį" }),
  ageGroups: z.array(z.string()).min(1, { message: "Pasirinkite bent vieną amžiaus grupę" }),
  categories: z.array(z.string()).min(1, { message: "Pasirinkite bent vieną kategoriją" }),
  accessTierId: z.string().min(1, { message: "Pasirinkite prieigos lygį" }),
  published: z.boolean().default(false),
})

interface ContentFormProps {
  ageGroups: AgeGroup[]
  categories: Category[]
  accessTiers: AccessTier[]
  onSubmit: (data: ContentFormData, supabase: any) => Promise<void>
  isLoading?: boolean
  initialData?: Partial<ContentFormData>
}

export function ContentForm({
  ageGroups,
  categories,
  accessTiers,
  onSubmit,
  isLoading = false,
  initialData
}: ContentFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { supabase, session } = useSupabase()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!session)

  // Update authentication state when session changes
  useEffect(() => {
    setIsAuthenticated(!!session)
  }, [session])

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialData?.type || undefined,
      title: initialData?.title || '',
      description: initialData?.description || '',
      contentBody: initialData?.contentBody || '',
      ageGroups: initialData?.ageGroups || [],
      categories: initialData?.categories || [],
      accessTierId: initialData?.accessTierId || accessTiers.find(tier => tier.name === 'free')?.id || '',
      published: initialData?.published || false,
    },
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      // Pass the supabase client to onSubmit
      await onSubmit(values as ContentFormData, supabase)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        form.setError('thumbnail', {
          type: 'manual',
          message: 'Failo dydis negali viršyti 10MB'
        })
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        form.setError('thumbnail', {
          type: 'manual',
          message: 'Galima įkelti tik paveikslėlius'
        })
        return
      }

      form.clearErrors('thumbnail')
      form.setValue('thumbnail', file)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const clearThumbnail = () => {
    form.setValue('thumbnail', null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 px-8 py-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pagrindinė informacija</h2>
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Turinio tipas</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="video" />
                        </FormControl>
                        <FormLabel className="font-normal">Video</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="audio" />
                        </FormControl>
                        <FormLabel className="font-normal">Daina</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="lesson_plan" />
                        </FormControl>
                        <FormLabel className="font-normal">Pamoka</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="game" />
                        </FormControl>
                        <FormLabel className="font-normal">Žaidimas</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pavadinimas</FormLabel>
                  <FormControl>
                    <Input placeholder="Įveskite pavadinimą" {...field} />
                  </FormControl>
                  <FormDescription>Trumpas ir aiškus pavadinimas</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aprašymas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Įveskite aprašymą"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Trumpas turinio aprašymas</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Media */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Medija</h2>
            
            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Miniatiūra</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-foreground hover:file:bg-primary/20"
                        {...field}
                      />
                      
                      {!isAuthenticated && (
                        <Alert className="bg-blue-50 border-blue-200">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-700">
                            You need to be logged in to upload thumbnails. The content will use a default thumbnail.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {previewUrl && (
                        <div className="relative h-40 w-full rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={clearThumbnail}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Vaizdinė turinio reprezentacija. Rekomenduojamas dydis: 1280x720px.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Turinys</h2>
            
            <FormField
              control={form.control}
              name="contentBody"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turinio turinys</FormLabel>
                  <FormControl>
                    <RichContentForm
                      contentBody={field.value}
                      onChange={(value) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Įveskite turinio tekstą, aprašymą ar taisykles
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Metadata */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Metaduomenys</h2>
            
            <FormField
              control={form.control}
              name="ageGroups"
              render={() => (
                <FormItem>
                  <CheckboxCardGroup
                    form={form}
                    name="ageGroups"
                    label="Amžiaus grupės"
                    description="Pasirinkite amžiaus grupes, kurioms skirtas turinys"
                    items={ageGroups.map(group => ({
                      id: group.id,
                      label: group.range,
                      description: group.description || '',
                    }))}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categories"
              render={() => (
                <FormItem>
                  <CheckboxCardGroup
                    form={form}
                    name="categories"
                    label="Kategorijos"
                    description="Pasirinkite kategorijas, kurioms priklauso turinys"
                    items={categories.map(category => ({
                      id: category.id,
                      label: category.name,
                      description: category.description || '',
                    }))}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessTierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prieigos lygis</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pasirinkite prieigos lygį" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accessTiers
                        .filter(tier => ['free', 'premium'].includes(tier.name))
                        .map((tier) => (
                          <SelectItem 
                            key={tier.id} 
                            value={tier.id}
                            className="flex items-center gap-2"
                          >
                            {tier.name === 'premium' ? (
                              <div className="flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4 text-yellow-500" />
                                Premium
                              </div>
                            ) : (
                              'Nemokamas'
                            )}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Nustatykite turinio prieigos lygį
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Publikuoti
                    </FormLabel>
                    <FormDescription>
                      Pažymėkite, jei norite iškart publikuoti turinį
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saugoma...' : 'Išsaugoti'}
          </Button>
        </form>
      </Form>
    </Card>
  )
} 