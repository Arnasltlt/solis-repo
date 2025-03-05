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
import { RichContentForm } from './rich-content-form'
import type { ContentFormData } from "@/lib/types/content"

const formSchema = z.object({
  contentBody: z.string().min(1, { message: "Įveskite turinio turinį" }),
})

interface ContentFormStepContentProps {
  initialData?: Partial<ContentFormData>
  onUpdate: (data: Partial<ContentFormData>) => void
  onComplete: (stepId: string) => void
  contentType?: string
}

export function ContentFormStepContent({
  initialData,
  onUpdate,
  onComplete,
  contentType
}: ContentFormStepContentProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contentBody: initialData?.contentBody || '',
    },
  })

  // Watch form values and update parent
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (form.formState.isValid) {
        onUpdate(value)
        onComplete('content')
      }
    })
    return () => subscription.unsubscribe()
  }, [form, onUpdate, onComplete])

  const handleRichContentChange = (field: string, value: any) => {
    form.setValue(field, value, { shouldValidate: true })
  }

  return (
    <Form {...form}>
      <form className="space-y-8">
        <FormField
          control={form.control}
          name="contentBody"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Turinio turinys</FormLabel>
              <FormControl>
                <RichContentForm
                  contentBody={field.value}
                  onChange={handleRichContentChange}
                />
              </FormControl>
              <FormDescription>
                {contentType === 'lesson_plan'
                  ? 'Pamokos plano turinys'
                  : contentType === 'game'
                  ? 'Žaidimo aprašymas ir taisyklės'
                  : 'Papildoma informacija apie turinį'
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
} 