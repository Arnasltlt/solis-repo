'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SparklesIcon, CheckIcon } from '@heroicons/react/24/solid'
import { useAuth } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import { useState } from 'react'
import { PremiumModal } from './premium-modal'

export function PremiumPromotion() {
  const { isAuthenticated } = useAuth()
  const { isPremium } = useAuthorization()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  
  const isPremiumUser = isPremium()
  
  // If user is already premium, don't show the promotion
  if (isPremiumUser) {
    return null
  }
  
  const handleUpgradeClick = () => {
    if (!isAuthenticated) {
      router.push('/login?returnUrl=/premium')
      return
    }
    
    // Show premium modal for authenticated users
    setShowModal(true)
  }
  
  return (
    <>
      <section className="py-12 bg-gradient-to-r from-amber-50 to-yellow-50 border-y border-amber-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center mb-3">
                <SparklesIcon className="h-6 w-6 text-amber-500 mr-2" />
                <h2 className="text-xl font-medium text-amber-800">Premium Narystė</h2>
              </div>
              
              <h3 className="text-3xl font-bold mb-4">Atrakinkite Premium Mokomąjį Turinį</h3>
              
              <p className="text-gray-700 mb-6">
                Gaukite neribotą prieigą prie mūsų premium mokomųjų išteklių bibliotekos, 
                įskaitant išskirtines vaizdo pamokas ir specializuotą mokomąją medžiagą.
              </p>
              
              <ul className="space-y-2 mb-6">
                {[
                  'Išskirtinis premium turinys',
                  'Aukštos kokybės vaizdo pamokos',
                  'Mokomieji žaidimai',
                  'Atsisiųsti mokomąją medžiagą',
                  'Reguliarūs turinio atnaujinimai'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white shadow-xl rounded-xl p-6 border border-amber-100 w-full md:w-auto md:min-w-[320px]">
              <div className="text-center mb-4">
                <SparklesIcon className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold">Premium Prieiga</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold">€9.99</span>
                  <span className="text-gray-500 ml-1">/mėn.</span>
                </div>
              </div>
              
              <Button 
                onClick={handleUpgradeClick}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                size="lg"
              >
                {isAuthenticated ? 'Atnaujinti Dabar' : 'Prisijunkite Norėdami Atnaujinti'}
              </Button>
              
              <p className="text-xs text-center mt-4 text-gray-500">
                Galite atšaukti bet kuriuo metu.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <PremiumModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  )
}