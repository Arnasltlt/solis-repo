'use client'

import * as React from "react"
import { 
  FormControl, 
  FormField as HookFormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils/index"
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form"

interface FormFieldBaseProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  form: UseFormReturn<TFieldValues>
  name: TName
  label: string
  description?: string
  placeholder?: string
  className?: string
  required?: boolean
}

interface TextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends FormFieldBaseProps<TFieldValues, TName> {
  type: 'text' | 'email' | 'password' | 'number' | 'url'
}

interface TextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends FormFieldBaseProps<TFieldValues, TName> {
  type: 'textarea'
  rows?: number
}

interface SelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends FormFieldBaseProps<TFieldValues, TName> {
  type: 'select'
  options: { label: string; value: string }[]
}

interface CheckboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends FormFieldBaseProps<TFieldValues, TName> {
  type: 'checkbox'
  checkboxLabel?: string
}

interface RadioFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends FormFieldBaseProps<TFieldValues, TName> {
  type: 'radio'
  options: { label: string; value: string }[]
}

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = 
  | TextFieldProps<TFieldValues, TName>
  | TextareaFieldProps<TFieldValues, TName>
  | SelectFieldProps<TFieldValues, TName>
  | CheckboxFieldProps<TFieldValues, TName>
  | RadioFieldProps<TFieldValues, TName>

/**
 * StandardFormField - A standardized form field component
 * 
 * This component provides a consistent interface for different form field types:
 * - text, email, password, number, url: Standard input fields
 * - textarea: Multi-line text input
 * - select: Dropdown selection
 * - checkbox: Single checkbox
 * - radio: Radio button group
 * 
 * It handles error states, required fields, and consistent styling automatically.
 */
export function StandardFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: FormFieldProps<TFieldValues, TName>) {
  const { form, name, label, description, required, className } = props
  const hasError = !!form.formState.errors[name]

  return (
    <HookFormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className={cn(
            hasError && "text-destructive font-bold",
          )}>
            {label} {required && hasError && "(privalomas)"}
          </FormLabel>
          
          {description && <FormDescription>{description}</FormDescription>}
          
          {renderFormControl(props, field, hasError)}
          
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Helper function to render the appropriate form control based on type
function renderFormControl<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: FormFieldProps<TFieldValues, TName>, field: any, hasError: boolean) {
  const errorClass = hasError ? "border-destructive ring-destructive" : ""
  
  switch (props.type) {
    case 'textarea':
      return (
        <FormControl>
          <Textarea
            placeholder={props.placeholder}
            className={cn("resize-none", errorClass)}
            rows={props.rows || 3}
            {...field}
          />
        </FormControl>
      )
    
    case 'select':
      return (
        <Select 
          onValueChange={field.onChange} 
          defaultValue={field.value}
        >
          <FormControl>
            <SelectTrigger className={errorClass}>
              <SelectValue placeholder={props.placeholder || "Pasirinkite"} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    
    case 'checkbox':
      return (
        <FormControl>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              id={`checkbox-${props.name}`}
              className={errorClass}
            />
            {props.checkboxLabel && (
              <label
                htmlFor={`checkbox-${props.name}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {props.checkboxLabel}
              </label>
            )}
          </div>
        </FormControl>
      )
    
    case 'radio':
      return (
        <FormControl>
          <RadioGroup
            onValueChange={field.onChange}
            value={field.value}
            className="flex flex-col space-y-1"
          >
            {props.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`radio-${props.name}-${option.value}`} />
                <label
                  htmlFor={`radio-${props.name}-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </RadioGroup>
        </FormControl>
      )
    
    default:
      return (
        <FormControl>
          <Input
            type={props.type}
            placeholder={props.placeholder}
            className={errorClass}
            {...field}
          />
        </FormControl>
      )
  }
} 