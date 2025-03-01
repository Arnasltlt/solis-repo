'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { z } from "zod"

// Dynamically import the editor to avoid SSR issues
const Editor = dynamic(
  () => import("@/components/editor/editor-wrapper").then(mod => mod.Editor), 
  {
    ssr: false,
    loading: () => <div className="border rounded-md p-4 h-64 animate-pulse bg-muted" />
  }
)

interface ContentFormBodyProps {
  form: UseFormReturn<any>
  loading: boolean
  contentSchema: z.ZodObject<any>
}

/**
 * ContentFormBody - Content body form fields
 * 
 * This component includes:
 * - Rich text editor for content body
 */
export function ContentFormBody({ 
  form, 
  loading,
  contentSchema
}: ContentFormBodyProps) {
  const [editorMounted, setEditorMounted] = useState(false)

  // Set up the editor
  useEffect(() => {
    const timer = setTimeout(() => {
      setEditorMounted(true)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h3 className="text-lg font-medium mb-1">Turinio redaktorius</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sukurkite ir redaguokite turinį naudodami formatavimo įrankius
        </p>
      </div>

      <FormField
        control={form.control}
        name="content_body"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="relative border rounded-md min-h-[400px]">
                {editorMounted ? (
                  <Editor
                    initialData={field.value || ""}
                    onChange={field.onChange}
                    readOnly={loading}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                      <span className="text-sm text-muted-foreground">Kraunamas redaktorius...</span>
                    </div>
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {contentSchema.shape.content_body.isOptional && (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => form.setValue("content_body", "")}
            className="text-xs"
            disabled={!form.getValues("content_body")}
          >
            Išvalyti turinį
          </Button>
        </div>
      )}
    </div>
  )
} 