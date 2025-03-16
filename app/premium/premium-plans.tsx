'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { useAuth } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import { PremiumModal } from '@/components/premium/premium-modal'

export function PremiumPlans() {
  const { isAuthenticated } = useAuth()
  const { isPremium } = useAuthorization()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  
  const isPremiumUser = isPremium()
  
  const handleSelectPlan = () => {
    if (isPremiumUser) {
      // Already premium, show message
      return
    }
    
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/premium`)
      return
    }
    
    setShowModal(true)
  }
  
  return (
    <>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center gap-8 max-w-5xl mx-auto">
            {/* Standard Plan */}
            <div className="w-full md:w-1/2 border rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold">Standartinė</h3>
                <div className="mt-4 flex items-end">
                  <span className="text-3xl font-bold">Nemokama</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Pagrindinė prieiga prie mokymosi turinio
                </p>
              </div>
              
              <div className="p-6">
                <ul className="space-y-4">
                  <li className="flex">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Prieiga prie nemokamo turinio</span>
                  </li>
                  <li className="flex">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Pagrindiniai mokymosi ištekliai</span>
                  </li>
                  <li className="flex">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Turinio filtravimas pagal kategoriją</span>
                  </li>
                  <li className="flex opacity-50">
                    <span className="h-5 w-5 border border-gray-300 rounded-full mr-2 flex-shrink-0"></span>
                    <span className="line-through">Premium turinio prieiga</span>
                  </li>
                </ul>
                
                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => router.push('/signup')}
                  disabled={isAuthenticated}
                >
                  {isAuthenticated ? 'Dabartinis planas' : 'Registruotis nemokamai'}
                </Button>
              </div>
            </div>
            
            {/* Premium Plan */}
            <div className="w-full md:w-1/2 border rounded-lg shadow-lg overflow-hidden relative bg-gradient-to-b from-amber-50 to-white border-amber-200">
              <div className="absolute top-0 right-0 bg-amber-500 text-white py-1 px-3 text-sm font-bold">
                REKOMENDUOJAMA
              </div>
              
              <div className="p-6 border-b border-amber-100">
                <div className="flex items-center">
                  <SparklesIcon className="h-5 w-5 text-amber-500 mr-2" />
                  <h3 className="text-xl font-bold">Narystė</h3>
                </div>
                
                <div className="mt-4 mb-1 flex items-end">
                  <span className="text-3xl font-bold">€9.99</span>
                  <span className="text-gray-500 ml-1">/mėn.</span>
                </div>
              </div>
              
              <div className="p-6">
                <ul className="space-y-4">
                  <li className="flex">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Viskas, kas yra standartiniame plane</span>
                  </li>
                  <li className="flex">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Neribota prieiga prie narystės turinio</span>
                  </li>
                  <li className="flex">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Aukštos kokybės mokymosi medžiaga</span>
                  </li>
                </ul>
                
                <Button
                  onClick={handleSelectPlan}
                  disabled={isPremiumUser}
                  className="w-full mt-6 bg-amber-600 hover:bg-amber-700"
                >
                  {isPremiumUser ? 'Dabartinis planas' : 'Atnaujinti į Premium'}
                </Button>
                
                <p className="text-xs text-center mt-4 text-gray-500">
                  Galite atšaukti bet kuriuo metu.
                </p>
              </div>
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