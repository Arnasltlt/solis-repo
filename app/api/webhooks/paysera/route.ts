import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { payseraService } from '@/lib/services/paysera';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // Get the raw body data
    const formData = await req.formData();
    const formDataObj: Record<string, string> = {};
    
    // Convert FormData to object - fixed iteration
    Array.from(formData.entries()).forEach(([key, value]) => {
      formDataObj[key] = value.toString();
    });
    
    // Check if this is a notification ID from the REST API
    if (formDataObj.notification_id) {
      return handleRestNotification(formDataObj.notification_id);
    }
    
    // Legacy webhook handling
    // Verify the webhook signature
    const signature = formDataObj.sign || '';
    const isValid = payseraService.verifyWebhook(formDataObj, signature);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // Parse the payment response
    const paymentResponse = payseraService.parsePaymentResponse(formDataObj);
    const orderId = paymentResponse.orderId;
    
    if (paymentResponse.status === 'ok') {
      // Update order status in database
      const { error: updateError } = await supabase
        .from('payment_orders')
        .update({
          status: 'completed',
          payment_id: paymentResponse.paymentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (updateError) {
        console.error('Error updating order:', updateError);
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        );
      }
      
      // Get the order details
      const { data: order, error: orderError } = await supabase
        .from('payment_orders')
        .select('*, user_id, tier_id')
        .eq('id', orderId)
        .single();
      
      if (orderError || !order) {
        console.error('Error fetching order:', orderError);
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      
      // Update user subscription tier
      const { error: userError } = await supabase
        .from('users')
        .update({
          subscription_tier_id: order.tier_id,
        })
        .eq('id', order.user_id);
      
      if (userError) {
        console.error('Error updating user subscription tier:', userError);
        return NextResponse.json(
          { error: 'Failed to update user subscription tier' },
          { status: 500 }
        );
      }
      
      // Update or create user payment profile
      const { error: profileError } = await supabase
        .from('user_payment_profiles')
        .upsert({
          user_id: order.user_id,
          payment_provider: 'paysera',
          payment_method: 'card',
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (profileError) {
        console.error('Error updating user payment profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to update user payment profile' },
          { status: 500 }
        );
      }
      
      // Return success response to Paysera
      return NextResponse.json({ status: 'OK' });
    } else {
      // Update order status to failed
      await supabase
        .from('payment_orders')
        .update({
          status: 'failed',
          error_message: paymentResponse.error,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      return NextResponse.json({ status: 'OK' });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleRestNotification(notificationId: string) {
  try {
    // Get notification data
    const notification = await payseraService.getNotification(notificationId);
    
    if (!notification || !notification.data) {
      console.error('Invalid notification data received');
      return NextResponse.json(
        { error: 'Invalid notification data' },
        { status: 400 }
      );
    }
    
    // Mark notification as read to acknowledge receipt
    await payseraService.markNotificationAsRead(notificationId);
    
    // Extract payment data
    const paymentData = notification.data;
    const orderId = paymentData.order_id;
    const status = paymentData.status;
    const token = paymentData.token;
    
    if (!orderId) {
      console.error('Missing order_id in notification data');
      return NextResponse.json(
        { error: 'Missing order_id in notification data' },
        { status: 400 }
      );
    }
    
    // Update order in database
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: status === 'confirmed' ? 'completed' : status,
        payment_id: paymentData.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }
    
    // If payment is successful and token is provided, store it for recurring billing
    if (status === 'confirmed' && token) {
      // Get the order details
      const { data: order, error: orderError } = await supabase
        .from('payment_orders')
        .select('user_id, tier_id')
        .eq('id', orderId)
        .single();
      
      if (orderError || !order) {
        console.error('Error fetching order:', orderError);
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      
      // Store payment token
      const { error: tokenError } = await supabase
        .from('payment_tokens')
        .upsert({
          user_id: order.user_id,
          provider: 'paysera',
          token: token,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (tokenError) {
        console.error('Error storing payment token:', tokenError);
        return NextResponse.json(
          { error: 'Failed to store payment token' },
          { status: 500 }
        );
      }
      
      // Update user subscription tier
      const { error: userError } = await supabase
        .from('users')
        .update({
          subscription_tier_id: order.tier_id,
        })
        .eq('id', order.user_id);
      
      if (userError) {
        console.error('Error updating user subscription tier:', userError);
        return NextResponse.json(
          { error: 'Failed to update user subscription tier' },
          { status: 500 }
        );
      }
      
      // Update or create user payment profile
      const { error: profileError } = await supabase
        .from('user_payment_profiles')
        .upsert({
          user_id: order.user_id,
          is_recurring_payment: true,
          payment_provider: 'paysera',
          payment_method: 'card',
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (profileError) {
        console.error('Error updating user payment profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to update user payment profile' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    console.error('Error handling REST notification:', error);
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    );
  }
} 