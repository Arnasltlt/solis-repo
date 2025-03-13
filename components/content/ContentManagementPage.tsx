'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ContentItem, AgeGroup, Category } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Edit, Eye, Trash } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'

interface ContentManagementPageProps {
  contentItems: ContentItem[]
  ageGroups: AgeGroup[]
  categories: Category[]
  canCreate?: boolean
}

export function ContentManagementPage({
  contentItems,
  ageGroups,
  categories,
  canCreate = false
}: ContentManagementPageProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter content items based on search query
  const filteredItems = searchQuery
    ? contentItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : contentItems
  
  // Handle edit button click
  const handleEdit = (id: string) => {
    router.push(`/manage/content/edit/${id}`)
  }
  
  // Handle view button click
  const handleView = (slug: string) => {
    router.push(`/medziaga/${slug}`)
  }
  
  // Handle edit content button click
  const handleEditContent = (id: string) => {
    router.push(`/manage/content/editor/${id}`)
  }
  
  return (
    <ProtectedRoute requiredRole="administrator">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Content Management</h1>
          {canCreate && (
            <Link href="/manage/content?tab=create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Content
              </Button>
            </Link>
          )}
        </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Content List</CardTitle>
          <CardDescription>
            Manage your content items. You can edit, view, or delete content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {filteredItems.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.type === 'video' && 'Video'}
                          {item.type === 'audio' && 'Audio'}
                          {item.type === 'lesson_plan' && 'Lesson Plan'}
                          {item.type === 'game' && 'Game'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.published ? "default" : "secondary"}>
                          {item.published ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canCreate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canCreate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditContent(item.id)}
                            >
                              Edit Content
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(item.slug)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No content items match your search.' : 'No content items found.'}
              </p>
              {canCreate && (
                <Link href="/manage/content?tab=create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Content
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </ProtectedRoute>
  )
} 