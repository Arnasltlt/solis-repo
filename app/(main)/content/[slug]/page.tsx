import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ContentDetail } from '@/components/content/content-detail'
import { PageHeader } from '@/components/ui/page-header'
import { getCachedContentBySlug } from '@/lib/utils/data-fetching'
import { ContentDetailSkeleton } from '@/components/ui/loading-state'
import { AsyncErrorBoundary } from '@/components/ui/error-boundary'

interface ContentDetailPageProps {
  params: {
    slug: string
  }
}

export default async function ContentDetailPage({ params }: ContentDetailPageProps) {
  const { slug } = params
  
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Turinys" backUrl="/" />
      
      <Suspense fallback={<ContentDetailSkeleton />}>
        <ContentDetailContent slug={slug} />
      </Suspense>
    </div>
  )
}

// Separate component for content fetching to work with Suspense
async function ContentDetailContent({ slug }: { slug: string }) {
  try {
    // Fetch content data with optimized fetching utility
    const content = await getCachedContentBySlug(slug)
    
    // If content not found, show 404
    if (!content) {
      notFound()
    }
    
    return <ContentDetail content={content} />
  } catch (error: any) {
    // Handle errors with our error boundary
    return (
      <AsyncErrorBoundary 
        error={error} 
        reset={() => window.location.reload()} 
      />
    )
  }
} 