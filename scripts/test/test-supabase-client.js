const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseClient() {
  console.log('Testing Supabase client...');
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('ANON_KEY available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('Supabase client created, testing query...');
    
    // Try a simple query
    const { data, error } = await supabase
      .from('age_groups')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('Error querying Supabase:', error);
    } else {
      console.log('Successfully queried Supabase!');
      console.log('Data:', data);
    }
  } catch (error) {
    console.error('Exception when using Supabase client:', error);
  }
}

testSupabaseClient().catch(console.error); 