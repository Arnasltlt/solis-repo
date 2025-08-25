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
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { ContentFormData } from "@/lib/types/content"

const formSchema = z.object({
  type: z.enum(['video', 'audio', 'lesson_plan', 'game'], {
    required_error: "Pasirinkite turinio tipą",
  }),
  title: z.string().min(1, { message: "Įveskite pavadinimą" }),
})

interface ContentFormStepBasicsProps {
  initialData?: Partial<ContentFormData>
  onUpdate: (data: Partial<ContentFormData>) => void
  onComplete: (stepId: string) => void
}

export function ContentFormStepBasics({
  initialData,
  onUpdate,
  onComplete
}: ContentFormStepBasicsProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialData?.type || undefined,
      title: initialData?.title || '',
    },
  })

  // Only update parent when form is valid and user has interacted with it
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues()
      const isValid = form.formState.isValid
      const isDirty = form.formState.isDirty
      const touchedFields = Object.keys(form.formState.touchedFields)

      // Only proceed if form is valid, dirty, and user has touched required fields
      if (isValid && isDirty && touchedFields.length > 0) {
        // Check if required fields have been touched
        const hasRequiredFields = touchedFields.some(field => 
          field === 'type' || field === 'title'
        )
        
        if (hasRequiredFields) {
          onUpdate(values)
          onComplete('basics')
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form, onUpdate, onComplete])

  return (
    <Form {...form}>
      <form className="space-y-8">
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
                    <FormLabel className="font-normal">
                      Video
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="audio" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Daina
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="lesson_plan" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Pamoka
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="game" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Žaidimas
                    </FormLabel>
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
              <FormDescription>
                Trumpas ir aiškus pavadinimas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

      </form>
    </Form>
  )
} 