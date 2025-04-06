'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import { AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from "@/lib/types/database"

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
  const [fileError, setFileError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      setIsAuthenticated(!!data.session?.user)
    }
    
    checkAuth()
  }, [supabase])

  const validateFilename = (filename: string): boolean => {
    // Check if filename contains spaces or special characters
    const invalidChars = /[^a-zA-Z0-9.-]/g
    return !invalidChars.test(filename)
  }

  const sanitizeFilename = (filename: string): string => {
    return filename.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileError(null)
    
    if (file) {
      // Check if filename is valid
      if (!validateFilename(file.name)) {
        setFileError(`Filename contains spaces or special characters. Suggested filename: ${sanitizeFilename(file.name)}`)
        // We'll still allow the upload but show a warning
      }
      
      // Check if user is authenticated
      if (isAuthenticated === false) {
        setFileError("You are not authenticated. The thumbnail will not be uploaded, but you can still create content with a default thumbnail.")
      }
      
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
                  
                  {isAuthenticated === false && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-700">
                        You are not logged in. Thumbnail uploads require authentication, but you can still create content with a default thumbnail.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {fileError && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-700">
                        {fileError}
                      </AlertDescription>
                    </Alert>
                  )}
                  
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
                          setFileError(null);
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
                Rekomenduojamas paveikslėlio dydis: 1280x720px. Failų pavadinimuose vengti tarpų ir specialių simbolių.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
} 