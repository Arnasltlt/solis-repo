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
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
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
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>

        {/* Content Type */}
        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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