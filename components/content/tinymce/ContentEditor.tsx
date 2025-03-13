'use client'

import React, { useRef, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/index'
import { useSupabase } from '@/components/supabase-provider'
import { toast } from '@/hooks/use-toast'

interface ContentEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  label?: string
  contentId?: string // The ID of the content being edited (needed for image uploads)
}

/**
 * A rich text editor component based on TinyMCE with enhanced
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
  const [isLoading, setIsLoading] = useState(true)
  const editorRef = useRef<any>(null)
  const { supabase } = useSupabase()

  // Handle image upload
  const handleImageUpload = async (blobInfo: any, progress: Function): Promise<string> => {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const file = blobInfo.blob();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${blobInfo.filename()}`;
      const filePath = `content/${contentId}/images/${fileName}`;
      
      // Upload the file to Supabase storage
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
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // TinyMCE initialization options
  const editorInit = {
    height: isFullscreen ? 'calc(100vh - 200px)' : 500,
    menubar: true,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar: readOnly ? false : 
      'undo redo | blocks | ' +
      'bold italic forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | image media link | help',
    content_style: `
      body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 16px; }
      img { max-width: 100%; height: auto; border-radius: 0.5rem; }
      .mce-content-body [data-mce-selected="inline-boundary"] { background-color: transparent; }
      .video-embed { width: 100%; margin: 1rem 0; }
      .video-embed iframe { width: 100%; aspect-ratio: 16/9; border-radius: 0.5rem; }
    `,
    readonly: readOnly,
    branding: false,
    promotion: false,
    images_upload_handler: handleImageUpload,
    media_live_embeds: true,
    media_alt_source: false,
    media_poster: false,
    media_dimensions: false,
    file_picker_types: 'image media',
    convert_urls: false,
    relative_urls: false,
    remove_script_host: false,
    setup: (editor: any) => {
      editor.on('init', () => {
        setIsLoading(false);
        if (isFullscreen) {
          editor.execCommand('mceFullScreen');
        }
      });
    }
  };

  // Handle editor change
  const handleEditorChange = (content: string) => {
    try {
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
    try {
      const newFullscreenState = !isFullscreen;
      setIsFullscreen(newFullscreenState);
      
      if (editorRef.current) {
        if (newFullscreenState) {
          editorRef.current.execCommand('mceFullScreen');
        } else {
          editorRef.current.execCommand('mceFullScreen');
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  return (
    <div className="relative">
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
            isLoading && "min-h-[500px] flex items-center justify-center"
          )}>
            {isLoading && (
              <div className="text-center">
                <p className="text-gray-500">Loading editor...</p>
              </div>
            )}
            <Editor
              tinymceScriptSrc="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js"
              onInit={(evt: any, editor: any) => editorRef.current = editor}
              initialValue={value || ''}
              init={editorInit}
              onEditorChange={handleEditorChange}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 