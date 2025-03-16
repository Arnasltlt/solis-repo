'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  password: z.string().min(6, { message: 'Slaptažodis turi būti bent 6 simbolių.' }),
  confirmPassword: z.string().min(6, { message: 'Patvirtinkite savo slaptažodį.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Slaptažodžiai nesutampa.',
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof formSchema>

export function SignUpForm() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    try {
      const { data, error } = await signUp(values.email, values.password)
      
      console.log('Sign up response:', { data, error })
      
      if (error) {
        toast({
          title: 'Error signing up',
          description: error.message,
          variant: 'destructive',
        })
        return
      }
      
      toast({
        title: 'Success',
        description: 'Please check your email to confirm your account.',
      })
      
      // Redirect to a confirmation page
      router.push('/signup/confirmation')
      router.refresh()
    } catch (error: any) {
      console.error('Signup error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong with registration',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Registracija</CardTitle>
        <CardDescription>
          Sukurkite paskyrą, kad galėtumėte pasiekti mūsų turinį
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slaptažodis</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="••••••••" 
                      type="password" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pakartokite slaptažodį</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="••••••••" 
                      type="password" 
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
              {isLoading ? 'Kuriama paskyra...' : 'Registruotis'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-center">
          Jau turite paskyrą?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Prisijungti
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
} 