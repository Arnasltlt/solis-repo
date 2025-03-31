-- Create payment_tokens table for storing recurring payment tokens
CREATE TABLE IF NOT EXISTS payment_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS payment_tokens_user_id_idx ON payment_tokens(user_id);
CREATE INDEX IF NOT EXISTS payment_tokens_provider_idx ON payment_tokens(provider);
CREATE INDEX IF NOT EXISTS payment_tokens_is_active_idx ON payment_tokens(is_active);

-- Create user_payment_profiles table to store payment-related information
CREATE TABLE IF NOT EXISTS user_payment_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_recurring_payment BOOLEAN DEFAULT FALSE,
  payment_provider VARCHAR(50),
  payment_method VARCHAR(50),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS user_payment_profiles_user_id_idx ON user_payment_profiles(user_id);

-- Create payment_orders table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'payment_orders'
  ) THEN
    CREATE TABLE payment_orders (
      id VARCHAR(100) PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) NOT NULL,
      tier_id UUID REFERENCES access_tiers(id),
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      provider VARCHAR(50) NOT NULL,
      payment_id VARCHAR(100),
      error_message TEXT,
      is_recurring BOOLEAN DEFAULT FALSE,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Add index for faster lookups
    CREATE INDEX payment_orders_user_id_idx ON payment_orders(user_id);
    CREATE INDEX payment_orders_status_idx ON payment_orders(status);
    CREATE INDEX payment_orders_tier_id_idx ON payment_orders(tier_id);
  ELSE
    -- Add is_recurring column to payment_orders table if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'payment_orders' AND column_name = 'is_recurring'
    ) THEN
      ALTER TABLE payment_orders ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Rename plan_id to tier_id if plan_id exists
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'payment_orders' AND column_name = 'plan_id'
    ) AND NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'payment_orders' AND column_name = 'tier_id'
    ) THEN
      ALTER TABLE payment_orders RENAME COLUMN plan_id TO tier_id;
      -- Update the column type and constraint if needed
      ALTER TABLE payment_orders ALTER COLUMN tier_id TYPE UUID USING tier_id::uuid;
      ALTER TABLE payment_orders ADD CONSTRAINT payment_orders_tier_id_fkey 
        FOREIGN KEY (tier_id) REFERENCES access_tiers(id);
    END IF;
  END IF;
END $$;

-- Create RLS policies for payment_tokens
ALTER TABLE payment_tokens ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own tokens
CREATE POLICY "Users can view their own payment tokens"
  ON payment_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own tokens
CREATE POLICY "Users can insert their own payment tokens"
  ON payment_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own tokens
CREATE POLICY "Users can update their own payment tokens"
  ON payment_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to delete their own payment tokens
CREATE POLICY "Users can delete their own payment tokens"
  ON payment_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role to manage all tokens
CREATE POLICY "Service role can manage all payment tokens"
  ON payment_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for user_payment_profiles
ALTER TABLE user_payment_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own payment profiles
CREATE POLICY "Users can view their own payment profiles"
  ON user_payment_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own payment profiles
CREATE POLICY "Users can insert their own payment profiles"
  ON user_payment_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own payment profiles
CREATE POLICY "Users can update their own payment profiles"
  ON user_payment_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role to manage all payment profiles
CREATE POLICY "Service role can manage all payment profiles"
  ON user_payment_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for payment_orders
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own payment orders
CREATE POLICY "Users can view their own payment orders"
  ON payment_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role to manage all payment orders
CREATE POLICY "Service role can manage all payment orders"
  ON payment_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true); 