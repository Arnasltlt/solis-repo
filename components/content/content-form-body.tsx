'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import dynamic from "next/dynamic"
import { useState, useEffect, useCallback, useRef } from "react"
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
  onEditorFocus?: () => void
  onEditorBlur?: () => void
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
  contentSchema,
  onEditorFocus,
  onEditorBlur
}: ContentFormBodyProps) {
  const [editorMounted, setEditorMounted] = useState(false)
  const [editorKey, setEditorKey] = useState(Date.now())
  const editorInteractionsRef = useRef(0)
  const lastEditorValueRef = useRef<string>('')

  // Set up the editor
  useEffect(() => {
    console.log('Setting up editor with timeout');
    const timer = setTimeout(() => {
      console.log('Editor mounted');
      setEditorMounted(true)
    }, 500)
    
    return () => {
      console.log('Clearing editor setup timeout');
      clearTimeout(timer)
    }
  }, [])

  // Reset editor when form is reset
  useEffect(() => {
    console.log('Setting up form watch subscription');
    const subscription = form.watch((value, { name }) => {
      if (name === 'content_body') {
        console.log('content_body changed via form watch:', 
          value.content_body ? `${value.content_body.substring(0, 30)}...` : 'empty');
        
        if (value.content_body === '') {
          console.log('Resetting editor due to empty content_body');
          setEditorKey(Date.now());
        }
      }
    });
    
    return () => {
      console.log('Cleaning up form watch subscription');
      subscription.unsubscribe();
    }
  }, [form]);

  // Handle editor change
  const handleEditorChange = useCallback((value: string) => {
    editorInteractionsRef.current += 1;
    const interactionCount = editorInteractionsRef.current;
    
    console.log(`Editor content changed (${interactionCount}):`, {
      valueLength: value.length,
      valuePreview: value.substring(0, 50) + '...',
      formIsDirty: form.formState.isDirty,
      formIsSubmitted: form.formState.isSubmitted,
      formErrors: Object.keys(form.formState.errors).length > 0 ? 
        Object.keys(form.formState.errors) : 'none'
    });
    
    // Check if value is different from last value
    if (value !== lastEditorValueRef.current) {
      console.log('Editor value changed, updating form');
      lastEditorValueRef.current = value;
      
      // Update the form value without triggering validation
      try {
        // Detect if this is likely a formatting action (small change or active element is button)
        const isFormattingAction = document.activeElement?.tagName === 'BUTTON' || 
                                  (lastEditorValueRef.current && 
                                   Math.abs(lastEditorValueRef.current.length - value.length) < 10);
        
        console.log('Updating form value', { 
          isFormattingAction,
          activeElement: document.activeElement?.tagName || 'none'
        });
        
        // Use setValue with explicit options to prevent validation during formatting
        form.setValue("content_body", value, { 
          shouldValidate: !isFormattingAction, // Only validate if not a formatting action
          shouldDirty: true,
          shouldTouch: !isFormattingAction // Don't mark as touched during formatting
        });
        
        console.log('Form value updated successfully');
      } catch (error) {
        console.error('Error updating form value:', error);
      }
    } else {
      console.log('Editor value unchanged, skipping form update');
    }
  }, [form]);

  // Add editor focus/blur handlers
  const handleEditorFocus = useCallback(() => {
    console.log('Editor focused');
    onEditorFocus?.();
  }, [onEditorFocus]);

  const handleEditorBlur = useCallback(() => {
    console.log('Editor blurred');
    onEditorBlur?.();
  }, [onEditorBlur]);

  // Log when component renders
  console.log('ContentFormBody rendering', { 
    editorMounted, 
    editorKey,
    contentBodyValue: form.getValues('content_body') ? 'has value' : 'empty',
    formState: {
      isDirty: form.formState.isDirty,
      isSubmitted: form.formState.isSubmitted,
      errors: Object.keys(form.formState.errors)
    }
  });

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
        render={({ field }) => {
          console.log('FormField render for content_body', { 
            fieldValue: field.value ? 'has value' : 'empty',
            fieldName: field.name
          });
          
          return (
            <FormItem>
              <FormControl>
                <div 
                  className="relative border rounded-md min-h-[400px] bg-white text-gray-900"
                  onFocus={handleEditorFocus}
                  onBlur={handleEditorBlur}
                >
                  {editorMounted ? (
                    <Editor
                      key={editorKey}
                      initialData={field.value || ""}
                      onChange={handleEditorChange}
                      readOnly={loading}
                      onFocus={handleEditorFocus}
                      onBlur={handleEditorBlur}
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
          );
        }}
      />

      {contentSchema.shape.content_body.isOptional && (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('Clear content button clicked');
              form.setValue("content_body", "");
              setEditorKey(Date.now());
            }}
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