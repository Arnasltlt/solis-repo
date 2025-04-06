const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('ANON_KEY available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log('SERVICE_ROLE_KEY available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('Supabase client created, testing connection...');
    
    // Try a simple query
    const { data, error } = await supabase
      .from('age_groups')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('Exception when connecting to Supabase:', error);
  }
}

testSupabaseConnection().catch(console.error); 