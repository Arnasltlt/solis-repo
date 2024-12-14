import type { ContentItem } from '@/lib/types/database'

interface ContentCardProps {
  content: ContentItem
}

export function ContentCard({ content }: ContentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {content.thumbnail_url && (
        <img
          src={content.thumbnail_url}
          alt={content.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{content.description}</p>
        
        {/* Age Groups */}
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Amžiaus grupės:</h4>
          <div className="flex flex-wrap gap-1">
            {content.age_groups.map(group => (
              <span
                key={group.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-black"
              >
                {group.range}
              </span>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Kategorijos:</h4>
          <div className="flex flex-wrap gap-1">
            {content.categories.map(category => (
              <span
                key={category.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-900 text-white"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>

        {/* Content Type */}
        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-black">
            {content.type === 'video' && 'Video'}
            {content.type === 'audio' && 'Audio'}
            {content.type === 'lesson_plan' && 'Lesson Plan'}
            {content.type === 'game' && 'Game'}
          </span>
        </div>
      </div>
    </div>
  )
} 