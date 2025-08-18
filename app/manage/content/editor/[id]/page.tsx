import { getContentById } from '@/lib/services/content'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
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
  const cookieStore = cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        }
      }
    }
  )
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  try {
    const content = await getContentById(params.id, supabase)
    
    if (!content) {
      return redirect('/manage/content?error=Content+not+found')
    }
    
    const serializedContent = serializeForClient(content.content_body || '')
    
    return (
      <div className="container py-8">
        <div className="mb-6">
          <PageHeader title="Content Editor" backUrl="/manage/content/list" />
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-gray-600">Edit your content body</p>
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