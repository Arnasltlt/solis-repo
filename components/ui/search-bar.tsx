"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils/index'

interface SearchBarProps {
  className?: string
  onSearch?: () => void
}

export function SearchBar({ className, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/?search=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/')
    }
    onSearch?.()
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex items-center w-full', className)}>
      <Input
        type="search"
        placeholder="Ieškoti..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-9 flex-1"
      />
      <Button type="submit" size="icon" variant="outline" className="ml-2 h-9 w-9">
        <Search className="h-4 w-4" />
        <span className="sr-only">Ieškoti</span>
      </Button>
    </form>
  )
}

export default SearchBar

