'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageHeader } from '@/components/ui/page-header'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { SparklesIcon, CheckIcon, ChevronRightIcon, ArrowLeft, Loader2, PlayIcon, MicIcon, BookOpenIcon, GamepadIcon } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckboxCardGroup } from '@/components/ui/checkbox-card-group'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'
import { createFileCopy } from '@/lib/utils/debug-utils'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth, UserRoles } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import { FileAttachmentsUploader } from '@/components/content/file-attachments-uploader'
import type { AttachmentFile } from '@/components/content/file-attachments-uploader'

// Create a schema for content
const formSchema = z.object({
  // UI turinio tipai (unikalūs, lokalizuoti), žemiau žemėlapyje konvertuojami į backend tipus
  type: z.enum([
    'dainos',
    'ritminiai_zaidimai',
    'instrumentai',
    'judesio_zaidimai',
    'mankstos',
    'choreografijos',
    'pamoku_planai',
  ], {
    required_error: "Pasirinkite turinio tipą",
  }),
  title: z.string().min(1, { message: "Pavadinimas privalomas" }),
  thumbnail: z.any().optional(),
  ageGroups: z.array(z.string()).min(1, { message: "Pasirinkite bent vieną amžiaus grupę" }),
  categories: z.array(z.string()).min(1, { message: "Pasirinkite bent vieną temą" }),
  accessTierId: z.string().min(1, { message: "Pasirinkite prieigos lygį" }),
  published: z.boolean().default(false),
  attachments: z.array(z.any()).optional(),
})

interface NewContentEditorProps {
  ageGroups: any[]
  categories: any[]
  accessTiers: any[]
}

