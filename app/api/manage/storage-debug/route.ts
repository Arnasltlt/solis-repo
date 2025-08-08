import { NextResponse, NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Restrict to development only
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    const adminClient = createAdminClient();
    
    // Check buckets
    const { data: buckets, error: bucketError } = await adminClient.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      return NextResponse.json({ error: 'Failed to list buckets' }, { status: 500 });
    }
    
    console.log('Available buckets:', buckets.map((b: any) => b.name));
    
    // Check storage permissions
    const policies: any[] = [];
    
    for (const bucket of buckets) {
      try {
        // For simplicity, we're just checking if we can list files in the bucket
        const { data: files, error: listError } = await adminClient.storage
          .from(bucket.name)
          .list();
        
        policies.push({
          bucket: bucket.name,
          canList: !listError,
          fileCount: files?.length || 0,
          error: listError ? listError.message : null
        });
        
      } catch (err) {
        console.error(`Error checking bucket ${bucket.name}:`, err);
        policies.push({
          bucket: bucket.name,
          canList: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      message: 'Storage debug info',
      buckets: buckets.map((b: any) => b.name),
      policies
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 