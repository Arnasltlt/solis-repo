const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function inspectDatabase() {
  console.log('Connecting to Supabase...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('Connected. Querying content_items table...');
  
  // Get a sample row to see the structure
  const { data: sampleData, error: sampleError } = await supabase
    .from('content_items')
    .select('*')
    .limit(1);
  
  if (sampleError) {
    console.error('Error fetching sample data:', sampleError);
  } else {
    console.log('Sample data structure:');
    if (sampleData && sampleData.length > 0) {
      console.log('Columns in content_items:', Object.keys(sampleData[0]));
    } else {
      console.log('No data found in content_items table');
      
      // Try to get the table definition by attempting an insert
      console.log('Attempting test insert to see column structure...');
      
      const { data: testData, error: testError } = await supabase
        .from('content_items')
        .insert({
          title: 'Test Title',
          description: 'Test Description',
          type: 'video',
          access_tier_id: '00000000-0000-0000-0000-000000000000',
          published: false,
          author_id: 'system',
          _test_column: 'This column does not exist'
        })
        .select();
      
      if (testError) {
        console.log('Test insertion error (shows available columns):', testError);
      }
    }
  }
}

inspectDatabase().catch(console.error); 