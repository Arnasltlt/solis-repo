#!/usr/bin/env ts-node
/**
 * This script processes recurring payments for subscriptions that are about to expire.
 * It should be run as a scheduled task (e.g., daily via cron).
 * 
 * Usage: ts-node scripts/process-recurring-payments.ts
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { payseraService } from '../lib/services/paysera';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const DAYS_BEFORE_EXPIRY = 3; // Process payments 3 days before expiry
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '';

// Define types for database records
interface UserProfile {
  user_id: string;
  subscription_end_date: string;
  is_recurring_payment: boolean;
  users: {
    id: string;
    subscription_tier_id: string;
  };
}

interface AccessTier {
  id: string;
  name: string;
  price: number;
  currency: string;
}

async function processRecurringPayments() {
  console.log('Starting recurring payment processing...');
  
  try {
    // Calculate the date range for subscriptions about to expire
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + DAYS_BEFORE_EXPIRY);
    
    // Format dates for Supabase query
    const expiryDateStr = expiryDate.toISOString();
    const todayStr = today.toISOString();
    
    console.log(`Looking for subscriptions expiring around: ${expiryDateStr}`);
    
    // Find users with active subscriptions about to expire and recurring payment enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('user_payment_profiles')
      .select(`
        user_id,
        subscription_end_date,
        is_recurring_payment,
        users!inner(
          id,
          subscription_tier_id
        )
      `)
      .eq('is_recurring_payment', true)
      .lte('subscription_end_date', expiryDateStr)
      .gte('subscription_end_date', todayStr);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    console.log(`Found ${profiles?.length || 0} subscriptions to renew`);
    
    // Process each subscription
    for (const profile of (profiles || []) as unknown as UserProfile[]) {
      try {
        const userId = profile.user_id;
        const tierId = profile.users.subscription_tier_id;
        
        if (!tierId) {
          console.log(`User ${userId} has no subscription tier, skipping`);
          continue;
        }
        
        // Get tier details
        const { data: tier, error: tierError } = await supabase
          .from('access_tiers')
          .select('id, name, price, currency')
          .eq('id', tierId)
          .single();
        
        if (tierError || !tier) {
          console.error(`Error fetching tier ${tierId} for user ${userId}:`, tierError);
          continue;
        }
        
        // Get user's payment token
        const { data: tokenData, error: tokenError } = await supabase
          .from('payment_tokens')
          .select('token')
          .eq('user_id', userId)
          .eq('provider', 'paysera')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (tokenError || !tokenData) {
          console.error(`No active payment token found for user ${userId}:`, tokenError);
          continue;
        }
        
        const token = tokenData.token;
        const orderId = `renewal_${uuidv4()}`;
        const amount = (tier as AccessTier).price || 9.99; // Default to 9.99 if price is not set
        const currency = (tier as AccessTier).currency || 'EUR'; // Default to EUR if currency is not set
        
        console.log(`Processing renewal for user ${userId}, tier ${(tier as AccessTier).name}, amount ${amount} ${currency}`);
        
        // Create a new order record
        const { error: orderError } = await supabase
          .from('payment_orders')
          .insert({
            id: orderId,
            user_id: userId,
            amount,
            currency,
            tier_id: tierId,
            status: 'pending',
            provider: 'paysera',
            is_recurring: true,
            description: `Automatic renewal for ${(tier as AccessTier).name}`
          });
        
        if (orderError) {
          console.error(`Error creating order for user ${userId}:`, orderError);
          continue;
        }
        
        // Create payment request
        const paymentResponse = await payseraService.createPayment({
          amount,
          currency,
          orderId,
          userId,
          returnUrl: `${BASE_URL}/premium/success?orderId=${orderId}`,
          cancelUrl: `${BASE_URL}/premium/cancel?orderId=${orderId}`,
          callbackUrl: `${BASE_URL}/api/webhooks/paysera`,
          email: '',
          description: `Automatic renewal for ${(tier as AccessTier).name}`,
          isRecurring: true
        });
        
        if (!paymentResponse.paymentRequestId) {
          throw new Error('Payment request ID not returned');
        }
        
        // Authorize payment with token
        const authResponse = await payseraService.authorizeRecurringPayment({
          paymentRequestId: paymentResponse.paymentRequestId,
          token
        });
        
        if (authResponse.status !== 'authorized') {
          throw new Error(`Payment authorization failed: ${authResponse.status}`);
        }
        
        // Capture payment
        const captureResponse = await payseraService.capturePayment({
          paymentRequestId: paymentResponse.paymentRequestId
        });
        
        if (captureResponse.status !== 'captured') {
          throw new Error(`Payment capture failed: ${captureResponse.status}`);
        }
        
        // Update order status
        await supabase
          .from('payment_orders')
          .update({
            status: 'completed',
            payment_id: paymentResponse.paymentRequestId,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
        
        // Calculate new subscription end date (30 days from current end date)
        const currentEndDate = new Date(profile.subscription_end_date);
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(currentEndDate.getDate() + 30);
        
        // Update user payment profile
        await supabase
          .from('user_payment_profiles')
          .update({
            subscription_end_date: newEndDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        console.log(`Successfully renewed subscription for user ${userId} until ${newEndDate.toISOString()}`);
      } catch (error) {
        console.error(`Error processing renewal for user ${profile.user_id}:`, error);
      }
    }
    
    console.log('Recurring payment processing completed');
  } catch (error) {
    console.error('Error in processRecurringPayments:', error);
  }
}

// Run the script
processRecurringPayments()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 