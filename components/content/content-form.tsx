'use client'

import { useState } from 'react'
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
import type { AgeGroup, Category, AccessTier } from "@/lib/types/database"
import type { ContentFormData } from "@/lib/types/content"
import { RichContentForm } from './rich-content-form'

const formSchema = z.object({
  type: z.enum(['video', 'audio', 'lesson_plan', 'game'], {
    required_error: "Pasirinkite turinio tipą",
  }),
  title: z.string().min(1, "Įveskite pavadinimą"),
  description: z.string().optional(),
  ageGroups: z.array(z.string()).min(1, "Pasirinkite bent vieną amžiaus grupę"),
  categories: z.array(z.string()).min(1, "Pasirinkite bent vieną kategoriją"),
  accessTierId: z.string({
    required_error: "Pasirinkite prieigos lygį",
  }),
  contentBody: z.string().min(1, "Įveskite turinį").refine(
    (val) => {
      try {
        const parsed = JSON.parse(val)
        return parsed && typeof parsed === 'object'
      } catch {
        return false
      }
    },
    "Neteisingas turinio formatas"
  ),
  published: z.boolean().default(true),
  thumbnail: z.instanceof(File, { message: "Įkelkite paveikslėlį" })
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
  isLoading = false
}: ContentFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      published: true,
      ageGroups: [],
      categories: [],
      accessTierId: accessTiers.find(tier => tier.name === 'free')?.id || '',
      contentBody: '',
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue('thumbnail', file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (values: FormData) => {
    try {
      console.log('Form values before submit:', values)
      await onSubmit(values)
      form.reset()
      setPreviewUrl(null)
      toast({
        title: "Sėkmingai išsaugota",
        description: "Turinys buvo sėkmingai sukurtas",
      })
    } catch (error) {
      console.error('Form submission error:', error)
      toast({
        variant: "destructive",
        title: "Klaida",
        description: "Nepavyko išsaugoti turinio",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Kortelės informacija</CardTitle>
            <CardDescription>
              Įveskite pagrindinę informaciją apie turinį
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turinio tipas</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pasirinkite tipą" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Daina</SelectItem>
                      <SelectItem value="lesson_plan">Pamoka</SelectItem>
                      <SelectItem value="game">Žaidimas</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Paveikslėlis</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-foreground hover:file:bg-primary/20"
                      />
                      {previewUrl && (
                        <div className="h-20 aspect-square rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Administravimas</CardTitle>
            <CardDescription>
              Nustatykite turinio prieinamumą ir kategorizaciją
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="accessTierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prieigos lygis</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      {accessTiers
                        .filter(tier => ['free', 'premium'].includes(tier.name))
                        .sort((a, b) => (a.name === 'free' ? -1 : 1))
                        .map((tier) => (
                          <FormItem key={tier.id}>
                            <FormLabel className="cursor-pointer">
                              <FormControl>
                                <RadioGroupItem value={tier.id} className="sr-only" />
                              </FormControl>
                              <div className={`
                                flex items-center gap-3 p-4 border-2 rounded-lg
                                transition-colors
                                ${field.value === tier.id ? 'border-primary bg-primary/5' : 'hover:bg-primary/5'}
                              `}>
                                {tier.name === 'premium' && (
                                  <SparklesIcon className="w-4 h-4 text-yellow-500" />
                                )}
                                <div>
                                  <div className="font-medium">
                                    {tier.name === 'free' ? 'Nemokamas' : 'Premium'}
                                  </div>
                                </div>
                              </div>
                            </FormLabel>
                          </FormItem>
                        ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ageGroups"
              render={() => (
                <FormItem>
                  <FormLabel>Amžiaus grupės</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {ageGroups.map((group) => (
                      <FormField
                        key={group.id}
                        control={form.control}
                        name="ageGroups"
                        render={({ field }) => {
                          return (
                            <FormItem key={group.id}>
                              <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(group.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, group.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== group.id
                                            )
                                          )
                                    }}
                                    className="sr-only"
                                  />
                                </FormControl>
                                <div className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-primary/5">
                                  <div>
                                    <div className="font-medium">{group.range}</div>
                                    {group.description && (
                                      <div className="text-sm text-muted-foreground">
                                        {group.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categories"
              render={() => (
                <FormItem>
                  <FormLabel>Kategorijos</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {categories.map((category) => (
                      <FormField
                        key={category.id}
                        control={form.control}
                        name="categories"
                        render={({ field }) => {
                          return (
                            <FormItem key={category.id}>
                              <FormLabel className="[&:has([data-state=checked])>div]:border-secondary-mint">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, category.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== category.id
                                            )
                                          )
                                    }}
                                    className="sr-only"
                                  />
                                </FormControl>
                                <div className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-secondary-mint/5">
                                  <div className="font-medium">{category.name}</div>
                                </div>
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Turinys</CardTitle>
            <CardDescription>
              Įveskite pagrindinį turinį
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="contentBody"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RichContentForm
                      contentBody={field.value || ''}
                      onChange={(_, value) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
              Saugoma...
            </div>
          ) : (
            'Išsaugoti'
          )}
        </Button>
      </form>
    </Form>
  )
} 