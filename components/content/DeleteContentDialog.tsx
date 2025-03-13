'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useContentDelete } from './ContentDeleteManager'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { TrashIcon } from '@heroicons/react/24/outline'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useSupabase } from '@/components/supabase-provider'

interface DeleteContentDialogProps {
  contentId: string
  contentTitle: string
}

export function DeleteContentDialog({ contentId, contentTitle }: DeleteContentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { supabase } = useSupabase()
  const { registerDelete } = useContentDelete()

  const handleDelete = async () => {
    if (!supabase) return

    try {
      setIsDeleting(true)

      // Delete references in related tables first
      await Promise.all([
        supabase.from('content_age_groups').delete().eq('content_id', contentId),
        supabase.from('content_categories').delete().eq('content_id', contentId),
        supabase.from('content_feedback').delete().eq('content_id', contentId)
      ])

      // Finally delete the content item
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', contentId)

      if (error) {
        throw error
      }

      // Close the dialog
      setIsOpen(false)
      
      // Show success message
      toast({
        title: 'Content deleted',
        description: 'The content has been permanently deleted',
      })

      // Register this content as deleted in our context
      registerDelete(contentId)
      
      // If we're on a content detail page, redirect to home page
      if (window.location.pathname.includes('/medziaga/')) {
        router.push('/')
      } else {
        // If we're on a listing page, just tell Next.js to refresh data
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete content. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <div 
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 h-8 text-xs cursor-pointer px-3 hover:bg-accent rounded-md"
        >
          <TrashIcon className="h-3 w-3" />
          Delete
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Content</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{contentTitle}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}