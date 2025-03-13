'use client'

import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import { Iframe } from '@/lib/extensions/iframe'
import { Youtube } from '@/lib/extensions/youtube'
import { YoutubeBlock } from '@/lib/extensions/youtube-block'
import { VimeoBlock } from '@/lib/extensions/vimeo-block'
import { HTML } from '@/lib/extensions/html'
import { uploadEditorImage } from '@/lib/services/storage'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Video,
  Image as ImageIcon,
  Bold,
  Italic,
  Plus,
  MinimizeIcon,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils/index'
import Placeholder from '@tiptap/extension-placeholder'

interface EditorProps {
  onChange: (data: string) => void
  initialData?: string
  readOnly?: boolean
  onFocus?: () => void
  onBlur?: () => void
  fullscreen?: boolean
  setFullscreen?: (fullscreen: boolean) => void
}

// Enhanced video ID extraction with better pattern matching and diagnostics
function extractVideoId(url: string): { platform: string; id: string } | null {
  try {
    // Sanitize URL input
    url = url.trim();
    
    // Try to normalize the URL by adding protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    console.log('Processing URL:', url);
    
    // YouTube - handle multiple URL formats with more comprehensive regex
    let match;
    
    // youtube.com/watch?v=ID format (most common)
    match = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:&|\?|#|$)/i);
    if (match && match[1]) {
      console.log('Extracted YouTube ID (standard format):', match[1]);
      return { platform: 'youtube', id: match[1] };
    }
    
    // youtube.com/embed/ID format (embedded players)
    match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\/|\?|#|$)/i);
    if (match && match[1]) {
      console.log('Extracted YouTube ID (embed format):', match[1]);
      return { platform: 'youtube', id: match[1] };
    }
    
    // youtu.be/ID format (short URLs)
    match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})(?:\/|\?|#|$)/i);
    if (match && match[1]) {
      console.log('Extracted YouTube ID (short format):', match[1]);
      return { platform: 'youtube', id: match[1] };
    }
    
    // m.youtube.com format (mobile)
    match = url.match(/m\.youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})(?:&|\?|#|$)/i);
    if (match && match[1]) {
      console.log('Extracted YouTube ID (mobile format):', match[1]);
      return { platform: 'youtube', id: match[1] };
    }
    
    // YouTube shorts
    match = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\/|\?|#|$)/i);
    if (match && match[1]) {
      console.log('Extracted YouTube ID (shorts format):', match[1]);
      return { platform: 'youtube', id: match[1] };
    }

    // Vimeo - handle multiple URL formats with more comprehensive regex
    
    // Standard vimeo.com/ID format
    match = url.match(/vimeo\.com\/(?:video\/|channels\/[^\/]+\/|groups\/[^\/]+\/videos\/|album\/[^\/]+\/video\/)?([0-9]+)(?:\/|\?|#|$)/i);
    if (match && match[1]) {
      console.log('Extracted Vimeo ID (standard format):', match[1]);
      return { platform: 'vimeo', id: match[1] };
    }
    
    // Embedded player format
    match = url.match(/player\.vimeo\.com\/video\/([0-9]+)(?:\/|\?|#|$)/i);
    if (match && match[1]) {
      console.log('Extracted Vimeo ID (player format):', match[1]);
      return { platform: 'vimeo', id: match[1] };
    }
    
    // App links
    match = url.match(/vimeo\.com\/app\/([0-9]+)/i);
    if (match && match[1]) {
      console.log('Extracted Vimeo ID (app format):', match[1]);
      return { platform: 'vimeo', id: match[1] };
    }
    
    // If we got here, no patterns matched
    console.log('No recognized video platform or ID found in URL:', url);
    return null;
  } catch (error) {
    console.error('Error extracting video ID:', error);
    return null;
  }
}

// Function to validate a video URL input
function validateVideoUrl(url: string): string | null {
  // Empty check
  if (!url || url.trim() === '') {
    return 'Please enter a video URL';
  }
  
  // Basic format check
  try {
    // Try to parse URL - will throw if malformed
    new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch (e) {
    return 'Please enter a valid URL';
  }
  
  // Video platform check
  if (!url.includes('youtube') && !url.includes('youtu.be') && !url.includes('vimeo')) {
    return 'Only YouTube and Vimeo videos are supported';
  }
  
  // If everything passed, return null (no error)
  return null;
}

// Improved video embed URL generation with proper parameters
function getVideoEmbedSrc(platform: string, id: string): string {
  try {
    switch (platform) {
      case 'youtube':
        // Use regular youtube.com since youtube-nocookie might be blocked
        return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&origin=${encodeURIComponent(window.location.origin)}`;
      case 'vimeo':
        // Add parameters for better embedding
        return `https://player.vimeo.com/video/${id}?dnt=1`;
      default:
        console.error('Unknown platform:', platform);
        return '';
    }
  } catch (error) {
    console.error('Error generating embed URL:', error);
    return '';
  }
}

export function Editor({ onChange, initialData = '', readOnly = false, onFocus, onBlur, fullscreen, setFullscreen }: EditorProps) {
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoError, setVideoError] = useState('')
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageError, setImageError] = useState('')
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [editorKey, setEditorKey] = useState<number>(Date.now())
  const editorInteractionsRef = useRef(0)
  const editorInstanceIdRef = useRef(`editor-${Date.now()}`)
  const lastUpdateTimeRef = useRef(Date.now())
  const editorMountedRef = useRef(false)

  // Log component render
  console.log(`Editor rendering (${editorInstanceIdRef.current})`, {
    readOnly,
    hasInitialData: !!initialData,
    initialDataLength: initialData?.length || 0,
    editorKey
  });

  const safeInitialData = useMemo(() => {
    console.log(`Processing initial data (${editorInstanceIdRef.current})`, {
      initialDataType: typeof initialData,
      initialDataLength: initialData?.length || 0,
      initialData: initialData?.substring(0, 100) // Log first 100 chars for debugging
    });
    
    if (!initialData) return '';
    
    // Handle the literal 'contentBody' string case
    if (initialData === 'contentBody') {
      console.log('Ignoring literal contentBody string');
      return '';
    }
    
    // If initialData is empty JSON object or empty string, return empty string
    if (initialData === '{}' || initialData === '""' || initialData === '') {
      console.log('Empty JSON object or empty string detected');
      return '';
    }
    
    const tryParseJSON = (str: string) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        console.log('JSON parse error:', e);
        return null;
      }
    };

    // Try to parse the content - handles both single and double encoded JSON
    let parsed = tryParseJSON(initialData);
    
    // If first parse succeeded, check if it's still a JSON string (double encoded)
    if (parsed && typeof parsed === 'string') {
      // Check for 'contentBody' after first parse
      if (parsed === 'contentBody') {
        console.log('Ignoring contentBody string after first parse');
        return '';
      }
      const secondParse = tryParseJSON(parsed);
      if (secondParse) {
        parsed = secondParse;
      }
    }
    
    // If we have valid parsed content in ProseMirror format, use it
    if (parsed && typeof parsed === 'object' && parsed.type === 'doc' && Array.isArray(parsed.content)) {
      console.log('Using ProseMirror JSON content');
      return parsed;
    }
    
    // Otherwise treat as HTML, but do one final check for 'contentBody'
    if (typeof parsed === 'string' && parsed === 'contentBody') {
      console.log('Ignoring contentBody string after parsing');
      return '';
    }
    
    console.log('Using HTML or raw content');
    return initialData;
  }, [initialData]);

  // Force editor reinitialization when initialData changes significantly
  useEffect(() => {
    if (initialData === '' || initialData === '{}') {
      console.log('Resetting editor due to empty initialData');
      setEditorKey(Date.now());
    }
  }, [initialData]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        history: {
          depth: 100, // Increase undo/redo history
          newGroupDelay: 500 // Group edits made within 500ms together
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing or paste content here...',
        showOnlyWhenEditable: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          class: 'editor-link'
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'left',
      }),
      // Configure image as a block element (not inline) to prevent mixing errors
      Image.configure({
        inline: false, // Must be false to avoid "mixing inline and block content" error
        allowBase64: true,
        draggable: true,
        HTMLAttributes: {
          class: 'editor-image',
        }
      }),
      // Add embedded video support
      Iframe.configure({
        HTMLAttributes: {
          class: readOnly ? 'iframe-read-only' : 'iframe-editable',
        },
      }),
      // YouTube support - both inline and block
      YoutubeBlock.configure({
        addPasteHandler: true,
        HTMLAttributes: {
          class: 'youtube-block',
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'youtube-embed',
        },
      }),
      // Vimeo support
      VimeoBlock.configure({
        addPasteHandler: true,
        HTMLAttributes: {
          class: 'vimeo-block',
        },
      }),
      // Keep necessary extensions for HTML rendering
      HTML.configure({
        HTMLAttributes: {
          class: 'html-content',
        },
      }),
    ],
    content: safeInitialData,
    editable: !readOnly,
    autofocus: 'end', // Focus at the end when initialized
    editorProps: {
      attributes: {
        class: 'prose-lg focus:outline-none max-w-full',
        spellcheck: 'true',
      },
      // Handle paste to filter out unwanted content
      handlePaste: (view, event, slice) => {
        // Let the image paste handler in our custom code handle images
        if (event.clipboardData?.items) {
          for (let i = 0; i < event.clipboardData.items.length; i++) {
            if (event.clipboardData.items[i].type.indexOf('image') !== -1) {
              return false; // Let our custom handler deal with it
            }
          }
        }
        
        // Allow default handling for all other content
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Debounce rapid changes
      clearTimeout(editorUpdateTimeout);
      
      editorUpdateTimeout = setTimeout(() => {
        // Save as ProseMirror JSON to preserve all features
        const content = editor.getJSON()
        const contentStr = JSON.stringify(content)
        
        // Log the update
        console.log('Editor onUpdate:', {
          contentLength: contentStr.length,
          hasContent: content.content && content.content.length > 0
        })
        
        // Increment interaction counter to track editor usage
        editorInteractionsRef.current += 1
        lastUpdateTimeRef.current = Date.now()
        
        // Check if the content is empty
        const isEmpty = !content.content || content.content.length === 0 || 
                      (content.content.length === 1 && 
                        content.content[0].type === 'paragraph' && 
                        (!content.content[0].content || content.content[0].content.length === 0));
        
        // If content is empty, just pass an empty string to avoid issues
        if (isEmpty) {
          onChange('');
          return;
        }
        
        // Pass the JSON stringified content
        onChange(contentStr)
      }, 300); // Debounce for 300ms to avoid excessive updates
    },
    onFocus: ({ event }) => {
      console.log('Editor focused');
      onFocus?.()
    },
    onBlur: ({ event }) => {
      console.log('Editor blurred');
      onBlur?.()
    },
  })
  
  // Variable to store the timeout ID for debounced updates
  let editorUpdateTimeout: ReturnType<typeof setTimeout>;

  // Log when editor is available or not
  useEffect(() => {
    console.log(`Editor instance status (${editorInstanceIdRef.current})`, {
      isAvailable: !!editor,
      isEditable: editor?.isEditable || false,
      content: editor?.getJSON()
    });
  }, [editor]);

  useEffect(() => {
    if (editor) {
      console.log(`Editor mounted (${editorInstanceIdRef.current})`)
      editorMountedRef.current = true
    }
    
    return () => {
      if (editor) {
        console.log(`Editor unmounting (${editorInstanceIdRef.current})`)
        editorMountedRef.current = false
      }
    }
  }, [editor])

  // Enhanced video dialog handling with better feedback
  const addVideo = () => {
    setVideoUrl('');
    setVideoError('');
    setVideoDialogOpen(true);
  }

  const handleVideoSubmit = () => {
    if (!editor) {
      setVideoError('Editor not initialized');
      return;
    }
    
    // Validate the video URL
    const validationError = validateVideoUrl(videoUrl);
    if (validationError) {
      setVideoError(validationError);
      return;
    }

    try {
      console.log('Processing video URL:', videoUrl);
      
      // Extract video ID from URL
      const videoInfo = extractVideoId(videoUrl);
      console.log('Extracted video info:', videoInfo);
      
      if (!videoInfo) {
        setVideoError('Could not extract video ID from URL. Please use a standard YouTube or Vimeo URL.');
        return;
      }
      
      // Show loading toast
      toast({
        title: "Adding video...",
        description: "Processing your video",
      });
      
      // Make sure editor is focused at a valid position
      editor.commands.focus();
      
      // For best positioning of video blocks, we need a paragraph
      // If the cursor is in the middle of a paragraph, better to create a new one
      const { selection } = editor.state;
      const isAtBlockStart = selection.$from.parentOffset === 0;
      
      if (!isAtBlockStart) {
        // Insert a paragraph first to ensure proper positioning
        editor.chain().insertContent({ type: 'paragraph' }).run();
      }
      
      if (videoInfo.platform === 'youtube') {
        // Use our dedicated YoutubeBlock extension
        try {
          console.log('Adding YouTube block with video ID:', videoInfo.id);
          
          // Use the standard command from the extension
          console.log('Attempting to insert YouTube block with:', {
            src: videoUrl,
            videoId: videoInfo.id
          });
          
          // Skip the command approach and directly use HTML iframe embedding
          // This is more reliable than trying to use the extension commands
          const embedUrl = `https://www.youtube.com/embed/${videoInfo.id}?rel=0&modestbranding=1`;
          
          try {
            // Insert HTML directly - most reliable method
            editor
              .chain()
              .focus()
              .insertContent(`
                <div class="video-block youtube-block">
                  <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.5em 0;">
                    <iframe 
                      src="${embedUrl}" 
                      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                      frameborder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowfullscreen>
                    </iframe>
                  </div>
                  <p class="video-caption">YouTube video: <a href="${videoUrl}" target="_blank" rel="noopener noreferrer">${videoInfo.id}</a></p>
                </div>
                <p></p>
              `)
              .run();
              
            console.log('Inserted YouTube video using direct HTML method');
          } catch (htmlError) {
            console.error('Error inserting YouTube HTML:', htmlError);
            
            // Fallback to even simpler method - just a link
            try {
              editor
                .chain()
                .focus()
                .insertContent(`<p><a href="${videoUrl}" target="_blank" rel="noopener noreferrer">Watch on YouTube: ${videoInfo.id}</a></p>`)
                .run();
                
              console.log('Inserted YouTube link as fallback');
            } catch (linkError) {
              console.error('Error inserting YouTube link:', linkError);
              throw new Error('Failed to insert YouTube video or link');
            }
          }
          
          console.log('YouTube block inserted successfully');
          toast({
            title: "YouTube video added",
            description: "Video has been added to your content",
          });
          
          setVideoDialogOpen(false);
          setVideoUrl('');
          setVideoError('');
        } catch (error) {
          console.error('Error adding YouTube block:', error);
          
          // Fallback to a simple link if block insertion fails
          try {
            const videoLink = `https://www.youtube.com/watch?v=${videoInfo.id}`;
            
            editor.chain()
              .focus()
              .setLink({ href: videoLink, target: '_blank' })
              .insertContent(`Watch on YouTube: ${videoInfo.id}`)
              .run();
            
            console.log('Fallback YouTube link added');
            toast({
              title: "YouTube link added",
              description: "Link to YouTube video added (fallback method)",
            });
            
            setVideoDialogOpen(false);
            setVideoUrl('');
            setVideoError('');
          } catch (linkError) {
            console.error('Even fallback link insertion failed:', linkError);
            setVideoError('Could not add YouTube reference. Please try again later.');
          }
        }
      } 
      else if (videoInfo.platform === 'vimeo') {
        // Use our dedicated VimeoBlock extension
        try {
          console.log('Adding Vimeo block with video ID:', videoInfo.id);
          
          // Use the standard command from the extension
          console.log('Attempting to insert Vimeo block with:', {
            src: videoUrl,
            videoId: videoInfo.id
          });
          
          // Skip the command approach and directly use HTML iframe embedding
          // This is more reliable than trying to use the extension commands
          const embedUrl = `https://player.vimeo.com/video/${videoInfo.id}?dnt=1`;
          
          try {
            // Insert HTML directly - most reliable method
            editor
              .chain()
              .focus()
              .insertContent(`
                <div class="video-block vimeo-block">
                  <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.5em 0;">
                    <iframe 
                      src="${embedUrl}" 
                      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                      frameborder="0" 
                      allow="autoplay; fullscreen; picture-in-picture" 
                      allowfullscreen>
                    </iframe>
                  </div>
                  <p class="video-caption">Vimeo video: <a href="${videoUrl}" target="_blank" rel="noopener noreferrer">${videoInfo.id}</a></p>
                </div>
                <p></p>
              `)
              .run();
              
            console.log('Inserted Vimeo video using direct HTML method');
          } catch (htmlError) {
            console.error('Error inserting Vimeo HTML:', htmlError);
            
            // Fallback to even simpler method - just a link
            try {
              editor
                .chain()
                .focus()
                .insertContent(`<p><a href="${videoUrl}" target="_blank" rel="noopener noreferrer">Watch on Vimeo: ${videoInfo.id}</a></p>`)
                .run();
                
              console.log('Inserted Vimeo link as fallback');
            } catch (linkError) {
              console.error('Error inserting Vimeo link:', linkError);
              throw new Error('Failed to insert Vimeo video or link');
            }
          }
          
          console.log('Vimeo block inserted successfully');
          toast({
            title: "Vimeo video added",
            description: "Video has been added to your content",
          });
          
          setVideoDialogOpen(false);
          setVideoUrl('');
          setVideoError('');
        } catch (error) {
          console.error('Error adding Vimeo block:', error);
          
          // Fallback to a simple link if block insertion fails
          try {
            const videoLink = `https://vimeo.com/${videoInfo.id}`;
            
            editor.chain()
              .focus()
              .setLink({ href: videoLink, target: '_blank' })
              .insertContent(`Watch on Vimeo: ${videoInfo.id}`)
              .run();
            
            console.log('Fallback Vimeo link added');
            toast({
              title: "Vimeo link added",
              description: "Link to Vimeo video added (fallback method)",
            });
            
            setVideoDialogOpen(false);
            setVideoUrl('');
            setVideoError('');
          } catch (linkError) {
            console.error('Even fallback link insertion failed:', linkError);
            setVideoError('Could not add Vimeo reference. Please try again later.');
          }
        }
      } else {
        setVideoError('Unsupported video platform. Please use YouTube or Vimeo.');
      }
    } catch (error) {
      console.error('Error processing video URL:', error);
      setVideoError('An error occurred while processing the video URL. Please try a different format.');
    }
  }

  // Enhance image dialog handling with drag & drop and paste functionality
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Setup paste event listener for the editor
  useEffect(() => {
    if (!editor) return
    
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            event.preventDefault()
            handleImageUpload(file)
            return
          }
        }
      }
    }
    
    // Add the paste event listener to the editor element
    const editorElement = document.querySelector('.ProseMirror')
    if (editorElement) {
      editorElement.addEventListener('paste', handlePaste)
      
      // Add drag and drop events to the editor element
      editorElement.addEventListener('dragover', (e) => {
        e.preventDefault()
        setIsDraggingFile(true)
      })
      
      editorElement.addEventListener('dragleave', () => {
        setIsDraggingFile(false)
      })
      
      editorElement.addEventListener('drop', (e) => {
        e.preventDefault()
        setIsDraggingFile(false)
        
        const files = e.dataTransfer?.files
        if (files && files.length > 0 && files[0].type.startsWith('image/')) {
          handleImageUpload(files[0])
        }
      })
    }
    
    return () => {
      if (editorElement) {
        editorElement.removeEventListener('paste', handlePaste)
        editorElement.removeEventListener('dragover', () => {})
        editorElement.removeEventListener('dragleave', () => {})
        editorElement.removeEventListener('drop', () => {})
      }
    }
  }, [editor])
  
  // Add image dialog handling
  const addImage = () => {
    setImageUrl('');
    setImageError('');
    setSelectedImageFile(null);
    setIsUploadingImage(false);
    setImageDialogOpen(true);
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetImageFile(file)
    }
  };
  
  // Centralized validation function for image files
  const validateAndSetImageFile = (file: File): boolean => {
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('File size must be less than 5MB');
      return false;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('File must be an image');
      return false;
    }
    
    setSelectedImageFile(file);
    setImageError('');
    return true;
  }
  
  // Centralized image upload handler for all upload sources
  const handleImageUpload = async (file: File) => {
    if (!editor) {
      toast({
        title: "Error",
        description: "Editor not initialized",
        variant: "destructive"
      });
      return;
    }
    
    if (!validateAndSetImageFile(file)) {
      return;
    }
    
    try {
      setIsUploadingImage(true);
      
      // Show a temporary loading placeholder
      const loadingPlaceholderId = `loading-${Date.now()}`
      editor
        .chain()
        .focus()
        .insertContent(`<div id="${loadingPlaceholderId}" class="image-upload-placeholder">Uploading image...</div>`)
        .run();
      
      // Upload the file to Supabase storage
      const uploadResult = await uploadEditorImage(file);
      
      if (uploadResult.error) {
        throw uploadResult.error;
      }
      
      if (!uploadResult.url) {
        throw new Error('Upload succeeded but no URL was returned');
      }
      
      // Find and replace the placeholder with the actual image
      const dom = editor.view.dom
      const placeholder = dom.querySelector(`#${loadingPlaceholderId}`)
      if (placeholder) {
        // Remove the placeholder
        const tr = editor.state.tr.deleteSelection()
        editor.view.dispatch(tr)
      }
      
      // Insert the actual image
      editor
        .chain()
        .focus()
        .setImage({ src: uploadResult.url, alt: file.name.split('.')[0] })
        .run();
      
      toast({
        title: "Image uploaded",
        description: "Image has been added to your content",
      });
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
      
      // Clean up any placeholder
      const dom = editor.view.dom
      const placeholder = dom.querySelector('.image-upload-placeholder')
      if (placeholder) {
        const tr = editor.state.tr.deleteSelection()
        editor.view.dispatch(tr)
      }
    } finally {
      setIsUploadingImage(false);
    }
  }

  const handleImageSubmit = async () => {
    if (!editor) {
      setImageError('Editor not initialized');
      return;
    }

    // Handle URL input
    if (imageUrl) {
      try {
        console.log('Adding image with URL:', imageUrl);
        
        // Validate URL
        const url = new URL(imageUrl);
        if (!url.protocol.startsWith('http')) {
          throw new Error('Invalid URL. Must start with http:// or https://');
        }
        
        // Add loading state
        toast({
          title: "Adding image...",
          description: "Please wait while we add the image",
        });
        
        // Check if image loads correctly
        const imgPromise = new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => reject(new Error('Failed to load image from URL'));
          img.src = imageUrl;
        });
        
        await imgPromise;
        
        // Insert the image
        editor
          .chain()
          .focus()
          .setImage({ src: imageUrl })
          .run();
        
        toast({
          title: "Image inserted",
          description: "Image added to your content",
        });
        
        setImageDialogOpen(false);
        setImageUrl('');
        setSelectedImageFile(null);
        setImageError('');
        return;
      } catch (error) {
        console.error('Error inserting image from URL:', error);
        setImageError(error instanceof Error ? error.message : 'An error occurred while adding the image from URL');
        return;
      }
    }
    
    // Handle file upload
    if (selectedImageFile) {
      try {
        setIsUploadingImage(true);
        setImageError('');
        
        // Upload the file to Supabase storage
        const uploadResult = await uploadEditorImage(selectedImageFile);
        
        if (uploadResult.error) {
          throw uploadResult.error;
        }
        
        if (!uploadResult.url) {
          throw new Error('Upload succeeded but no URL was returned');
        }
        
        // Insert the image
        editor
          .chain()
          .focus()
          .setImage({ 
            src: uploadResult.url,
            alt: selectedImageFile.name.split('.')[0] // Use filename as alt text
          })
          .run();
        
        toast({
          title: "Image uploaded and inserted",
          description: "Image has been added to your content",
        });
        
        setImageDialogOpen(false);
        setImageUrl('');
        setSelectedImageFile(null);
        setImageError('');
      } catch (error) {
        console.error('Error uploading image:', error);
        setImageError('Failed to upload image. Please try again or use a URL instead.');
      } finally {
        setIsUploadingImage(false);
      }
      return;
    }
    
    // No URL or file provided
    setImageError('Please enter an image URL or upload a file');
  }

  const setLink = () => {
    console.log('Set link button clicked');
    const url = prompt('Enter URL')
    if (url) {
      console.log('Setting link', { url });
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }

  // Create a wrapper for toolbar button clicks
  const handleToolbarButtonClick = (action: string, callback: () => void) => {
    return (e: React.MouseEvent) => {
      // Prevent event propagation to stop it from bubbling up to form elements
      e.preventDefault();
      e.stopPropagation();
      
      console.log(`Toolbar button clicked: ${action}`);
      try {
        // Execute the formatting action
        callback();
        
        // Ensure editor keeps focus after the action
        setTimeout(() => {
          if (editor && !editor.isFocused) {
            console.log(`Restoring focus to editor after ${action}`);
            editor.commands.focus('end');
            
            // Additional focus restoration attempt using DOM
            const editorElement = document.querySelector('.ProseMirror');
            if (editorElement) {
              console.log('Using DOM to focus editor element');
              (editorElement as HTMLElement).focus();
            }
          }
        }, 50);
        
        console.log(`Toolbar action completed: ${action}`);
      } catch (error) {
        console.error(`Error in toolbar action ${action}:`, error);
      }
    };
  };

  const processContent = (content: string | null): string => {
    if (!content || content === 'contentBody') return '';
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      console.log('Content parsed as JSON:', parsed);
      return content;
    } catch (e) {
      // If not valid JSON, check if it's HTML
      if (typeof content === 'string' && (content.includes('<iframe') || content.includes('<p>'))) {
        console.log('Content appears to be HTML:', content);
        return content;
      }
      
      // Otherwise, treat as plain text
      console.log('Content treated as plain text:', content);
      return content;
    }
  };

  if (!editor) {
    return null
  }

  return (
    <div className="relative" key={editorKey}>
      {/* Video Embed Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed Video</DialogTitle>
            <DialogDescription>
              Add a YouTube or Vimeo video to your content
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="video-url" className="text-sm font-medium">
                Video URL <span className="text-red-500">*</span>
              </label>
              <Input
                id="video-url"
                type="url"
                placeholder="https://youtube.com/watch?v=xxxx or https://vimeo.com/xxxx"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value)
                  // Clear error when user types
                  if (videoError) setVideoError('')
                }}
                onKeyDown={(e) => {
                  // Submit on Enter key
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleVideoSubmit()
                  }
                }}
                className="w-full"
                autoFocus
              />
            </div>
            
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-1">Supported formats:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>YouTube: youtube.com/watch?v=ID or youtu.be/ID</li>
                <li>YouTube Shorts: youtube.com/shorts/ID</li>
                <li>Vimeo: vimeo.com/ID</li>
                <li>Embedded links (player.vimeo.com/video/ID or youtube.com/embed/ID)</li>
              </ul>
              <p className="mt-2 text-xs">
                <strong>Tip:</strong> You can add multiple videos by repeating this process at different positions in your content.
              </p>
            </div>
            
            {videoError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {videoError}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVideoDialogOpen(false)
                setVideoUrl('')
                setVideoError('')
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVideoSubmit}
              disabled={!videoUrl.trim()}
            >
              Embed Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Image Insert Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>
              Upload an image or enter an image URL
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <div className="font-medium">Upload an image:</div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-foreground hover:file:bg-primary/20"
              />
              {selectedImageFile && (
                <p className="text-sm text-green-600">
                  Selected file: {selectedImageFile.name} ({(selectedImageFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-600 text-sm">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <div className="space-y-3">
              <div className="font-medium">Enter an image URL:</div>
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value)
                  setImageError('')
                }}
              />
              <div className="text-sm text-gray-500">
                <p>Paste an image URL from popular image hosting sites like Unsplash or Imgur</p>
              </div>
            </div>
            
            {imageError && (
              <p className="text-sm text-red-500">{imageError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImageDialogOpen(false)
                setImageUrl('')
                setSelectedImageFile(null)
                setImageError('')
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImageSubmit}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <>
                  <span className="mr-2">Uploading...</span>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </>
              ) : (
                'Insert Image'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!readOnly && (
        <>
          <div className="sticky top-0 z-50 flex items-center gap-2 border-b bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/60 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('heading-1', () => 
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              )}
              data-active={editor.isActive('heading', { level: 1 })}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('heading-2', () => 
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              )}
              data-active={editor.isActive('heading', { level: 2 })}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('heading-3', () => 
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              )}
              data-active={editor.isActive('heading', { level: 3 })}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('bold', () => 
                editor.chain().focus().toggleBold().run()
              )}
              data-active={editor.isActive('bold')}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('italic', () => 
                editor.chain().focus().toggleItalic().run()
              )}
              data-active={editor.isActive('italic')}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('link', setLink)}
              data-active={editor.isActive('link')}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('blockquote', () => 
                editor.chain().focus().toggleBlockquote().run()
              )}
              data-active={editor.isActive('blockquote')}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('bullet-list', () => 
                editor.chain().focus().toggleBulletList().run()
              )}
              data-active={editor.isActive('bulletList')}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('video', addVideo)}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Video className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('image', addImage)}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('align-left', () => 
                editor.chain().focus().setTextAlign('left').run()
              )}
              data-active={editor.isActive({ textAlign: 'left' })}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('align-center', () => 
                editor.chain().focus().setTextAlign('center').run()
              )}
              data-active={editor.isActive({ textAlign: 'center' })}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('align-right', () => 
                editor.chain().focus().setTextAlign('right').run()
              )}
              data-active={editor.isActive({ textAlign: 'right' })}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            {setFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFullscreen(!fullscreen)}
                className="px-2 text-gray-800 hover:bg-gray-100 ml-auto"
              >
                <MinimizeIcon className="h-4 w-4" />
              </Button>
            )}
          </div>

          <style jsx global>{`
            [data-active="true"] {
              background-color: rgb(243 244 246);
              color: rgb(17 24 39);
            }
            
            /* Ensure editor text is always visible */
            .ProseMirror {
              color: rgb(17 24 39) !important;
              position: relative; /* Important for positioning children */
              min-height: 400px; /* Ensure editor is always tall enough to be usable */
            }
            
            /* Add styles for the drag and drop overlay */
            .ProseMirror-dragover {
              position: relative;
            }
            
            .ProseMirror-dragover::after {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: rgba(59, 130, 246, 0.1);
              border: 2px dashed rgb(59, 130, 246);
              border-radius: 0.5rem;
              z-index: 100;
              pointer-events: none;
            }
            
            /* Editor placeholder for uploads */
            .image-upload-placeholder {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100px;
              margin: 1.5rem 0;
              padding: 2rem 1rem;
              border: 2px dashed #d1d5db;
              border-radius: 0.5rem;
              background-color: #f9fafb;
              color: #6b7280;
              font-size: 0.875rem;
              text-align: center;
              animation: pulse 1.5s ease-in-out infinite;
            }
            
            @keyframes pulse {
              0% { opacity: 0.6; }
              50% { opacity: 1; }
              100% { opacity: 0.6; }
            }
            
            .ProseMirror p {
              color: rgb(17 24 39) !important;
              margin: 1em 0; /* Ensure paragraphs have proper spacing */
              min-height: 1.5em; /* Ensure empty paragraphs are clickable */
            }
            
            .ProseMirror h1, 
            .ProseMirror h2, 
            .ProseMirror h3 {
              color: rgb(17 24 39) !important;
              margin: 1.5em 0 0.5em; /* Proper heading spacing */
            }
            
            .ProseMirror blockquote {
              color: rgb(75 85 99) !important;
              margin: 1.5em 0;
              padding-left: 1em;
              border-left: 2px solid #e5e7eb;
            }
            
            .ProseMirror ul li, 
            .ProseMirror ol li {
              color: rgb(17 24 39) !important;
              margin: 0.5em 0;
            }
            
            /* Media element styling */
            
            /* Image styling - very important for proper display */
            .editor-image, .ProseMirror img {
              display: block;
              max-width: 100%;
              height: auto;
              border-radius: 0.375rem;
              margin: 1.5rem 0;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              /* Add a slight border to images for better visibility */
              border: 1px solid #e5e7eb;
              transition: all 0.2s ease-in-out;
            }
            
            /* Hover effect for images */
            .ProseMirror img:hover {
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              transform: translateY(-2px);
            }
            
            /* Selected image styling */
            .ProseMirror img.ProseMirror-selectednode {
              outline: 2px solid #2563eb;
              outline-offset: 2px;
            }
            
            /* Fix for rendered content on actual pages */
            .prose p, 
            .prose h1, 
            .prose h2, 
            .prose h3, 
            .prose h4, 
            .prose h5, 
            .prose h6, 
            .prose ul li, 
            .prose ol li,
            .prose blockquote {
              color: rgb(17 24 39) !important;
            }
            
            /* Ensure links are visible but still styled as links */
            .prose a, .ProseMirror a {
              color: rgb(37 99 235) !important;
              text-decoration: underline;
            }
            
            /* Fix for any content containers */
            .content-container p,
            .content-container h1,
            .content-container h2,
            .content-container h3,
            .content-container h4,
            .content-container h5,
            .content-container h6,
            .content-container ul li,
            .content-container ol li {
              color: rgb(17 24 39) !important;
            }
            
            /* Add focus styling to editor */
            .ProseMirror:focus {
              outline: none;
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
              border-radius: 0.375rem;
            }
            
            /* Ensure iframe nodes are properly displayed */
            .iframe-read-only, .iframe-editable {
              display: block;
              width: 100%;
              aspect-ratio: 16 / 9;
              border: none;
              border-radius: 0.5rem;
              margin: 1.5rem 0;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .iframe-editable {
              border: 1px solid #e5e7eb;
            }
            
            /* Fix for image styling in the content display */
            .prose img, 
            .content-container img {
              display: block;
              max-width: 100%;
              height: auto;
              border-radius: 0.375rem;
              margin: 1.5rem 0;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            /* YouTube Block Styling */
            .youtube-block {
              display: block;
              width: 100%;
              margin: 2rem 0;
              border-radius: 8px;
              overflow: hidden;
              max-width: 100%;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            /* Generic video container styling */
            .video-container, .youtube-container, .vimeo-container {
              position: relative;
              padding-bottom: 56.25%; /* 16:9 aspect ratio */
              height: 0;
              overflow: hidden;
              background-color: #000;
              margin: 1.5rem 0;
              border-radius: 8px;
            }
            
            .youtube-thumbnail {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.3s ease;
            }
            
            .youtube-link:hover .youtube-thumbnail {
              transform: scale(1.05);
            }
            
            .youtube-play-button {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 68px;
              height: 48px;
              background-color: rgba(0, 0, 0, 0.7);
              border-radius: 14px;
              pointer-events: none;
            }
            
            .youtube-play-button::after {
              content: '';
              position: absolute;
              top: 50%;
              left: 55%;
              transform: translate(-50%, -50%);
              border-style: solid;
              border-width: 12px 0 12px 20px;
              border-color: transparent transparent transparent white;
            }
            
            .youtube-caption {
              padding: 0.5rem;
              text-align: center;
              background-color: #f5f5f5;
            }
            
            .youtube-caption a {
              color: #0066cc;
              text-decoration: none;
              font-weight: 500;
            }
            
            .youtube-caption a:hover {
              text-decoration: underline;
            }
            
            /* Ensure the YouTube block shows up in the content display */
            .prose [data-youtube-block],
            .content-container [data-youtube-block],
            .ProseMirror [data-youtube-block] {
              display: block;
              width: 100%;
              margin: 2rem 0;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              max-width: 100%;
            }
            
            /* Vimeo Block Styling */
            .vimeo-block {
              display: block;
              width: 100%;
              margin: 2rem 0;
              border-radius: 8px;
              overflow: hidden;
              max-width: 100%;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .vimeo-container {
              position: relative;
              padding-bottom: 56.25%; /* 16:9 aspect ratio */
              height: 0;
              overflow: hidden;
              background-color: #1ab7ea; /* Vimeo blue */
              background: linear-gradient(45deg, #1ab7ea, #0082bc);
            }
            
            .vimeo-placeholder {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .vimeo-logo {
              width: 100px;
              height: 30px;
              background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" fill="white"><path d="M95.4,8.8c-0.4-3-2.2-5.4-5.4-5.4c-1.7,0-3.1,0.5-4.3,1.6c-1.6,1.5-2.3,3.4-2.3,5.7c0,2.1,0.7,3.8,2.1,5.2 c1.4,1.4,3.1,2.1,5.1,2.1c2.2,0,4-0.7,5.3-2.2C96.1,14.4,95.9,11.9,95.4,8.8z M90.1,14.6c-0.8,0.9-1.7,1.4-2.8,1.4 c-1.2,0-2.1-0.5-2.9-1.4C83.6,13.7,83,13,83,11c0-1.4,0.3-2.5,0.9-3.4c0.7-1,1.7-1.4,2.9-1.4c1.1,0,2,0.5,2.8,1.4 c0.7,0.9,1.1,2.1,1.1,3.4C90.7,12.4,90.5,13.6,90.1,14.6z M79.1,3.4c-0.7,0-1.1,0.2-1.4,0.5c-0.3,0.3-0.5,0.8-0.5,1.4v7.5 c-0.6,0.7-1.2,1.3-1.8,1.8c-0.9,0.7-1.5,1-2,1c-0.5,0-0.9-0.2-1.1-0.6c-0.2-0.4-0.4-1-0.4-1.8V5.2c0-0.5-0.2-1-0.5-1.3 c-0.3-0.3-0.8-0.5-1.3-0.5c-1.2,0-1.8,0.6-1.8,1.9v8.5c0,1.3,0.3,2.3,0.8,3c0.5,0.7,1.4,1.1,2.4,1.1c1.4,0,2.8-0.6,4.3-1.8 c0.1,0.5,0.4,1,0.7,1.3c0.4,0.3,0.8,0.5,1.4,0.5c0.5,0,1-0.2,1.3-0.5c0.3-0.3,0.5-0.8,0.5-1.3V5.2c0-0.5-0.2-1-0.6-1.3 C80,3.6,79.6,3.4,79.1,3.4z M65.6,12.1c-0.7,0.7-1.3,1.3-1.9,1.7c-0.8,0.6-1.4,0.9-1.9,0.9c-0.8,0-1.2-0.6-1.2-1.9V5.7h2.6 c0.5,0,0.9-0.1,1.2-0.4c0.3-0.2,0.4-0.6,0.4-1.1c0-0.5-0.1-0.8-0.4-1.1c-0.3-0.2-0.7-0.4-1.2-0.4h-2.6V1.3c0-0.6-0.2-1-0.5-1.3 C59.8,0,59.3,0,58.9,0c-1.2,0-1.9,0.5-1.9,1.5v18.8c0,1.2,0.3,2.1,0.8,2.7c0.6,0.7,1.4,1,2.4,1c1.4,0,3-0.8,4.7-2.5 c0.9-0.9,1.7-1.8,2.4-2.7V13C66.8,10.7,66.4,11.2,65.6,12.1z M46.8,3.4c-1.5,0-2.9,0.5-4.1,1.6c-1.6,1.4-2.4,3.2-2.4,5.5 c0,2.3,0.7,4.1,2.2,5.5c1.5,1.4,3.2,2.1,5.2,2.1c0.9,0,1.7-0.1,2.5-0.3c0.8-0.2,1.5-0.4,2.1-0.8c0.5-0.3,0.7-0.7,0.7-1.1 c0-0.4-0.1-0.7-0.4-1c-0.3-0.3-0.6-0.4-1-0.4c-0.2,0-0.4,0-0.6,0.1c-0.2,0.1-0.5,0.2-0.9,0.3c-0.8,0.3-1.5,0.4-2.2,0.4 c-1.1,0-2-0.4-2.8-1.1c-0.7-0.7-1.1-1.7-1.1-2.9h8.3c0.6,0,1.1-0.1,1.4-0.4c0.3-0.3,0.5-0.7,0.5-1.2c0-1.7-0.6-3.2-1.7-4.5 C49.5,4,48.2,3.4,46.8,3.4z M44.2,8.7c0.1-0.7,0.4-1.3,0.9-1.8c0.5-0.5,1.2-0.7,1.9-0.7c0.7,0,1.3,0.2,1.7,0.7 c0.4,0.5,0.7,1.1,0.7,1.8H44.2z M37.1,3.4c-1.2,0-1.9,0.6-1.9,1.9v10c0,0.6,0.2,1,0.5,1.3c0.3,0.3,0.8,0.5,1.3,0.5 c0.6,0,1-0.2,1.4-0.5c0.3-0.3,0.5-0.8,0.5-1.3v-10c0-0.5-0.2-1-0.5-1.3C38,3.6,37.6,3.4,37.1,3.4z M37.1,1.8 c0.7,0,1.2-0.2,1.7-0.5C39.3,0.9,39.5,0.5,39.5,0c0-0.5-0.2-0.9-0.6-1.2C38.4-0.5,37.9-0.6,37.2-0.6c-0.7,0-1.2,0.2-1.7,0.5 c-0.5,0.3-0.7,0.7-0.7,1.2c0,0.5,0.2,0.9,0.6,1.2C35.9,1.6,36.4,1.8,37.1,1.8z M26.9,16.4c-0.9,0-1.7-0.3-2.3-1 c-0.6-0.7-0.9-1.5-0.9-2.6V4.9h1.8c0.6,0,1-0.1,1.3-0.4c0.3-0.3,0.4-0.7,0.4-1.1c0-0.5-0.1-0.8-0.4-1.1c-0.3-0.3-0.7-0.4-1.3-0.4 h-1.8V0.8c0-0.5-0.2-1-0.5-1.3C22.9-0.8,22.5-1,22-1c-0.5,0-0.9,0.2-1.3,0.5c-0.3,0.3-0.5,0.7-0.5,1.3v1.1h-0.6 c-0.5,0-1,0.1-1.3,0.4c-0.3,0.3-0.4,0.6-0.4,1.1c0,0.4,0.1,0.8,0.4,1.1c0.3,0.3,0.7,0.4,1.3,0.4h0.6v8c0,1.8,0.5,3.2,1.6,4.3 c1.1,1.1,2.5,1.6,4.2,1.6c0.5,0,1-0.1,1.6-0.2c0.5-0.1,0.9-0.3,1.1-0.5c0.2-0.2,0.3-0.5,0.3-0.9c0-0.4-0.1-0.7-0.4-1 c-0.3-0.3-0.6-0.4-1-0.4C27.4,16.4,27.1,16.4,26.9,16.4z M17.2,3.4c-0.6,0-1.1,0.2-1.4,0.5c-0.3,0.3-0.5,0.8-0.5,1.3v10 c0,0.6,0.2,1,0.5,1.3c0.3,0.3,0.8,0.5,1.4,0.5c0.5,0,1-0.2,1.3-0.5c0.3-0.3,0.5-0.8,0.5-1.3v-10c0-0.5-0.2-1-0.5-1.3 C18.2,3.6,17.8,3.4,17.2,3.4z M17.2,1.8c0.7,0,1.2-0.2,1.7-0.5C19.3,0.9,19.6,0.5,19.6,0c0-0.5-0.2-0.9-0.6-1.2 c-0.4-0.3-0.9-0.5-1.7-0.5c-0.7,0-1.2,0.2-1.7,0.5c-0.5,0.3-0.7,0.7-0.7,1.2c0,0.5,0.2,0.9,0.6,1.2C16,1.6,16.5,1.8,17.2,1.8z M6.9,15.8c-0.7,0-1.2-0.3-1.8-0.8C4.6,14.6,4.3,14,4.3,13.4c0-0.6,0.3-1.2,0.8-1.7c0.5-0.5,1.1-0.7,1.8-0.7 c0.6,0,1.1,0.3,1.6,0.8c0.5,0.5,0.7,1.1,0.7,1.7c0,0.6-0.2,1.2-0.7,1.6C8,15.5,7.5,15.8,6.9,15.8z M2.2,15.8c-0.7,0-1.2-0.3-1.7-0.8 C0.1,14.6,0,14,0,13.4c0-0.6,0.2-1.2,0.7-1.7c0.5-0.5,1.1-0.7,1.7-0.7c0.6,0,1.1,0.3,1.6,0.8c0.5,0.5,0.7,1.1,0.7,1.7 c0,0.6-0.2,1.2-0.7,1.7C3.5,15.5,3,15.8,2.2,15.8z"/></svg>');
              background-repeat: no-repeat;
              background-position: center;
              filter: brightness(1.2);
            }
            
            .vimeo-play-button {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 68px;
              height: 48px;
              background-color: rgba(0, 0, 0, 0.5);
              border-radius: 14px;
              pointer-events: none;
            }
            
            .vimeo-play-button::after {
              content: '';
              position: absolute;
              top: 50%;
              left: 55%;
              transform: translate(-50%, -50%);
              border-style: solid;
              border-width: 12px 0 12px 20px;
              border-color: transparent transparent transparent white;
            }
            
            .vimeo-caption {
              padding: 0.5rem;
              text-align: center;
              background-color: #f5f5f5;
            }
            
            .vimeo-caption a {
              color: #1ab7ea;
              text-decoration: none;
              font-weight: 500;
            }
            
            .vimeo-caption a:hover {
              text-decoration: underline;
            }
            
            /* Ensure the Vimeo block shows up in the content display */
            .prose [data-vimeo-block],
            .content-container [data-vimeo-block],
            .ProseMirror [data-vimeo-block] {
              display: block;
              width: 100%;
              margin: 2rem 0;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              max-width: 100%;
            }
            
            /* Special node selectors to ensure proper display */
            div[data-youtube-block], div[data-vimeo-block], .video-block, .youtube-block, .vimeo-block, .ProseMirror .editor-image {
              position: relative;
              clear: both;
              display: block;
              width: 100%;
              margin: 2rem 0;
              max-width: 100%;
            }
            
            /* Video caption styling */
            .video-caption {
              padding: 0.5rem;
              text-align: center;
              font-size: 0.875rem;
              color: #6b7280;
              margin-top: 0.5rem;
            }
            
            /* Add helper text for file drop */
            .ProseMirror-dragover::before {
              content: "Drop image here to upload";
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background-color: rgba(59, 130, 246, 0.9);
              color: white;
              padding: 0.5rem 1rem;
              border-radius: 0.25rem;
              font-weight: 500;
              z-index: 101;
              pointer-events: none;
            }
          `}</style>
        </>
      )}

      <div className={cn(
        "relative min-h-[200px] w-full max-w-screen-lg mx-auto",
        "prose dark:prose-invert prose-headings:font-heading prose-headings:leading-tight",
        "focus:outline-none text-gray-900",
        readOnly ? "prose-lg" : "prose-md",
        "px-4 py-4"
      )}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
} 