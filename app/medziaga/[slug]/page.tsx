import { Metadata } from 'next'
import { getContentBySlug } from '@/lib/services/content'
import { ContentDetail } from '@/components/content/content-detail'
import { notFound } from 'next/navigation'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

type Props = {
  params: { slug: string }
}

// Helper to create Supabase client instance
const createClient = () => {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // Add set/remove if needed, although likely not required for metadata/page load
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        }
      }
    }
  )
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  try {
    const supabaseServerClient = createClient()
    const content = await getContentBySlug(params.slug, supabaseServerClient);

    const description = content?.description || 'Default description if none provided.';
    const title = content?.title || 'Default Title';
    const imageUrl = content?.thumbnail_url || undefined;

    return {
      title: `${title} | Solis`,
      description: description,
      openGraph: {
        title: title,
        description: description,
        images: imageUrl ? [imageUrl] : [],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch (error) {
    console.error('Error generating metadata for slug:', params.slug, error);
    return {
      title: 'Content Not Found | Solis',
      description: 'The requested content could not be found.',
    }
  }
}

// Define Premium Tier ID constant
const PREMIUM_TIER_ID = '211e060c-37c0-44fa-8344-8e5e5f24d5db';

export default async function ContentPage({ params }: Props) {
  const supabase = createClient()
  const slug = params.slug;

  console.log(`[Page Load Start] Attempting to load slug: ${slug}`);

  try {
    // Step 1: Fetch content (RLS check happens here via authenticated client)
    // RLS SELECT policies are now permissive for published content for non-admins
    const content = await getContentBySlug(slug, supabase);

    // If RLS blocked (e.g., unpublished and not admin) or slug invalid, getContentBySlug throws
    // The catch block below will handle this and call notFound()

    // If content was fetched successfully:
    console.log(`[Page Load] Content fetched for slug: ${slug}, Title: ${content.title}. Rendering detail component.`);

    // Step 2: Render the detail component, passing the fetched content.
    // Access control (showing full content vs. upsell) will happen CLIENT-SIDE within ContentDetail.
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ContentDetail content={content} />
      </div>
    );

  } catch (error) {
    // Catch errors from getContentBySlug (e.g., RLS denied unpublished, actual fetch error, or slug not found)
    console.error(`[Page Load Error] Error processing page for slug ${slug}:`, error);
    // Trigger 404 for any error during fetch
    notFound();
  }
} 