-- Create a view to access user data
CREATE OR REPLACE VIEW users AS
SELECT 
  id,
  email,
  subscription_tier_id
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Add RLS policy to the view
ALTER VIEW users SET (security_invoker = true);

COMMENT ON VIEW users IS 'Public view of auth.users with limited fields'; 