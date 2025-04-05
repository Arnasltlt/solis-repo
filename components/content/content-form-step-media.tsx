'use client'

import React, { useState, useEffect } from 'react'
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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PhotoIcon, VideoCameraIcon, XMarkIcon } from "@heroicons/react/24/solid"
import type { ContentFormData } from "@/lib/types/content"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { FileUploader } from './file-uploader'
import { ContentType } from '@/lib/types/content'
import { uploadThumbnailAdmin } from '@/lib/services/admin-storage'

// Simple navigation component for form steps
interface ContentFormNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  canGoNext?: boolean;
  canGoBack?: boolean;
}

export const ContentFormNavigation: React.FC<ContentFormNavigationProps> = ({
  onBack,
  onNext,
  canGoNext = true,
  canGoBack = true
}) => {
  return (
    <div className="flex justify-between mt-8">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={!canGoBack}
      >
        Atgal
      </Button>
      <Button
        onClick={onNext}
        disabled={!canGoNext}
      >
        Toliau
      </Button>
    </div>
  );
};

const formSchema = z.object({
  thumbnail: z.instanceof(File).optional(),
  mediaUrl: z.string().optional(),
})

interface ContentFormStepMediaProps {
  initialData?: Partial<ContentFormData>
  onUpdate: (data: Partial<ContentFormData>) => void
  onComplete: (stepId: string) => void
  contentType?: string
}

export function ContentFormStepMedia({
  initialData,
  onUpdate,
  onComplete,
  contentType
}: ContentFormStepMediaProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      thumbnail: undefined,
      mediaUrl: initialData?.mediaUrl || '',
    },
  })

  // Watch form values and update parent
  useEffect(() => {
    const subscription = form.watch((value) => {
      onUpdate(value)
      if (value.thumbnail || value.mediaUrl) {
        onComplete('media')
      }
    })
    return () => subscription.unsubscribe()
  }, [form, onUpdate, onComplete])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
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
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
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
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const clearThumbnail = () => {
    form.setValue('thumbnail', undefined)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-8">
        {/* Thumbnail upload */}
        <FormField
          control={form.control}
          name="thumbnail"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Miniatiūra</FormLabel>
              <FormControl>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center",
                    isDragging ? "border-primary bg-primary/5" : "border-gray-300",
                    form.formState.errors.thumbnail && "border-destructive"
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {previewUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-xs rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={clearThumbnail}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                        >
                          <span>Įkelkite failą</span>
                          <input
                            id="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleFileChange}
                            {...field}
                          />
                        </label>
                        <p className="pl-1">arba tempkite ir meskite</p>
                      </div>
                      <p className="text-xs leading-5 text-gray-600">
                        PNG, JPG, GIF iki 10MB
                      </p>
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

        {/* Media URL input for video/audio content */}
        {(contentType === 'video' || contentType === 'audio') && (
          <FormField
            control={form.control}
            name="mediaUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {contentType === 'video' ? 'Video URL' : 'Audio URL'}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={contentType === 'video' ? 'https://youtube.com/...' : 'https://soundcloud.com/...'}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {contentType === 'video' 
                    ? 'YouTube arba Vimeo video nuoroda'
                    : 'SoundCloud arba kita audio nuoroda'
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Media preview */}
        {form.watch('mediaUrl') && (contentType === 'video' || contentType === 'audio') && (
          <Card className="p-4">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <VideoCameraIcon className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Media bus rodoma čia po publikavimo
            </p>
          </Card>
        )}
      </form>
    </Form>
  )
} 