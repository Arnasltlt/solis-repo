'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
})

type FormValues = z.infer<typeof formSchema>

export function SignInForm() {
  const { signIn, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [callbackUrl, setCallbackUrl] = useState('/')
  
  // Get the callback URL from the search params
  useEffect(() => {
    const callback = searchParams.get('callbackUrl')
    if (callback) {
      setCallbackUrl(callback)
      console.log('Found callback URL:', callback)
    }
  }, [searchParams])
  
  // If user is already authenticated, redirect to callback URL
  useEffect(() => {
    if (isAuthenticated) {
      router.push(callbackUrl)
    }
  }, [isAuthenticated, callbackUrl, router])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    try {
      // Call signIn - error handling (toast) is done inside the signIn function
      await signIn(values.email, values.password)
      
      // If signIn didn't throw an error, show success toast and redirect
      toast({
        title: 'Sėkmingai',
        description: 'Jūs prisijungėte',
      })
      
      // Redirect to callback URL if provided, otherwise go to homepage
      router.push(callbackUrl)
      router.refresh()
    } catch (error: any) {
      // This catch block will handle errors thrown *by* signIn if it didn't catch them,
      // or other unexpected errors during the process.
      // However, the current signIn implementation catches its own Supabase errors.
      toast({
        title: 'Klaida',
        description: error.message || 'Įvyko netikėta klaida',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Prisijungti</CardTitle>
        <CardDescription>
          Įveskite el. paštą ir slaptažodį, kad pasiektumėte paskyrą
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
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Prisijungiama...' : 'Prisijungti'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center">
          <Link href="/reset-password" className="text-primary hover:underline">
            Pamiršote slaptažodį?
          </Link>
        </div>
        <div className="text-sm text-center">
          Neturite paskyros?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Registruotis
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
} 