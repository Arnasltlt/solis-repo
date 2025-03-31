'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PremiumPlan {
  id: string
  tierId: string
  name: string
  price: number
  currency: string
  features: string[]
  period: 'monthly' | 'yearly'
}

const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'premium_monthly',
    tierId: '00000000-0000-0000-0000-000000000001',
    name: 'Premium Monthly',
    price: 9.99,
    currency: 'EUR',
    features: [
      'Unlimited projects',
      'Advanced analytics',
      'Priority support',
      'Custom exports'
    ],
    period: 'monthly'
  },
  {
    id: 'premium_yearly',
    tierId: '00000000-0000-0000-0000-000000000001',
    name: 'Premium Yearly',
    price: 99.99,
    currency: 'EUR',
    features: [
      'Unlimited projects',
      'Advanced analytics',
      'Priority support',
      'Custom exports',
      '2 months free'
    ],
    period: 'yearly'
  }
]

interface PremiumModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PremiumModal({ open, onOpenChange }: PremiumModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null)

  const handleSelectPlan = (plan: PremiumPlan) => {
    setSelectedPlan(plan)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Upgrade to Premium</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <SparklesIcon className="h-16 w-16 text-amber-500 mb-4" />
          <h3 className="text-2xl font-bold mb-3">Coming Soon!</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            We're working on implementing our payment system. Premium subscriptions will be available shortly.
          </p>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}