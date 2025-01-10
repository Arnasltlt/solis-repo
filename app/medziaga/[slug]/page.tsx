import { Metadata } from 'next'
import { getContentBySlug } from '@/lib/services/content'
import { ContentDetail } from '@/components/content/content-detail'
import { notFound } from 'next/navigation'

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  try {
    const content = await getContentBySlug(params.slug)

    return {
      title: `${content.title} | Solis`,
      description: content.description,
      openGraph: {
        title: content.title,
        description: content.description,
        images: content.thumbnail_url ? [content.thumbnail_url] : [],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: content.title,
        description: content.description,
        images: content.thumbnail_url ? [content.thumbnail_url] : [],
      },
    }
  } catch (error) {
    return {
      title: 'Content Not Found | Solis',
      description: 'The requested content could not be found.',
    }
  }
}

export default async function ContentPage({ params }: Props) {
  try {
    const content = await getContentBySlug(params.slug)
    return <ContentDetail content={content} />
  } catch (error) {
    notFound()
  }
} 