import { Play, Music, FileText, Download } from 'lucide-react'
import type { ContentItem } from '@/lib/database.types'

const iconMap = {
  'video': Play,
  'audio': Music,
  'lesson_plan': FileText,
  'game': Download,
}

interface ContentCardProps {
  content: ContentItem & {
    age_groups?: { range: string }
    categories?: { name: string }
  }
}

export function ContentCard({ content }: ContentCardProps) {
  const Icon = iconMap[content.type]

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video">
        <img
          src={content.thumbnail_url || 'https://picsum.photos/400/300'}
          alt={content.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Icon className="w-12 h-12 text-white" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{content.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {content.description}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-600">
            {content.age_groups?.range || 'Visiems amžiams'}
          </span>
          <span className="text-gray-500">
            {content.categories?.name || 'Bendra kategorija'}
          </span>
        </div>
      </div>
    </div>
  )
} 