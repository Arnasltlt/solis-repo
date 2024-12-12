'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from "@/components/sidebar"
import { ContentArea } from "@/components/content-area"
import { Header } from "@/components/header"
import { Breadcrumb } from "@/components/breadcrumb"
import { allContentItems } from "@/lib/content-data"
import type { ContentItem } from "@/lib/content-data"

export default function Home() {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("4-6 metai")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>(allContentItems)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const newFilteredContent = allContentItems.filter((item) => {
      const ageGroupMatch = item.ageGroup === selectedAgeGroup
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(item.category)
      const searchMatch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      return ageGroupMatch && categoryMatch && searchMatch
    })
    setFilteredContent(newFilteredContent)
  }, [selectedAgeGroup, selectedCategories, searchQuery])

  const handleAgeGroupChange = (ageGroup: string) => {
    setSelectedAgeGroup(ageGroup)
  }

  const handleCategoryChange = (category: string, isChecked: boolean) => {
    setSelectedCategories((prev) => {
      if (isChecked) {
        return [...prev, category]
      } else {
        return prev.filter((c) => c !== category)
      }
    })
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <div className="flex h-full bg-yellow-50">
      <Sidebar
        className="w-64 border-r border-yellow-200 bg-white"
        selectedAgeGroup={selectedAgeGroup}
        selectedCategories={selectedCategories}
        onAgeGroupChange={handleAgeGroupChange}
        onCategoryChange={handleCategoryChange}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onSearch={handleSearch} />
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8">
            <Breadcrumb
              items={[
                { label: "Pradžia", href: "/" },
                { label: selectedAgeGroup, href: `/${selectedAgeGroup.toLowerCase().replace(/\s/g, '-')}` },
                { label: "Turinys", href: "#" },
              ]}
            />
            <ContentArea filteredContent={filteredContent} />
          </div>
        </div>
      </div>
    </div>
  )
}

