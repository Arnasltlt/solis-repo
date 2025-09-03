import * as z from "zod"

/**
 * Common validation schemas for form fields
 * 
 * These schemas can be composed to create form validation schemas
 * with consistent validation rules and error messages.
 */

// Text field validations
export const requiredString = z.string().min(1, {
  message: "Šis laukas yra privalomas",
})

export const optionalString = z.string().optional()

export const requiredEmail = z.string().email({
  message: "Neteisingas el. pašto formatas",
})

export const requiredUrl = z.string().url({
  message: "Neteisingas URL formatas",
})

export const requiredNumber = z.coerce.number({
  invalid_type_error: "Įveskite skaičių",
})

// Length validations
export const minLength = (min: number) => 
  z.string().min(min, {
    message: `Tekstas turi būti bent ${min} simbolių ilgio`,
  })

export const maxLength = (max: number) => 
  z.string().max(max, {
    message: `Tekstas negali būti ilgesnis nei ${max} simbolių`,
  })

// Common field schemas
export const titleSchema = requiredString.pipe(
  minLength(3).pipe(maxLength(100))
)

export const descriptionSchema = requiredString.pipe(
  minLength(10).pipe(maxLength(500))
)

export const slugSchema = requiredString
  .regex(/^[a-z0-9-]+$/, {
    message: "Slug gali turėti tik mažąsias raides, skaičius ir brūkšnelius",
  })
  .pipe(minLength(3).pipe(maxLength(100)))

// Helper function to create a schema for required selection
export const requiredSelection = (errorMessage?: string) => 
  z.string({
    required_error: errorMessage || "Pasirinkimas privalomas",
  })

// Helper function to create a schema for multiple selections
export const requiredMultipleSelection = (errorMessage?: string) => 
  z.array(z.string()).min(1, {
    message: errorMessage || "Pasirinkite bent vieną variantą",
  })

/**
 * Example usage:
 * 
 * const contentFormSchema = z.object({
 *   title: titleSchema,
 *   description: descriptionSchema,
 *   slug: slugSchema,
 *   type: requiredSelection("Pasirinkite turinio tipą"),
 *   categories: z.array(z.string()).optional(),
 * })
 */