'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"

interface ContentFormMediaProps {
  form: UseFormReturn<any>
}

/**
 * ContentFormMedia - Media upload form fields
 * 
 * This component includes form fields for:
 * - Thumbnail image upload
 * - Image preview
 */
export function ContentFormMedia({ form }: ContentFormMediaProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue('thumbnail', file, { shouldValidate: true })
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paveikslėlis</CardTitle>
        <CardDescription>
          Įkelkite paveikslėlį, kuris bus rodomas turinio kortelėje
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="thumbnail"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel>Turinio nuotrauka</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-foreground hover:file:bg-primary/20"
                  />
                  {previewUrl ? (
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
                        onClick={() => {
                          setPreviewUrl(null);
                          form.setValue('thumbnail', null);
                        }}
                      >
                        Pašalinti
                      </Button>
                    </div>
                  ) : (
                    <div className="h-40 w-full rounded-lg border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <p className="text-gray-500 text-center">
                        Įkelkite paveikslėlį arba vilkite jį čia
                      </p>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Rekomenduojamas paveikslėlio dydis: 1280x720px
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
} 