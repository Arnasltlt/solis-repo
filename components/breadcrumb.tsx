import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex mb-4" aria-label="Navigacija">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && <ChevronRight className="w-5 h-5 text-gray-400" />}
            <Link
              href={item.href}
              className={`inline-flex items-center text-sm font-medium ${
                index === items.length - 1
                  ? 'text-gray-500 cursor-default'
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}

