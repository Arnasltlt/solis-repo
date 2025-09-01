'use client'

import { useEffect } from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckboxCardGroup } from "@/components/ui/checkbox-card-group"
import { SparklesIcon } from "@heroicons/react/24/solid"
import type { ContentFormData } from "@/lib/types/content"
import type { AgeGroup, Category, AccessTier } from "@/lib/types/database"

const formSchema = z.object({
  ageGroups: z.array(z.string()).min(1, { message: "Pasirinkite bent vieną amžiaus grupę" }),
  categories: z.array(z.string()).min(1, { message: "Pasirinkite bent vieną temą" }),
  accessTierId: z.string().min(1, { message: "Pasirinkite prieigos lygį" }),
  published: z.boolean().default(false),
})

interface ContentFormStepMetadataProps {
  initialData?: Partial<ContentFormData>
  onUpdate: (data: Partial<ContentFormData>) => void
  onComplete: (stepId: string) => void
  ageGroups: AgeGroup[]
  categories: Category[]
  accessTiers: AccessTier[]
}

export function ContentFormStepMetadata({
  initialData,
  onUpdate,
  onComplete,
  ageGroups,
  categories,
  accessTiers
}: ContentFormStepMetadataProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ageGroups: initialData?.ageGroups || [],
      categories: initialData?.categories || [],
      accessTierId: initialData?.accessTierId || accessTiers.find(tier => tier.name === 'free')?.id || '',
      published: initialData?.published || false,
    },
  })

  // Watch form values and update parent
  useEffect(() => {
    const subscription = form.watch((value) => {
      const formValues = form.getValues()
      if (form.formState.isValid && formValues) {
        const formData: Partial<ContentFormData> = {
          ageGroups: formValues.ageGroups || [],
          categories: formValues.categories || [],
          accessTierId: formValues.accessTierId,
          published: formValues.published,
        }
        onUpdate(formData)
        onComplete('metadata')
      }
    })
    return () => subscription.unsubscribe()
  }, [form, onUpdate, onComplete])

  return (
    <Form {...form}>
      <form className="space-y-8">
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
                label="Temos"
                description="Pasirinkite temas, kurioms priklauso turinys"
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
      </form>
    </Form>
  )
} 