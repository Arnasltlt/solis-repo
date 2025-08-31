'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth, UserRoles } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { getAgeGroups, getCategories, getAccessTiers, getContentById, updateContent, getContentUiTypes } from '@/lib/services/content'
import { FileAttachmentsUploader } from '@/components/content/file-attachments-uploader'
import type { AttachmentFile } from '@/components/content/file-attachments-uploader'
import { StreamlinedEditor } from '@/components/editor/streamlined-editor'

interface ContentEditorProps {
  contentId: string
  initialContent: string
}

export function ContentEditor({ contentId, initialContent }: ContentEditorProps) {
  const { supabase } = useSupabase()
  const { userRole, loading: authLoading } = useAuth()
  const { isAdmin, canManageContent } = useAuthorization()
  const [editorContent, setEditorContent] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  

  
  // Set initial content
  useEffect(() => {
    // Process the initial content - handle different formats
    let processedContent = initialContent

    // If the content is empty or just the placeholder, start with an empty string
    if (
      !initialContent ||
      initialContent === '' ||
      initialContent.trim() === '<p>Start editing your content here...</p>'
    ) {
      processedContent = ''
    } else {
      // Try to see if it's JSON format
      try {
        // If it parses as JSON, keep it as is (it's likely ProseMirror JSON)
        JSON.parse(initialContent)
        processedContent = initialContent
      } catch (e) {
        // If not JSON, it's probably HTML, so keep as is
      }
    }
    
    setEditorContent(processedContent)
  }, [initialContent])
  

  
  // Handle editor changes
  const handleContentChange = useCallback((content: string) => {
    setEditorContent(content)
  }, [])
  

  
  // Save function for the streamlined editor
  const handleSave = useCallback(async () => {
    if (!supabase || isSaving) return

    try {
      setIsSaving(true)

      // Get auth token for the API request header
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''

      const response = await fetch(`/api/manage/content/${contentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content_body: editorContent
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save content')
      }

    } catch (error) {
      console.error('Error saving content:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [supabase, contentId, editorContent, isSaving])
  

  
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [metaType, setMetaType] = useState<'video'|'audio'|'lesson_plan'|'game'>('video')
  const [metaUiType, setMetaUiType] = useState<string>('')
  const [refUiTypes, setRefUiTypes] = useState<{id:string, slug:string, name:string}[]>([])
  const [metaAgeGroups, setMetaAgeGroups] = useState<string[]>([])
  const [metaCategories, setMetaCategories] = useState<string[]>([])
  const [metaAccessTier, setMetaAccessTier] = useState<string>('')
  const [metaPublished, setMetaPublished] = useState<boolean>(false)
  const [refAgeGroups, setRefAgeGroups] = useState<any[]>([])
  const [refCategories, setRefCategories] = useState<any[]>([])
  const [refAccessTiers, setRefAccessTiers] = useState<any[]>([])
  const [metaAttachments, setMetaAttachments] = useState<AttachmentFile[]>([])
  const [attachmentsUploading, setAttachmentsUploading] = useState(false)

  const loadDetails = useCallback(async () => {
    try {
      setDetailsLoading(true)
      // Load refs in parallel
      const [ags, cats, tiers, ui] = await Promise.all([
        getAgeGroups(),
        getCategories(),
        getAccessTiers(),
        getContentUiTypes()
      ])
      setRefAgeGroups(ags || [])
      // Sort categories alphabetically by name for a predictable UI
      setRefCategories((cats || []).slice().sort((a: any, b: any) =>
        String(a?.name || '').localeCompare(String(b?.name || ''), 'lt', { sensitivity: 'base' })
      ))
      setRefAccessTiers(tiers || [])
      setRefUiTypes((ui || []).map((r:any) => ({ id: r.id, slug: r.slug, name: r.name })))
      // Load current content snapshot
      const content = await getContentById(contentId, supabase as any)
      if (content) {
        setMetaTitle(content.title || '')
        setMetaDescription(content.description || '')
        setMetaType(content.type)
        setMetaAgeGroups((content.age_groups || []).map((ag: any) => ag.id))
        setMetaCategories((content.categories || []).map((c: any) => c.id))
        setMetaAccessTier(content.access_tier?.id || '')
        setMetaPublished(!!content.published)
        setMetaAttachments(Array.isArray(content.metadata?.attachments) ? content.metadata.attachments : [])
        setMetaUiType((content as any)?.metadata?.ui_type || '')
      }
    } catch (e) {
      console.error('Failed to load details refs/content', e)
      toast({ title: 'Error', description: 'Failed to load details', variant: 'destructive' })
    } finally {
      setDetailsLoading(false)
    }
  }, [contentId, supabase])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  const toggleIdIn = (list: string[], id: string) => (
    list.includes(id) ? list.filter(x => x !== id) : [...list, id]
  )

  const saveDetails = async () => {
    try {
      if (!supabase) return
      setIsSaving(true)
      if (attachmentsUploading) {
        toast({ title: 'Failai dar įkeliami', description: 'Palaukite kol įkėlimas bus užbaigtas.', variant: 'destructive' })
        setIsSaving(false)
        return
      }
      await updateContent(
        contentId,
        {
          title: metaTitle,
          description: metaDescription,
          type: metaType,
          ageGroups: metaAgeGroups,
          categories: metaCategories,
          accessTierId: metaAccessTier,
          published: metaPublished,
          metadata: { attachments: metaAttachments, ui_type: metaUiType }
        },
        supabase
      )
        toast({ title: 'Details saved', description: 'Metadata updated successfully' })
    } catch (e: any) {
      console.error('Failed to save details', e)
      toast({ title: 'Error', description: e?.message || 'Failed to save details', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole={UserRoles.ADMIN}>

      
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label className="text-lg">Content Editor</Label>
          </div>
          
          <StreamlinedEditor
            initialContent={editorContent}
            onChange={setEditorContent}
            onSave={handleSave}
          />

          {detailsLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading…</p>
            </div>
          ) : (
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <Label className="text-sm">Title</Label>
                <Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Description</Label>
                <Textarea rows={3} value={metaDescription} onChange={e => setMetaDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Turinio tipas</Label>
                  <Select value={metaUiType} onValueChange={setMetaUiType}>
                    <SelectTrigger><SelectValue placeholder="Pasirinkite tipą" /></SelectTrigger>
                    <SelectContent>
                      {refUiTypes.map(t => (
                        <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Prieigos lygis</Label>
                  <Select value={metaAccessTier} onValueChange={setMetaAccessTier}>
                    <SelectTrigger><SelectValue placeholder="Pasirinkite lygį" /></SelectTrigger>
                    <SelectContent>
                      {refAccessTiers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Age Groups</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {refAgeGroups.map((ag) => (
                    <label key={ag.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={metaAgeGroups.includes(ag.id)} onCheckedChange={() => setMetaAgeGroups(prev => toggleIdIn(prev, ag.id))} />
                      {ag.range}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Categories</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {refCategories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={metaCategories.includes(cat.id)} onCheckedChange={() => setMetaCategories(prev => toggleIdIn(prev, cat.id))} />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="published-toggle" checked={metaPublished} onCheckedChange={(c) => setMetaPublished(!!c)} />
                <Label htmlFor="published-toggle" className="text-sm">Published</Label>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Priedai</Label>
                <FileAttachmentsUploader
                  initialAttachments={metaAttachments}
                  onAttachmentsChange={setMetaAttachments}
                  onUploadingChange={setAttachmentsUploading}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={saveDetails} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save details'}</Button>
              </div>
            </div>
          )}

        </div>
      </Card>
    </ProtectedRoute>
  )
}