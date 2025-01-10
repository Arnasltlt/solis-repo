import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pybqaehxthpxjlboboaq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5YnFhZWh4dGhweGpsYm9ib2FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDEyODMxNywiZXhwIjoyMDQ5NzA0MzE3fQ.jCG1RLu7uMeBPrwZ3ppga5KINpoAg913ClStFb3Xzo8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSlugs() {
  const { data, error } = await supabase
    .from('content_items')
    .select('title, slug')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('\nLatest 10 content items with slugs:')
  console.log('----------------------------------------')
  data.forEach(item => {
    console.log(`Title: ${item.title}`)
    console.log(`Slug:  ${item.slug}`)
    console.log('----------------------------------------')
  })
}

checkSlugs() 