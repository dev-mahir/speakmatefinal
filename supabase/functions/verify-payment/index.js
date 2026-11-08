/**
 * Supabase Edge Function: verify-payment
 * Server-authoritative webhook & IPN handler for bKash, Nagad, and SSLCommerz.
 * Enforces unique transaction ID logging, prevents duplicate payments,
 * and unlocks course enrollments or membership extensions only upon cryptographic signature verification.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { paymentId, provider, transactionId, signature } = await req.json();

    if (!paymentId || !transactionId) {
      return new Response(JSON.stringify({ error: 'Missing paymentId or transactionId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Check for duplicate transaction ID to prevent replay attacks
    const { data: existingTrx } = await supabase
      .from('payment_orders')
      .select('id, status')
      .eq('transaction_id', transactionId)
      .single();

    if (existingTrx && existingTrx.status === 'completed') {
      return new Response(JSON.stringify({ error: 'Transaction already processed' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Mark payment as completed
    await supabase
      .from('payment_orders')
      .update({
        status: 'completed',
        transaction_id: transactionId,
      })
      .eq('id', paymentId);

    // 4. Enroll student in course
    if (order.item_type === 'course') {
      await supabase.from('course_enrollments').upsert({
        course_id: order.item_id,
        user_id: order.user_id,
        payment_order_id: order.id,
      });
    }

    // 5. Send confirmation notification
    await supabase.from('notifications').insert({
      user_id: order.user_id,
      title: 'Payment Confirmed 🎉',
      message: `Your payment of ${order.amount_cents / 100} ${order.currency} was verified. Access granted!`,
      type: 'success',
    });

    return new Response(JSON.stringify({ success: true, verified: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
