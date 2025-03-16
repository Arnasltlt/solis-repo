'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SparklesIcon, CheckIcon, CreditCardIcon } from '@heroicons/react/24/solid'
import { toast } from '@/hooks/use-toast'
import { useSupabase } from '@/components/supabase-provider'
import { useAuth } from '@/hooks/useAuth'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Mock upgrade function (to be replaced with real payment processing)
  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      if (!user || !supabase) {
        throw new Error('Vartotojas arba duomenų bazės klientas nepasiekiamas')
      }

      // In a real application, this would process payment first
      // For now, update the user's tier directly for demonstration

      // Get the premium tier ID
      const { data: tierData, error: tierError } = await supabase
        .from('access_tiers')
        .select('id')
        .eq('name', 'premium')
        .single()
        
      if (tierError) {
        throw new Error('Nepavyko gauti premium plano duomenų')
      }
      
      // Update the user's subscription_tier_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ subscription_tier_id: tierData.id })
        .eq('id', user.id)
        
      if (updateError) {
        throw new Error('Nepavyko atnaujinti prenumeratos')
      }
      
      toast({
        title: 'Sėkmė!',
        description: 'Jūsų paskyra buvo atnaujinta į Premium.',
      })
      
      // Close modal and refresh the page to update UI
      onClose()
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Klaida',
        description: error.message || 'Nepavyko atnaujinti prenumeratos',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-amber-500" />
            <DialogTitle>Atnaujinti į Premium</DialogTitle>
          </div>
          <DialogDescription>
            Gaukite prieigą prie visų premium funkcijų
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-bold text-lg">Premium planas</h3>
                <p className="text-sm text-gray-600">Mėnesinis mokėjimas</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">€9.99</p>
                <p className="text-sm text-gray-600">per mėnesį</p>
              </div>
            </div>
          </div>
          
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Prieiga prie viso premium turinio</span>
            </li>
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Nauji premium turinio atnaujinimai</span>
            </li>
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Galite atšaukti bet kuriuo metu</span>
            </li>
          </ul>
        </div>
        
        <div className="pt-4">
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            disabled={isLoading}
          >
            <CreditCardIcon className="h-5 w-5 mr-2" />
            {isLoading ? 'Apdorojama...' : 'Prenumeruoti už €9.99/mėn.'}
          </Button>
          
          <p className="text-xs text-center mt-4 text-gray-500">
            Užsiprenumeruodami jūs sutinkate su mūsų paslaugų teikimo sąlygomis.
            Tai yra demonstracinė versija, realus mokėjimas nebus apdorotas.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}