import { Play, Music, FileText, Download } from 'lucide-react'

const contentItems = [
  {
    id: 1,
    title: "Spring Dance for Kids",
    type: "Video for Kids",
    ageGroup: "4-6 Years",
    description: "A fun dance routine celebrating spring for young children.",
    thumbnail: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 2,
    title: "Sing-along: The Wind Song",
    type: "Song",
    ageGroup: "2-4 Years",
    description: "An interactive song about the wind for toddlers.",
    thumbnail: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 3,
    title: "Sun Safety Lesson Plan",
    type: "Lesson Plan",
    ageGroup: "6+ Years",
    description: "Educational material teaching kids about sun protection.",
    thumbnail: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 4,
    title: "Holiday Rhythm Game",
    type: "Text-based Game",
    ageGroup: "4-6 Years",
    description: "A fun game to teach rhythm using holiday themes.",
    thumbnail: "/placeholder.svg?height=200&width=300",
  },
]

const iconMap = {
  "Video for Kids": Play,
  Song: Music,
  "Lesson Plan": FileText,
  "Text-based Game": FileText,
  "Downloadable Resource": Download,
}

export default function ContentGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contentItems.map((item) => (
        <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <img src={item.thumbnail} alt={item.title} className="w-full h-40 object-cover" />
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600">{item.ageGroup}</span>
              {iconMap[item.type] && (
                <iconMap[item.type] className="text-gray-500" size={20} />
              )}
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

