import Link from "next/link"
import { Search } from 'lucide-react'

const ageGroups = [
  { name: "2-4 Years", href: "/2-4" },
  { name: "4-6 Years", href: "/4-6" },
  { name: "6+ Years", href: "/6+" },
]

const categories = [
  { name: "Dance", href: "/category/dance" },
  { name: "Music", href: "/category/music" },
  { name: "Lesson Plans", href: "/category/lesson-plans" },
  { name: "Warm-Ups", href: "/category/warm-ups" },
  { name: "Games", href: "/category/games" },
]

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            EduKids
          </Link>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by keyword..."
              className="w-64 pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
        <div className="mt-4 flex items-center space-x-6">
          <div className="space-x-4">
            {ageGroups.map((group) => (
              <Link
                key={group.name}
                href={group.href}
                className="text-gray-600 hover:text-blue-600 font-medium"
              >
                {group.name}
              </Link>
            ))}
          </div>
          <div className="h-6 border-l border-gray-300"></div>
          <div className="space-x-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="text-gray-600 hover:text-blue-600"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  )
}

