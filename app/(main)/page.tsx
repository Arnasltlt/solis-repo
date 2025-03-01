import { Suspense } from 'react'
import { ContentSkeleton } from '@/components/ui/loading-state'
import { AsyncErrorBoundary } from '@/components/ui/error-boundary'
import { getCachedReferenceData, getCachedContentItems } from '@/lib/utils/data-fetching'
import { HomeClientContent } from './home-client-content'

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="p-8"><ContentSkeleton count={6} /></div>}>
        <HomeContent />
      </Suspense>
    </div>
  )
}

async function HomeContent() {
  try {
    // Fetch all necessary data in parallel
    const [referenceData, contentItems] = await Promise.all([
      getCachedReferenceData(),
      getCachedContentItems()
    ])
    
    const { ageGroups, categories } = referenceData
    
    // Client component that handles filtering state
    return (
      <HomeClientContent 
        initialContent={contentItems}
        ageGroups={ageGroups}
        categories={categories}
      />
    )
  } catch (error: any) {
    return (
      <div className="p-8">
        <AsyncErrorBoundary 
          error={error} 
          reset={() => window.location.reload()} 
        />
      </div>
    )
  }
} 