#!/usr/bin/env ts-node
/**
 * This script checks the status of user subscriptions.
 * It can be used to identify subscriptions that are about to expire or have expired.
 * 
 * Usage: ts-node scripts/check-subscriptions.ts
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSubscriptions() {
  console.log('Checking subscription status...');
  
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    // Format dates for Supabase query
    const todayStr = today.toISOString();
    const thirtyDaysFromNowStr = thirtyDaysFromNow.toISOString();
    
    // Get expired subscriptions
    const { data: expiredSubscriptions, error: expiredError } = await supabase
      .from('user_payment_profiles')
      .select(`
        user_id,
        subscription_end_date,
        is_recurring_payment,
        users!inner(
          id,
          email
        )
      `)
      .lt('subscription_end_date', todayStr);
    
    if (expiredError) {
      console.error('Error fetching expired subscriptions:', expiredError);
    } else {
      console.log(`Found ${expiredSubscriptions?.length || 0} expired subscriptions`);
      
      if (expiredSubscriptions && expiredSubscriptions.length > 0) {
        console.log('\nExpired Subscriptions:');
        expiredSubscriptions.forEach((profile: any) => {
          console.log(`- User: ${profile.users.email}`);
          console.log(`  ID: ${profile.user_id}`);
          console.log(`  End Date: ${profile.subscription_end_date}`);
          console.log(`  Recurring Payment: ${profile.is_recurring_payment ? 'Enabled' : 'Disabled'}`);
          console.log('---');
        });
      }
    }
    
    // Get subscriptions expiring soon
    const { data: expiringSubscriptions, error: expiringError } = await supabase
      .from('user_payment_profiles')
      .select(`
        user_id,
        subscription_end_date,
        is_recurring_payment,
        users!inner(
          id,
          email
        )
      `)
      .gte('subscription_end_date', todayStr)
      .lte('subscription_end_date', thirtyDaysFromNowStr);
    
    if (expiringError) {
      console.error('Error fetching expiring subscriptions:', expiringError);
    } else {
      console.log(`\nFound ${expiringSubscriptions?.length || 0} subscriptions expiring in the next 30 days`);
      
      if (expiringSubscriptions && expiringSubscriptions.length > 0) {
        console.log('\nSubscriptions Expiring Soon:');
        expiringSubscriptions.forEach((profile: any) => {
          const endDate = new Date(profile.subscription_end_date);
          const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          console.log(`- User: ${profile.users.email}`);
          console.log(`  ID: ${profile.user_id}`);
          console.log(`  End Date: ${profile.subscription_end_date}`);
          console.log(`  Days Until Expiry: ${daysUntilExpiry}`);
          console.log(`  Recurring Payment: ${profile.is_recurring_payment ? 'Enabled' : 'Disabled'}`);
          console.log('---');
        });
      }
    }
    
    // Get active recurring subscriptions
    const { data: recurringSubscriptions, error: recurringError } = await supabase
      .from('user_payment_profiles')
      .select(`
        user_id,
        subscription_end_date,
        is_recurring_payment,
        users!inner(
          id,
          email
        )
      `)
      .eq('is_recurring_payment', true)
      .gte('subscription_end_date', todayStr);
    
    if (recurringError) {
      console.error('Error fetching recurring subscriptions:', recurringError);
    } else {
      console.log(`\nFound ${recurringSubscriptions?.length || 0} active subscriptions with recurring payments enabled`);
      
      if (recurringSubscriptions && recurringSubscriptions.length > 0) {
        console.log('\nActive Recurring Subscriptions:');
        recurringSubscriptions.forEach((profile: any) => {
          const endDate = new Date(profile.subscription_end_date);
          const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          console.log(`- User: ${profile.users.email}`);
          console.log(`  ID: ${profile.user_id}`);
          console.log(`  End Date: ${profile.subscription_end_date}`);
          console.log(`  Days Until Expiry: ${daysUntilExpiry}`);
          console.log('---');
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking subscriptions:', error);
  }
}

// Run the script
checkSubscriptions()
  .then(() => {
    console.log('Subscription check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Subscription check failed:', error);
    process.exit(1);
  }); 