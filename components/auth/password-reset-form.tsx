'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

// UI components
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const formSchema = z.object({
  email: z.string().email({ message: 'Įveskite teisingą el. pašto adresą.' }),
})

type FormValues = z.infer<typeof formSchema>

export function PasswordResetForm() {
  const { resetPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    try {
      await resetPassword(values.email)
      setIsSubmitted(true)
      toast({
        title: 'Slaptažodžio atstatymo laiškas išsiųstas',
        description: 'Patikrinkite el. paštą, norėdami gauti slaptažodžio atstatymo nuorodą.',
      })
    } catch (error: any) {
      toast({
        title: 'Klaida',
        description: error.message || 'Nepavyko išsiųsti slaptažodžio atstatymo laiško. Bandykite dar kartą.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Patikrinkite el. paštą</CardTitle>
          <CardDescription>
            Išsiuntėme slaptažodžio atstatymo nuorodą į jūsų el. paštą.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p>
            Patikrinkite el. paštą ir sekite instrukcijas slaptažodžiui atkurti.
          </p>
          <p className="mt-4">
            Negavote laiško?{' '}
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-primary hover:underline"
            >
              Pabandykite dar kartą
            </button>
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-primary hover:underline">
            Atgal į prisijungimą
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Atkurti slaptažodį</CardTitle>
        <CardDescription>
          Įveskite el. pašto adresą ir atsiųsime nuorodą slaptažodžiui atkurti.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>El. paštas</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="email@example.com" 
                      type="email"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Siunčiama nuoroda...' : 'Siųsti nuorodą'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-center">
          Prisiminate slaptažodį?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Prisijungti
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}