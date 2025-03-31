import { Suspense } from 'react'
import { ContentSkeleton } from '@/components/ui/loading-state'
import { getCachedReferenceData, getCachedContentItems } from '@/lib/utils/data-fetching'
import { serializeForClient } from '@/lib/utils/serialization'
import { HomeClientContent } from './home-client-content'
import { ErrorWrapper } from './error-wrapper'

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
    // Add timeout handling to prevent hanging requests
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Data fetching timeout')), 10000)
    );
    
    // We'll handle each promise individually to improve error resilience
    const referenceDataPromise = getCachedReferenceData().catch(error => {
      console.error('Error fetching reference data:', error);
      // Return default empty values on error
      return { 
        ageGroups: [], 
        categories: [],
        accessTiers: []
      };
    });
    
    const contentItemsPromise = getCachedContentItems().catch(error => {
      console.error('Error fetching content items:', error);
      // Return empty array on error
      return [];
    });
    
    // Wait for both promises with timeout
    const [referenceData, contentItems] = await Promise.race([
      Promise.all([referenceDataPromise, contentItemsPromise]),
      timeout
    ]) as [any, any];
    
    // If we get here, dataPromise resolved before timeout
    const { ageGroups, categories } = referenceData;
    
    // Default to empty arrays if data is missing
    const safeAgeGroups = Array.isArray(ageGroups) ? ageGroups : [];
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeContentItems = Array.isArray(contentItems) ? contentItems : [];
    
    // Serialize data before passing to client component
    const serializedContent = serializeForClient(safeContentItems)
    const serializedAgeGroups = serializeForClient(safeAgeGroups)
    const serializedCategories = serializeForClient(safeCategories)
    
    // Client component that handles filtering state
    return (
      <div className="p-4">
        <HomeClientContent 
          initialContent={serializedContent}
          ageGroups={serializedAgeGroups}
          categories={serializedCategories}
        />
      </div>
    )
  } catch (error: any) {
    // Log detailed error information
    console.error('Error in HomeContent data fetching:', error);
    
    // Convert error to a plain object that can be serialized
    const serializedError = {
      message: error.message || 'Unknown error',
      name: error.name || 'Error'
    }
    
    // Return error state
    return (
      <div className="p-8">
        <ErrorWrapper error={serializedError} />
      </div>
    )
  }
} 