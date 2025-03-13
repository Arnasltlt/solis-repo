'use client'

import React, { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/index'
import { useSupabase } from '@/components/supabase-provider'
import { toast } from '@/hooks/use-toast'

// Dynamically import Quill with no SSR
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-[500px] flex items-center justify-center">Loading editor...</div>
})

interface ContentEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  label?: string
  contentId?: string // The ID of the content being edited (needed for image uploads)
}

/**
 * A rich text editor component based on Quill with enhanced
 * image and video embedding capabilities
 */
export function ContentEditor({
  value,
  onChange,
  readOnly = false,
  label = "Content Body",
  contentId = 'temp'
}: ContentEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [editorValue, setEditorValue] = useState(value || '')
  const [editorMounted, setEditorMounted] = useState(false)
  const quillRef = useRef<any>(null)
  const { supabase } = useSupabase()

  // Update local state when prop value changes
  useEffect(() => {
    if (editorMounted) {
      setEditorValue(value || '')
    }
  }, [value, editorMounted])

  // Mark editor as mounted
  useEffect(() => {
    setEditorMounted(true)
    return () => {
      setEditorMounted(false)
    }
  }, [])

  // Handle image upload
  const handleImageUpload = async () => {
    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Supabase client not initialized'
      });
      return;
    }

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            variant: 'destructive',
            title: 'File too large',
            description: 'Image must be less than 5MB'
          });
          return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            variant: 'destructive',
            title: 'Invalid file type',
            description: 'Only image files are allowed'
          });
          return;
        }

        // Upload the file to Supabase storage
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${file.name}`;
        const filePath = `content/${contentId}/images/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('content-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });
        
        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('content-images')
          .getPublicUrl(filePath);
        
        // Insert the image into the editor
        const editor = quillRef.current?.getEditor();
        if (editor) {
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, 'image', publicUrlData.publicUrl);
          editor.setSelection(range.index + 1);
        }

        toast({
          title: 'Image Uploaded',
          description: 'Image has been added to your content'
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'Failed to upload image'
        });
      }
    };
  };

  // Custom toolbar handlers
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload
      }
    }
  };

  // Quill formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'align'
  ];

  // Handle editor change
  const handleEditorChange = (content: string) => {
    try {
      setEditorValue(content);
      onChange(content);
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update content. Please try again.'
      });
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Get a reference to the Quill editor instance
  useEffect(() => {
    if (editorMounted && quillRef.current) {
      const editor = quillRef.current.getEditor();
      if (editor) {
        // Store the editor instance
        quillRef.current = { getEditor: () => editor };
      }
    }
  }, [editorMounted]);

  if (!editorMounted) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        Loading editor...
      </div>
    );
  }

  return (
    <div className={cn("relative", isFullscreen && "fixed inset-0 z-50 bg-background p-4")}>
      <div className="mb-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{label}</Label>
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                type="button"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          
          <div className={cn(
            "border rounded-md overflow-hidden", 
            isFullscreen ? "h-[calc(100vh-8rem)]" : "h-[500px]"
          )}>
            <ReactQuill
              theme="snow"
              value={editorValue}
              onChange={handleEditorChange}
              modules={modules}
              formats={formats}
              readOnly={readOnly}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
} 