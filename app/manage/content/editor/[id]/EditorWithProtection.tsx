'use client'

import { ContentForm } from '@/components/content/content-form'
import { useSupabase } from '@/components/supabase-provider'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

// Client component with its own update handler
export function EditorWithProtection({ 
  contentId, 
  ageGroups, 
  categories, 
  accessTiers, 
  initialData 
}: { 
  contentId: string
  ageGroups: any[]
  categories: any[]
  accessTiers: any[]
  initialData: any
}) {
  const { supabase } = useSupabase()
  const router = useRouter()
  
  // Define content update function locally
  const handleSubmit = useCallback(async (data: any) => {
    if (!supabase) {
      console.error('Supabase client not initialized');
      toast({
        title: "Error",
        description: "Database connection not available",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log('Updating content with ID:', contentId, 'and data:', {
        ...data,
        contentBodyLength: data.contentBody?.length || 0,
      });
      
      // First, create a timestamp to ensure unique slug
      const timestamp = new Date().getTime();
      const slug = data.title 
        ? `${data.title.toLowerCase().replace(/[^\w-]+/g, '-')}-${timestamp.toString().slice(-6)}`
        : `content-${timestamp.toString().slice(-6)}`;
      
      // Update the content record
      const { error } = await supabase
        .from('content_items')
        .update({
          title: data.title,
          description: data.description,
          type: data.type,
          content_body: data.contentBody,
          published: data.published,
          access_tier_id: data.accessTierId,
          updated_at: new Date().toISOString(),
          slug: slug
        })
        .eq('id', contentId);
      
      if (error) {
        console.error('Error updating content:', error);
        toast({
          title: "Error updating content",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Update age groups and categories
      if (data.ageGroups && data.ageGroups.length > 0) {
        // First delete existing relations
        await supabase.from('content_age_groups').delete().eq('content_id', contentId);
        
        // Then insert new relations
        const ageGroupInserts = data.ageGroups.map((agId: string) => ({
          content_id: contentId,
          age_group_id: agId
        }));
        
        const { error: ageGroupError } = await supabase
          .from('content_age_groups')
          .insert(ageGroupInserts);
        
        if (ageGroupError) {
          console.error('Error updating age groups:', ageGroupError);
        }
      }
      
      if (data.categories && data.categories.length > 0) {
        // First delete existing relations
        await supabase.from('content_categories').delete().eq('content_id', contentId);
        
        // Then insert new relations
        const categoryInserts = data.categories.map((catId: string) => ({
          content_id: contentId,
          category_id: catId
        }));
        
        const { error: categoryError } = await supabase
          .from('content_categories')
          .insert(categoryInserts);
        
        if (categoryError) {
          console.error('Error updating categories:', categoryError);
        }
      }
      
      // Handle thumbnail if it's a file
      if (data.thumbnail instanceof File) {
        const filename = `${contentId}/thumbnail.${data.thumbnail.name.split('.').pop()}`;
        
        // Upload the file
        const { error: uploadError } = await supabase.storage
          .from('content')
          .upload(filename, data.thumbnail, {
            upsert: true,
            contentType: data.thumbnail.type
          });
        
        if (uploadError) {
          console.error('Error uploading thumbnail:', uploadError);
        } else {
          // Get the public URL
          const { data: urlData } = supabase.storage
            .from('content')
            .getPublicUrl(filename);
          
          // Update the thumbnail URL in the content record
          const { error: thumbUpdateError } = await supabase
            .from('content_items')
            .update({ thumbnail_url: urlData.publicUrl })
            .eq('id', contentId);
          
          if (thumbUpdateError) {
            console.error('Error updating thumbnail URL:', thumbUpdateError);
          }
        }
      }
      
      toast({
        title: "Content updated",
        description: "Your content has been updated successfully"
      });
      
      // Redirect to content list
      router.push('/manage/content?tab=list');
      
    } catch (error) {
      console.error('Error submitting content:', error);
      toast({
        title: "Error",
        description: "Failed to update content. Please try again.",
        variant: "destructive"
      });
    }
  }, [contentId, supabase, router]);
  
  return (
    <ContentForm 
      ageGroups={ageGroups}
      categories={categories}
      accessTiers={accessTiers}
      onSubmit={handleSubmit}
      initialData={initialData}
    />
  );
}