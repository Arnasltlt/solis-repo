import { Play, Music, FileText, Download } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ContentType, ContentItem } from '@/lib/content-data'

const contentItems: ContentItem[] = [
  {
    id: 1,
    title: "Spring Dance for Kids",
    type: "Vaizdo įrašas",
    ageGroup: "4-6 Years",
    description: "A fun dance routine celebrating spring for young children.",
    icon: Play,
    category: "Dance",
  },
  {
    id: 2,
    title: "Sing-along: The Wind Song",
    type: "Daina",
    ageGroup: "2-4 Years",
    description: "An interactive song about the wind for toddlers.",
    icon: Music,
    category: "Music",
  },
  {
    id: 3,
    title: "Sun Safety Lesson Plan",
    type: "Pamokos planas",
    ageGroup: "6+ Years",
    description: "Educational material teaching kids about sun protection.",
    icon: FileText,
    category: "Lesson Plans",
  },
  {
    id: 4,
    title: "Holiday Rhythm Game",
    type: "Žaidimas",
    ageGroup: "4-6 Years",
    description: "A fun game to teach rhythm using holiday themes.",
    icon: Download,
    category: "Games",
  },
]

export default function ContentGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contentItems.map((item) => (
        <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <img 
            src={`https://source.unsplash.com/400x300/?${item.category.toLowerCase()}`} 
            alt={item.title} 
            className="w-full h-40 object-cover" 
          />
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600">{item.ageGroup}</span>
              <item.icon className="text-gray-500" size={20} />
            </div>
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{item.description}</p>
            <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

