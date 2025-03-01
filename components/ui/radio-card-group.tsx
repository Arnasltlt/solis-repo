'use client'

import * as React from "react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils/index"
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form"

interface RadioCardGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  form: UseFormReturn<TFieldValues>
  name: TName
  label: string
  description?: string
  items: {
    id: string
    label: string
    description?: string
    icon?: React.ReactNode
  }[]
  columns?: 1 | 2 | 3 | 4
  accentColor?: string
  className?: string
}

/**
 * RadioCardGroup - A styled radio button group component
 * 
 * This component provides a grid of styled radio cards:
 * - Each card represents a radio option
 * - Cards highlight when selected
 * - Supports optional icons and descriptions
 * - Customizable grid layout
 */
export function RadioCardGroup<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  name,
  label,
  description,
  items,
  columns = 2,
  accentColor = "primary",
  className
}: RadioCardGroupProps<TFieldValues, TName>) {
  const hasError = !!form.formState.errors[name]
  const accentClasses = {
    primary: {
      checked: "border-primary bg-primary/5",
      hover: "hover:bg-primary/5"
    },
    secondary: {
      checked: "border-secondary bg-secondary/5",
      hover: "hover:bg-secondary/5"
    },
    "secondary-mint": {
      checked: "border-secondary-mint bg-secondary-mint/5",
      hover: "hover:bg-secondary-mint/5"
    }
  }[accentColor] || { checked: "border-primary bg-primary/5", hover: "hover:bg-primary/5" }
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className={cn(
            hasError && "text-destructive font-bold",
          )}>
            {label}
          </FormLabel>
          
          {description && (
            <p className="text-sm text-muted-foreground mb-2">{description}</p>
          )}
          
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className={cn(
                "grid gap-4",
                columns === 1 && "grid-cols-1",
                columns === 2 && "grid-cols-1 sm:grid-cols-2",
                columns === 3 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
                columns === 4 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
              )}
            >
              {items.map((item) => (
                <FormItem key={item.id}>
                  <FormLabel className="cursor-pointer">
                    <FormControl>
                      <RadioGroupItem value={item.id} className="sr-only" />
                    </FormControl>
                    <div className={cn(
                      "flex items-center gap-3 p-4 border-2 rounded-lg transition-colors",
                      field.value === item.id ? accentClasses.checked : accentClasses.hover
                    )}>
                      {item.icon && (
                        <div className="flex-shrink-0">
                          {item.icon}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        )}
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
  )
} 