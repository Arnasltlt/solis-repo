import Link from "next/link"
import { ChevronRight } from 'lucide-react'

export default function Breadcrumbs() {
  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link href="/" className="text-gray-700 hover:text-blue-600">
            Home
          </Link>
        </li>
        <li>
          <div className="flex items-center">
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <Link href="/4-6" className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2">
              4-6 Years
            </Link>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <Link href="/category/dance" className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2">
              Dance
            </Link>
          </div>
        </li>
        <li aria-current="page">
          <div className="flex items-center">
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <span className="ml-1 text-gray-500 md:ml-2">Spring</span>
          </div>
        </li>
      </ol>
    </nav>
  )
}

