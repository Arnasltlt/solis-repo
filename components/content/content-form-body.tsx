'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import dynamic from "next/dynamic"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LinkIcon } from "@heroicons/react/24/outline"
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
 * - Content URL field for external content
 */
export function ContentFormBody({ 
  form, 
  loading,
  contentSchema
}: ContentFormBodyProps) {
  const [editorMounted, setEditorMounted] = useState(false)

  const contentType = form.watch("type")
  const isVideo = contentType === "video"
  const isAudio = contentType === "audio"
  const needsContentUrl = isVideo || isAudio

  return (
    <Card>
      <CardHeader>
        <CardTitle>Turinys</CardTitle>
        <CardDescription>
          Nurodykite turinį arba įkelkite nuorodą į išorinį šaltinį
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {needsContentUrl && (
          <FormField
            control={form.control}
            name="content_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isVideo ? "Vaizdo įrašo nuoroda" : "Garso įrašo nuoroda"}
                </FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        {...field}
                        disabled={loading}
                        placeholder={
                          isVideo
                            ? "https://www.youtube.com/watch?v=..."
                            : "https://soundcloud.com/..."
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="content_body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Turinys</FormLabel>
              <FormControl>
                <div className="relative">
                  <Editor
                    initialData={field.value || ""}
                    onChange={field.onChange}
                    readOnly={loading}
                  />
                  {!editorMounted && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">Kraunamas redaktorius...</span>
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
      </CardContent>
    </Card>
  )
} 