export function NewContentEditor({ 
  ageGroups, 
  categories, 
  accessTiers 
}: NewContentEditorProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
  const { isAdmin } = useAuthorization()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [attachmentsUploading, setAttachmentsUploading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  
  // UI turinio tipų konfigūracija (paprasta, nekeičianti kitų komponentų elgsenos)
  const contentTypes = [
    {
      value: 'dainos',
      label: 'Dainos',
      description: 'Dainos ir dainavimo medžiaga',
      icon: MicIcon,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      value: 'ritminiai_zaidimai',
      label: 'Ritminiai žaidimai', 
      description: 'Ritmo lavinimo žaidimai ir pratimai',
      icon: GamepadIcon,
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      value: 'instrumentai',
      label: 'Instrumentai',
      description: 'Darbas su instrumentais ir metodika',
      icon: BookOpenIcon,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      value: 'judesio_zaidimai',
      label: 'Judesio žaidimai',
      description: 'Judėjimo ir koordinacijos veiklos',
      icon: GamepadIcon,
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    },
    {
      value: 'mankstos',
      label: 'Mankštos',
      description: 'Mankštos, apšilimai ir aktyvios veiklos',
      icon: PlayIcon,
      color: 'bg-teal-50 border-teal-200 hover:bg-teal-100'
    },
    {
      value: 'choreografijos',
      label: 'Choreografijos',
      description: 'Šokių choreografijos ir mokymai',
      icon: PlayIcon,
      color: 'bg-rose-50 border-rose-200 hover:bg-rose-100'
    },
    {
      value: 'pamoku_planai',
      label: 'Pamokų planai',
      description: 'Struktūruoti planai ir veiklos',
      icon: BookOpenIcon,
      color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
    }
  ]

  // Žemėlapis iš UI tipų į backend tipų lauką
  const uiTypeToBackendType: Record<
    'dainos' | 'ritminiai_zaidimai' | 'instrumentai' | 'judesio_zaidimai' | 'mankstos' | 'choreografijos' | 'pamoku_planai',
    'video' | 'audio' | 'lesson_plan' | 'game'
  > = {
    dainos: 'audio',
    ritminiai_zaidimai: 'game',
    instrumentai: 'lesson_plan',
    judesio_zaidimai: 'game',
    mankstos: 'video',
    choreografijos: 'video',
    pamoku_planai: 'lesson_plan',
  }
  
  // (moved) watchers and progress are defined after form initialization
  
  // Real-time validation
  const validateTitle = (value: string) => {
    if (!value || !value.trim()) {
      return "Pavadinimas privalomas"
    }
    if (value.trim().length < 3) {
      return "Pavadinimas turi būti bent 3 simbolių"
    }
    if (value.trim().length > 100) {
      return "Pavadinimas turi būti trumpesnis nei 100 simbolių"
    }
    return true
  }
  
  // Check authentication directly
  useEffect(() => {
    if (loading) return
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to access content creation',
        variant: 'destructive'
      })
      router.push('/login?callbackUrl=/manage/content/new')
      return
    }
    
    // If authenticated but not admin, redirect home
    if (isAuthenticated && !isAdmin()) {
      toast({
        title: 'Access denied',
        description: 'You need administrator access to create content',
        variant: 'destructive'
      })
      router.push('/')
      return
    }
    
    console.log('Authentication verified:', { 
      email: user?.email,
      isAuthenticated,
      isAdmin: isAdmin()
    })
  }, [isAuthenticated, loading, user, isAdmin, router])
  
  // Define form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      title: "",
      ageGroups: [],
      categories: [],
      accessTierId: accessTiers.find(tier => tier.name === 'free')?.id || '',
      published: false,
      attachments: [],
    },
  })
  
  // Watch for content type changes to determine when to show next steps
  const watchedType = form.watch("type")
  const watchedTitle = form.watch("title")
  
  // Calculate form completion progress
  const calculateProgress = () => {
    const fields = form.getValues()
    let completed = 0
    let total = 6 // type, title, ageGroups, categories, accessTierId, published
    
    if (fields.type) completed++
    if (fields.title && fields.title.trim()) completed++
    if (fields.ageGroups && fields.ageGroups.length > 0) completed++
    if (fields.categories && fields.categories.length > 0) completed++
    if (fields.accessTierId) completed++
    completed++ // published always has a default value
    
    return Math.round((completed / total) * 100)
  }
  
  const progress = calculateProgress()
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (attachmentsUploading) {
      toast({
        title: 'Failai dar įkeliami',
        description: 'Palaukite kol įkėlimas bus užbaigtas prieš kuriant turinį.',
        variant: 'destructive'
      })
      return
    }
    // --- ADDED DEBUG LOG --- 
    console.log('%%% ENTERING NewContentEditor onSubmit - API Route Version %%%');
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      console.log("Submitting content form with values:", values)
      
      // Prepare the data payload for the API route
      // Exclude the thumbnail File object, it needs separate handling
      const payload: Omit<z.infer<typeof formSchema>, 'thumbnail' | 'type'> & { type: 'video' | 'audio' | 'lesson_plan' | 'game', author_id?: string, metadata?: any } = {
        title: values.title,
        type: uiTypeToBackendType[values.type],
        published: values.published,
        accessTierId: values.accessTierId,
        ageGroups: values.ageGroups,
        categories: values.categories,
        metadata: {
          attachments: attachments,
          ui_type: values.type,
          ui_type_label: contentTypes.find(t => t.value === values.type)?.label || values.type
        }
      };
      
      console.log("Sending payload to API:", payload);
      
      // Get auth token for the API request header
      const token = localStorage.getItem('supabase_access_token');

      // --- ADDED DEBUG LOG --- 
      console.log('%%% PREPARING TO FETCH /api/manage/content %%%');
      
      // Call the API route
      const response = await fetch('/api/manage/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '' // Include token
        },
        body: JSON.stringify(payload),
      });

      // --- ADDED DEBUG LOG --- 
      console.log(`%%% FETCH Response Status: ${response.status} %%%`);

      const result = await response.json();

      if (!response.ok) {
        console.error("API error creating content:", result);
        throw new Error(result.error || `API request failed with status ${response.status}`);
      }

      if (!result.contentId) {
         throw new Error("API succeeded but did not return a content ID.");
      }
      
      const contentId = result.contentId;
      console.log("Content created via API, ID:", contentId);

      // Step 4: Upload thumbnail if provided (using a separate API route or direct client upload)
      if (values.thumbnail instanceof File) {
          console.log('Thumbnail provided, needs to be uploaded separately for content ID:', contentId);
          
          try {
              // Upload thumbnail using our API endpoint
              const formData = new FormData();
              formData.append('file', values.thumbnail);
              formData.append('type', 'thumbnail');
              
              // Get auth token
              const token = localStorage.getItem('supabase_access_token');
              
              // Use our API endpoint to upload the thumbnail
              const uploadResponse = await fetch('/api/manage/upload-image', {
                  method: 'POST',
                  headers: {
                      'Authorization': token ? `Bearer ${token}` : ''
                  },
                  body: formData
              });
              
              if (!uploadResponse.ok) {
                  const errorData = await uploadResponse.json();
                  console.error('Error uploading thumbnail:', errorData);
                  // Continue without throwing - we'll just use the editor without a thumbnail
              } else {
                  const uploadResult = await uploadResponse.json();
                  
                  if (uploadResult.url) {
                      console.log('Thumbnail uploaded successfully:', uploadResult.url);
                      
                      // Update the content record with the thumbnail URL
                      const updateResponse = await fetch(`/api/manage/content/${contentId}`, {
                          method: 'PATCH',
                          headers: {
                              'Content-Type': 'application/json',
                              'Authorization': token ? `Bearer ${token}` : ''
                          },
                          body: JSON.stringify({
                              thumbnail_url: uploadResult.url
                          })
                      });
                      
                      if (!updateResponse.ok) {
                          console.error('Error updating content with thumbnail URL:', await updateResponse.json());
                      }
                  }
              }
          } catch (uploadError) {
              console.error('Thumbnail upload failed:', uploadError);
              // Continue without thumbnail if upload fails
          }
      }
      
      // Show success message
      toast({
        title: "Turinys sėkmingai sukurtas",
        description: "Nukreipiama į turinio redaktorių kūrimui tęsti",
      })
      
      // Navigate to content editor to edit the content body
      const editorUrl = `/manage/content/editor/${contentId}`;
      console.log('Redirecting to content editor:', editorUrl);
      console.log('Current authentication state:', { isAuthenticated, loading });
      
      // Use a slight delay to ensure the toast is shown before redirecting
      setTimeout(() => {
        console.log('Executing redirect to:', editorUrl);
        router.push(editorUrl);
      }, 1000);
      
    } catch (err) {
      // --- ADDED DEBUG LOG --- 
      console.log('%%% ERROR caught in onSubmit %%%', err);
      console.error("Error creating content:", err)
      const errorMessage = err instanceof Error ? err.message : "Nepavyko sukurti turinio";
      setError(errorMessage)
      
      toast({
        title: "Klaida",
        description: "Nepavyko sukurti turinio. Bandykite dar kartą.",
        variant: "destructive"
      })
    } finally {
      // --- ADDED DEBUG LOG --- 
      console.log('%%% FINALLY block in onSubmit %%%');
      setIsSubmitting(false)
    }
  }
  
  // Handle thumbnail file change
  const handleThumbnailFile = (file: File) => {
    // Tikrinti failo dydį (maks. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      form.setError('thumbnail', { 
        message: "Failas turi būti mažesnis nei 5MB" 
      })
      return
    }
    
    // Tikrinti failo tipą
    if (!file.type.startsWith('image/')) {
      form.setError('thumbnail', { 
        message: "Leidžiami tik paveikslėlių failai" 
      })
      return
    }
    
    // Set the file in the form
    form.setValue('thumbnail', file)
    form.clearErrors('thumbnail')
    
    // Create a preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleThumbnailFile(file)
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      handleThumbnailFile(imageFile)
    }
  }
  
  // Clear thumbnail
  const clearThumbnail = () => {
    form.setValue('thumbnail', null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }
  
  return (
    <ProtectedRoute requiredRole={UserRoles.ADMIN}>
      <div className="container py-8">
        <PageHeader
          title="Kurti naują turinį"
          backUrl="/"
        />
        
        
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card className="p-6">
          {/* Progreso indikatorius */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresas</span>
              <span className="text-sm text-muted-foreground">{progress}% užpildyta</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* 1 žingsnis: Turinio tipo pasirinkimas */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Kokį turinio tipą kuriate?</h2>
                  <p className="text-sm text-muted-foreground mb-4">Pasirinkite formatą, kuris geriausiai tinka jūsų turiniui</p>
                </div>
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {contentTypes.map((type) => {
                            const Icon = type.icon
                            const isSelected = field.value === type.value
                            return (
                              <div
                                key={type.value}
                                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                    : `${type.color} border-2`
                                }`}
                                onClick={() => field.onChange(type.value)}
                              >
                                <div className="flex items-start space-x-3">
                                  <Icon className={`w-6 h-6 mt-1 ${isSelected ? 'text-primary' : 'text-gray-600'}`} />
                                  <div className="flex-1">
                                    <h3 className={`font-semibold ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                                      {type.label}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                                  </div>
                                  {isSelected && (
                                    <CheckIcon className="w-5 h-5 text-primary" />
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 2 žingsnis: Pavadinimas (rodyti pasirinkus tipą) */}
              {watchedType && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                  <FormField
                    control={form.control}
                    name="title"
                    rules={{
                      validate: validateTitle
                    }}
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Koks bus jūsų {contentTypes.find(t => t.value === watchedType)?.label.toLowerCase()} pavadinimas?
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder={`Įrašykite aiškų pavadinimą (${contentTypes.find(t => t.value === watchedType)?.label.toLowerCase()})`}
                              className={`text-lg py-3 pr-12 ${
                                fieldState.error 
                                  ? 'border-red-300 focus:border-red-500' 
                                  : field.value && field.value.trim() && !fieldState.error
                                  ? 'border-green-300 focus:border-green-500'
                                  : ''
                              }`}
                              {...field} 
                            />
                            {field.value && field.value.trim() && !fieldState.error && (
                              <CheckIcon className="w-5 h-5 text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
                            )}
                          </div>
                        </FormControl>
                        <div className="flex justify-between items-center">
                          <FormDescription>Padarykite pavadinimą aiškų ir patrauklų – tai matys vartotojai pirmiausia</FormDescription>
                          <span className={`text-xs ${field.value && field.value.length > 80 ? 'text-orange-500' : 'text-gray-400'}`}>
                            {field.value?.length || 0}/100
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              {/* Step 3: Additional Details - Show after title is entered */}
              {watchedType && watchedTitle && watchedTitle.trim() && (
                <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
                  {/* Miniatiūra */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold">Pridėti miniatiūrą (neprivaloma)</h3>
                    <FormField
                      control={form.control}
                      name="thumbnail"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-4">
                              <div 
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer"
                                onDragOver={handleDragOver}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => (document.getElementById('thumbnail-upload') as HTMLInputElement)?.click()}
                              >
                                <div className="flex flex-col items-center justify-center space-y-4">
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      Įtempkite paveikslėlį čia arba {" "}
                                      <label htmlFor="thumbnail-upload" className="text-primary hover:text-primary/80 cursor-pointer">
                                        pasirinkite
                                      </label>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      PNG, JPG iki 5MB (rekomenduojama 1280×720px)
                                    </p>
                                  </div>
                                </div>
                                <Input
                                  id="thumbnail-upload"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleThumbnailChange}
                                  className="hidden"
                                  {...field}
                                />
                              </div>
                              
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
                                    Remove
                                  </Button>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Auditorija ir temos */}
                  <div className="space-y-6">
                    <h3 className="text-base font-semibold">Kam skirtas šis turinys?</h3>
              
                    <FormField
                      control={form.control}
                      name="ageGroups"
                      render={() => (
                        <FormItem>
                          <CheckboxCardGroup
                            form={form}
                            name="ageGroups"
                            label="Amžiaus grupės"
                            description="Pasirinkite amžiaus grupes, kurioms šis turinys tinkamas"
                            items={ageGroups.map(group => ({
                              id: group.id,
                              label: group.range,
                              description: group.description || '',
                            }))}
                          />
                          <FormMessage />
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
                            label="Temos"
                            description="Pasirinkite temas, kurioms priklauso šis turinys"
                            items={categories
                              .slice()
                              .sort((a: any, b: any) => String(a?.name || '').localeCompare(String(b?.name || ''), 'lt', { sensitivity: 'base' }))
                              .map(category => ({
                                id: category.id,
                                label: category.name,
                                description: category.description || '',
                              }))}
                          />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        'Nemokama'
                                      )}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Kas galės matyti šį turinį?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="published"
                        render={({ field }) => (
                          <FormItem className="flex flex-col justify-center">
                            <div className="flex items-center space-x-3">
                              <FormControl>
                                <Checkbox
                                  id="published"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel htmlFor="published" className="font-semibold">
                                  Publikuoti nedelsiant
                                </FormLabel>
                                <FormDescription>
                                  Padaryti turinį matomą vartotojams iškart
                                </FormDescription>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Priedai */}
                    <div className="space-y-4">
                      <h3 className="text-base font-semibold">Pridėti atsisiunčiamus failus (neprivaloma)</h3>
                      <p className="text-sm text-muted-foreground">
                        Įkelkite papildomus išteklius, kuriuos vartotojai galės atsisiųsti
                      </p>
                      
                      <FileAttachmentsUploader
                        initialAttachments={attachments}
                        onAttachmentsChange={setAttachments}
                        onUploadingChange={setAttachmentsUploading}
                      />
                    </div>
                  </div>
                </div>
              )}
            
              {/* Veiksmas - rodyti, kai esminiai laukai užpildyti */}
              {watchedType && watchedTitle && watchedTitle.trim() && (
                <div className="flex justify-end pt-6 border-t animate-in slide-in-from-bottom-4 duration-300">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || attachmentsUploading} 
                    size="lg"
                    className="px-8"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Kuriama...
                      </>
                    ) : attachmentsUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Įkeliami failai...
                      </>
                    ) : (
                      <>
                        Tęsti į redaktorių
                        <ChevronRightIcon className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
          </form>
        </Form>
      </Card>
    </div>
    </ProtectedRoute>
  )
}