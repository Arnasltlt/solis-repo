const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testContentCreation() {
  console.log('Connecting to Supabase...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('Connected. Creating test content...');
  
  // First, get an age group ID
  const { data: ageGroups, error: ageGroupError } = await supabase
    .from('age_groups')
    .select('id')
    .limit(1);
  
  if (ageGroupError) {
    console.error('Error fetching age groups:', ageGroupError);
    return;
  }
  
  // Get a category ID
  const { data: categories, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .limit(1);
  
  if (categoryError) {
    console.error('Error fetching categories:', categoryError);
    return;
  }
  
  // Get an access tier ID
  const { data: accessTiers, error: accessTierError } = await supabase
    .from('access_tiers')
    .select('id')
    .eq('name', 'free')
    .limit(1);
  
  if (accessTierError) {
    console.error('Error fetching access tiers:', accessTierError);
    return;
  }
  
  if (!ageGroups.length || !categories.length || !accessTiers.length) {
    console.error('Missing required reference data');
    return;
  }
  
  const ageGroupId = ageGroups[0].id;
  const categoryId = categories[0].id;
  const accessTierId = accessTiers[0].id;
  
  console.log('Using references:', { ageGroupId, categoryId, accessTierId });
  
  // Create a test content item
  const contentData = {
    title: 'Test Content ' + new Date().toISOString(),
    description: 'This is a test content item',
    type: 'video',
    access_tier_id: accessTierId,
    thumbnail_url: null,
    published: true,
    author_id: '00000000-0000-0000-0000-000000000000',
    content_body: JSON.stringify({
      time: new Date().getTime(),
      blocks: [
        {
          type: "paragraph",
          data: {
            text: "Test content body"
          }
        }
      ],
      version: "2.28.2"
    }),
    metadata: {
      content_images: [],
      embed_links: [],
      attachments: []
    },
    slug: 'test-content-' + Date.now()
  };
  
  console.log('Attempting to create content with:', contentData);
  
  const { data: contentItem, error: contentError } = await supabase
    .from('content_items')
    .insert(contentData)
    .select()
    .single();
  
  if (contentError) {
    console.error('Error creating content:', contentError);
    return;
  }
  
  console.log('Content created successfully:', contentItem);
  
  // Create age group relationship
  const { error: ageGroupRelError } = await supabase
    .from('content_age_groups')
    .insert({
      content_id: contentItem.id,
      age_group_id: ageGroupId
    });
  
  if (ageGroupRelError) {
    console.error('Error creating age group relation:', ageGroupRelError);
    return;
  }
  
  // Create category relationship
  const { error: categoryRelError } = await supabase
    .from('content_categories')
    .insert({
      content_id: contentItem.id,
      category_id: categoryId
    });
  
  if (categoryRelError) {
    console.error('Error creating category relation:', categoryRelError);
    return;
  }
  
  console.log('Content relationships created successfully');
  console.log('Test completed successfully!');
}

testContentCreation().catch(console.error); 