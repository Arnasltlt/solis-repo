import { getContentById } from '@/lib/services/content'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/types/database'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { serializeForClient } from '@/lib/utils/serialization'
import { ContentEditor } from './ContentEditor'

export default async function ContentEditorPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  // Check authentication at the server side
  const { data: { session } } = await supabase.auth.getSession()
  
  // Rather than redirecting immediately, we'll let client-side authentication handle it
  // This prevents redirecting if there's a valid session in the browser
  // that hasn't been synchronized with the server yet
  
  // We still need content ID for the editor, even if we may end up redirecting
  // on the client side if the user isn't authenticated or not an admin
  
  try {
    // Fetch the content
    const content = await getContentById(params.id, supabase)
    
    if (!content) {
      return redirect('/manage/content?error=Content+not+found')
    }
    
    // Serialize content body before passing to client
    const serializedContent = serializeForClient(content.content_body || '')
    
    return (
      <div className="container py-8">
        <div className="mb-6">
          <PageHeader title="Content Editor" backUrl="/" />
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-gray-600">Edit your content body</p>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Homepage
              </Link>
            </Button>
          </div>
        </div>
        
        <ContentEditor contentId={params.id} initialContent={serializedContent} />
      </div>
    )
  } catch (error) {
    console.error('Error fetching content:', error)
    return redirect('/manage/content?error=Error+fetching+content')
  }
} 