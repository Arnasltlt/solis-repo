require('dotenv').config();

async function testSupabaseAPI() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Testing Supabase API directly...');
  console.log('SUPABASE_URL:', supabaseUrl);
  console.log('ANON_KEY available:', !!supabaseKey);
  
  try {
    // Import fetch dynamically
    const { default: fetch } = await import('node-fetch');
    
    // Make a direct API call to Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/age_groups?select=*&limit=3`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Successfully fetched data from Supabase API!');
    console.log('Data:', data);
  } catch (error) {
    console.error('Exception when accessing Supabase API:', error);
  }
}

testSupabaseAPI().catch(console.error); 