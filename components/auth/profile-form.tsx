'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'

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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSupabase } from '@/components/supabase-provider'

const profileFormSchema = z.object({
  email: z.string().email().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const { user, signOut } = useAuth()
  const { isPremium, isAdmin } = useAuthorization()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { supabase } = useSupabase()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: user?.email || '',
    },
  })

  // Update form when user data changes
  useEffect(() => {
    if (user?.email) {
      form.setValue('email', user.email)
    }
  }, [user, form])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      router.push('/')
      router.refresh()
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const upgradeToPremium = async () => {
    setIsLoading(true)
    try {
      if (!user || !supabase) return

      // In a real application, this would go through a payment flow first
      // For now, we'll just update the user's tier directly
      
      // Get the premium tier ID
      const { data: tierData, error: tierError } = await supabase
        .from('access_tiers')
        .select('id')
        .eq('name', 'premium')
        .single()
        
      if (tierError) {
        throw new Error('Failed to get premium tier data')
      }
      
      // Update the user's subscription_tier_id
      const { error: updateError } = await supabase
        .from('auth.users')
        .update({ subscription_tier_id: tierData.id })
        .eq('id', user.id)
        
      if (updateError) {
        throw new Error('Failed to upgrade subscription')
      }
      
      toast({
        title: 'Subscription upgraded',
        description: 'Your account has been upgraded to Premium.',
      })
      
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upgrade subscription',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isAdminUser = isAdmin()
  const isPremiumUser = isPremium()

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>
          Manage your account settings and subscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="account">
          <TabsList className="mb-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Account Information</h3>
              <p className="text-sm text-muted-foreground">
                Update your account details.
              </p>
            </div>
            
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/reset-password')}
                  >
                    Change Password
                  </Button>
                  
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleSignOut}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing out...' : 'Sign Out'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="subscription" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Subscription Information</h3>
              <p className="text-sm text-muted-foreground">
                Manage your subscription plan.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium">Current Plan</h4>
                <p className="text-sm">
                  {isAdminUser && 'Administrator'}
                  {isPremiumUser && !isAdminUser && 'Premium'}
                  {!isPremiumUser && !isAdminUser && 'Free'}
                </p>
              </div>
              
              {!isPremiumUser && !isAdminUser && (
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium">Upgrade to Premium</h4>
                  <p className="text-sm mt-1 mb-4">
                    Get unlimited access to all premium content and features.
                  </p>
                  <Button 
                    onClick={upgradeToPremium}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Upgrade Now'}
                  </Button>
                </div>
              )}
              
              {isPremiumUser && !isAdminUser && (
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium">Premium Plan</h4>
                  <p className="text-sm mt-1">
                    You have access to all premium content and features.
                  </p>
                </div>
              )}
              
              {isAdminUser && (
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium">Administrator Plan</h4>
                  <p className="text-sm mt-1">
                    You have full administrative access to the platform.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 