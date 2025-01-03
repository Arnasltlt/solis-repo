-- First, let's make sure we have all the tiers
INSERT INTO access_tiers (name, level, features)
VALUES 
  ('free', 0, '{"description": "Basic access to free content"}'),
  ('premium', 1, '{"description": "Full access to all content"}'),
  ('administrator', 2, '{"description": "Administrator access with full content management capabilities"}')
ON CONFLICT (name) DO UPDATE 
SET level = EXCLUDED.level,
    features = EXCLUDED.features;

-- Get the administrator tier ID
DO $$ 
DECLARE 
  admin_tier_id UUID;
BEGIN
  SELECT id INTO admin_tier_id FROM access_tiers WHERE name = 'administrator';

  -- Update solis@soliopamoka.lt to be an administrator
  UPDATE auth.users 
  SET subscription_tier_id = admin_tier_id
  WHERE email = 'solis@soliopamoka.lt';

  -- Make sure arnoldaskem@gmail.com has premium access
  UPDATE auth.users 
  SET subscription_tier_id = (SELECT id FROM access_tiers WHERE name = 'premium')
  WHERE email = 'arnoldaskem@gmail.com';
END $$; 