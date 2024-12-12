import { Filter } from 'lucide-react'

const contentTypes = [
  "Video for Kids",
  "Tutorial Video",
  "Song",
  "Text-based Game",
  "Lesson Plan",
  "Downloadable Resource",
]

const themes = ["Spring", "Wind", "Sun", "Holidays", "Christmas"]

const difficultyLevels = ["Beginner", "Intermediate", "Advanced"]

export default function Filters() {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Filter className="mr-2" size={20} />
        Filters
      </h2>
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Content Type</h3>
          {contentTypes.map((type) => (
            <div key={type} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={type}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={type} className="ml-2 text-sm text-gray-700">
                {type}
              </label>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-medium mb-2">Themes</h3>
          {themes.map((theme) => (
            <div key={theme} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={theme}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={theme} className="ml-2 text-sm text-gray-700">
                {theme}
              </label>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-medium mb-2">Difficulty Level</h3>
          {difficultyLevels.map((level) => (
            <div key={level} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={level}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={level} className="ml-2 text-sm text-gray-700">
                {level}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

