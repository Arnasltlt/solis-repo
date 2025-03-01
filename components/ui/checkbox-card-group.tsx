'use client'

import * as React from "react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils/index"
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form"

interface CheckboxCardGroupProps<
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
 * CheckboxCardGroup - A styled checkbox group component
 * 
 * This component provides a grid of styled checkbox cards:
 * - Each card represents a checkbox option
 * - Cards highlight when selected
 * - Supports optional icons and descriptions
 * - Customizable grid layout
 */
export function CheckboxCardGroup<
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
}: CheckboxCardGroupProps<TFieldValues, TName>) {
  const hasError = !!form.formState.errors[name]
  const accentClasses = {
    primary: {
      checked: "border-primary",
      hover: "hover:bg-primary/5"
    },
    secondary: {
      checked: "border-secondary",
      hover: "hover:bg-secondary/5"
    },
    "secondary-mint": {
      checked: "border-secondary-mint",
      hover: "hover:bg-secondary-mint/5"
    }
  }[accentColor] || { checked: "border-primary", hover: "hover:bg-primary/5" }
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem className={className}>
          <FormLabel className={cn(
            hasError && "text-destructive font-bold",
          )}>
            {label}
          </FormLabel>
          
          {description && (
            <p className="text-sm text-muted-foreground mb-2">{description}</p>
          )}
          
          <div className={cn(
            "grid gap-4",
            columns === 1 && "grid-cols-1",
            columns === 2 && "grid-cols-1 sm:grid-cols-2",
            columns === 3 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
            columns === 4 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
          )}>
            {items.map((item) => (
              <FormField
                key={item.id}
                control={form.control}
                name={name}
                render={({ field }) => {
                  // Handle array values for multiple selection
                  const isArray = Array.isArray(field.value)
                  const isChecked = isArray
                    ? field.value?.includes(item.id)
                    : field.value === item.id
                  
                  const handleChange = (checked: boolean) => {
                    if (isArray) {
                      // For multiple selection (array value)
                      return checked
                        ? field.onChange([...field.value, item.id])
                        : field.onChange(
                            field.value?.filter((value: string) => value !== item.id)
                          )
                    } else {
                      // For single selection (string value)
                      return checked ? field.onChange(item.id) : field.onChange(undefined)
                    }
                  }
                  
                  return (
                    <FormItem>
                      <FormLabel className={cn(
                        "[&:has([data-state=checked])>div]:" + accentClasses.checked
                      )}>
                        <FormControl>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={handleChange}
                            className="sr-only"
                          />
                        </FormControl>
                        <div className={cn(
                          "flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors",
                          accentClasses.hover
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
                  )
                }}
              />
            ))}
          </div>
          
          <FormMessage />
        </FormItem>
      )}
    />
  )
} 