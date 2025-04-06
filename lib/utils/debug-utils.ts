/**
 * Utility functions for file operations
 * These functions help with file manipulation for upload and storage
 */

/**
 * Creates a copy of a File object to ensure it's a valid File
 * This is useful when dealing with file uploads that may have issues
 */
export async function createFileCopy(
  originalFile: File,
  newName?: string
): Promise<{
  success: boolean;
  file?: File;
  error?: string;
  method?: string;
  details?: any;
}> {
  try {
    // Try the most reliable method first - using .slice()
    try {
      const fileType = originalFile.type || 'application/octet-stream';
      const fileName = newName || originalFile.name;
      
      // Create a new file using the slice method to make a clean copy
      const newFile = new File([originalFile.slice(0, originalFile.size)], fileName, {
        type: fileType,
        lastModified: originalFile.lastModified
      });
      
      return {
        success: true,
        file: newFile,
        method: 'slice'
      };
    } catch (sliceError) {
      // Fallback to Blob conversion
      const blob = await originalFile.arrayBuffer().then(buffer => new Blob([buffer], { type: originalFile.type }));
      const newFile = new File([blob], newName || originalFile.name, { 
        type: originalFile.type,
        lastModified: originalFile.lastModified
      });
      
      return {
        success: true,
        file: newFile,
        method: 'blob'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating file copy',
      details: error
    };
  }
}