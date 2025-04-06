#!/usr/bin/env ts-node
/**
 * This script tests the recurring payment processor by setting up a test environment.
 * It creates a test user with a subscription that is about to expire and recurring payments enabled.
 * 
 * Usage: ts-node scripts/test-recurring-payments.ts
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTestEnvironment() {
  console.log('Setting up test environment for recurring payments...');
  
  try {
    // Create a test user if it doesn't exist
    const testEmail = `test-recurring-${uuidv4()}@example.com`;
    const testPassword = process.env.TEST_USER_PASSWORD || `TestPw_${uuidv4().substring(0, 8)}!`;
    
    console.log(`Creating test user: ${testEmail}`);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (authError) {
      console.error('Error creating test user:', authError);
      return;
    }
    
    const userId = authData.user?.id;
    if (!userId) {
      console.error('User ID not found in auth response');
      return;
    }
    
    console.log(`Test user created with ID: ${userId}`);
    
    // Get a subscription tier
    const { data: tier, error: tierError } = await supabase
      .from('access_tiers')
      .select('id, name, price, currency')
      .limit(1)
      .single();
    
    if (tierError || !tier) {
      console.error('Error fetching subscription tier:', tierError);
      return;
    }
    
    console.log(`Using subscription tier: ${tier.name} (${tier.id})`);
    
    // Update user with subscription tier
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        subscription_tier_id: tier.id,
      })
      .eq('id', userId);
    
    if (userUpdateError) {
      console.error('Error updating user with subscription tier:', userUpdateError);
      return;
    }
    
    // Calculate subscription end date (3 days from now)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    
    // Create user payment profile
    const { error: profileError } = await supabase
      .from('user_payment_profiles')
      .insert({
        user_id: userId,
        subscription_end_date: endDate.toISOString(),
        is_recurring_payment: true,
      });
    
    if (profileError) {
      console.error('Error creating user payment profile:', profileError);
      return;
    }
    
    // Create a fake payment token
    const { error: tokenError } = await supabase
      .from('payment_tokens')
      .insert({
        user_id: userId,
        token: `test_token_${uuidv4()}`,
        provider: 'paysera',
        is_active: true,
      });
    
    if (tokenError) {
      console.error('Error creating payment token:', tokenError);
      return;
    }
    
    console.log(`Test environment set up successfully for user ${userId}`);
    console.log(`Subscription end date: ${endDate.toISOString()}`);
    console.log('You can now run the recurring payment processor to test it:');
    console.log('ts-node scripts/process-recurring-payments.ts');
    
  } catch (error) {
    console.error('Error setting up test environment:', error);
  }
}

// Run the script
setupTestEnvironment()
  .then(() => {
    console.log('Test setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test setup failed:', error);
    process.exit(1);
  }); 