import { Suspense } from 'react'
import { PremiumPlans } from './premium-plans'

export const metadata = {
  title: 'Narystė | Solis Mokymosi Platforma',
  description: 'Gaukite prieigą prie narystės mokymosi turinio su Solis Naryste.',
}

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Gaukite Narystę
          </h1>
          <p className="text-xl max-w-3xl mx-auto">
            Gaukite neribotą prieigą prie išskirtinio turinio ir narystės funkcijų,
            skirtų pagerinti jūsų mokymosi patirtį.
          </p>
        </div>
      </section>

      {/* Plans Section */}
      <Suspense fallback={<div className="py-16 text-center">Kraunama...</div>}>
        <PremiumPlans />
      </Suspense>
    </div>
  )
}