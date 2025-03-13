/**
 * Utility functions for debugging
 */

/**
 * Analyzes a File object and returns detailed information about it
 */
export function analyzeFile(file: File): Record<string, any> {
  try {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString(),
      isFile: file instanceof File,
      hasArrayBuffer: typeof file.arrayBuffer === 'function',
      hasStream: typeof file.stream === 'function',
      hasText: typeof file.text === 'function',
      hasSlice: typeof file.slice === 'function',
      constructor: file.constructor?.name || 'unknown',
      prototype: Object.getPrototypeOf(file)?.constructor?.name || 'unknown',
      properties: Object.getOwnPropertyNames(file),
      descriptors: Object.getOwnPropertyDescriptors(file)
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      isFile: file instanceof File
    }
  }
}

/**
 * Creates a deep copy of a File object using various methods
 * and returns information about the copy process
 */
export async function createFileCopy(file: File, newName?: string): Promise<{
  success: boolean;
  method: string;
  file?: File;
  error?: string;
  details?: Record<string, any>;
}> {
  try {
    // Method 1: Using arrayBuffer
    try {
      const buffer = await file.arrayBuffer();
      const fileCopy = new File(
        [buffer], 
        newName || file.name, 
        { 
          type: file.type,
          lastModified: file.lastModified 
        }
      );
      
      return {
        success: true,
        method: 'arrayBuffer',
        file: fileCopy,
        details: {
          originalSize: file.size,
          copySize: fileCopy.size,
          sizeDifference: fileCopy.size - file.size,
          originalType: file.type,
          copyType: fileCopy.type
        }
      };
    } catch (arrayBufferError) {
      console.error('ArrayBuffer method failed:', arrayBufferError);
      // Continue to next method
    }
    
    // Method 2: Using Blob constructor
    try {
      const blob = new Blob([file], { type: file.type });
      const fileCopy = new File(
        [blob], 
        newName || file.name, 
        { 
          type: file.type,
          lastModified: file.lastModified 
        }
      );
      
      return {
        success: true,
        method: 'blob',
        file: fileCopy,
        details: {
          originalSize: file.size,
          copySize: fileCopy.size,
          sizeDifference: fileCopy.size - file.size,
          originalType: file.type,
          copyType: fileCopy.type
        }
      };
    } catch (blobError) {
      console.error('Blob method failed:', blobError);
      // Continue to next method
    }
    
    // Method 3: Using slice
    try {
      const blob = file.slice(0, file.size, file.type);
      const fileCopy = new File(
        [blob], 
        newName || file.name, 
        { 
          type: file.type,
          lastModified: file.lastModified 
        }
      );
      
      return {
        success: true,
        method: 'slice',
        file: fileCopy,
        details: {
          originalSize: file.size,
          copySize: fileCopy.size,
          sizeDifference: fileCopy.size - file.size,
          originalType: file.type,
          copyType: fileCopy.type
        }
      };
    } catch (sliceError) {
      console.error('Slice method failed:', sliceError);
      // Continue to next method
    }
    
    // All methods failed
    return {
      success: false,
      method: 'none',
      error: 'All file copy methods failed'
    };
  } catch (error) {
    return {
      success: false,
      method: 'none',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tests uploading a file to Supabase storage using different methods
 */
export async function testFileUpload(
  supabase: any, 
  file: File, 
  bucket: string = 'thumbnails'
): Promise<{
  success: boolean;
  results: Record<string, any>[];
}> {
  const results: Record<string, any>[] = [];
  let anySuccess = false;
  
  try {
    // Test 1: Direct upload with original file
    try {
      const fileName = `test-original-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
      
      const result = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (result.error) {
        results.push({
          method: 'direct-original',
          success: false,
          error: result.error.message
        });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(result.data.path);
        
        results.push({
          method: 'direct-original',
          success: true,
          path: result.data.path,
          url: publicUrl
        });
        
        anySuccess = true;
      }
    } catch (error) {
      results.push({
        method: 'direct-original',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Test 2: Upload with arrayBuffer copy
    try {
      const buffer = await file.arrayBuffer();
      const fileName = `test-arraybuffer-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
      const fileCopy = new File(
        [buffer], 
        fileName, 
        { 
          type: file.type,
          lastModified: file.lastModified 
        }
      );
      
      const result = await supabase.storage
        .from(bucket)
        .upload(fileName, fileCopy, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (result.error) {
        results.push({
          method: 'arraybuffer-copy',
          success: false,
          error: result.error.message
        });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(result.data.path);
        
        results.push({
          method: 'arraybuffer-copy',
          success: true,
          path: result.data.path,
          url: publicUrl
        });
        
        anySuccess = true;
      }
    } catch (error) {
      results.push({
        method: 'arraybuffer-copy',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Test 3: Upload with blob copy
    try {
      const blob = new Blob([file], { type: file.type });
      const fileName = `test-blob-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
      const fileCopy = new File(
        [blob], 
        fileName, 
        { 
          type: file.type,
          lastModified: file.lastModified 
        }
      );
      
      const result = await supabase.storage
        .from(bucket)
        .upload(fileName, fileCopy, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (result.error) {
        results.push({
          method: 'blob-copy',
          success: false,
          error: result.error.message
        });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(result.data.path);
        
        results.push({
          method: 'blob-copy',
          success: true,
          path: result.data.path,
          url: publicUrl
        });
        
        anySuccess = true;
      }
    } catch (error) {
      results.push({
        method: 'blob-copy',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Test 4: Upload with FormData
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const fileName = `test-formdata-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
      
      // We can't use formData directly with Supabase storage, so we'll extract the file
      const fileFromFormData = formData.get('file') as File;
      
      const result = await supabase.storage
        .from(bucket)
        .upload(fileName, fileFromFormData, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (result.error) {
        results.push({
          method: 'formdata',
          success: false,
          error: result.error.message
        });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(result.data.path);
        
        results.push({
          method: 'formdata',
          success: true,
          path: result.data.path,
          url: publicUrl
        });
        
        anySuccess = true;
      }
    } catch (error) {
      results.push({
        method: 'formdata',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return {
      success: anySuccess,
      results
    };
  } catch (error) {
    return {
      success: false,
      results: [
        {
          method: 'overall',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        },
        ...results
      ]
    };
  }
} 