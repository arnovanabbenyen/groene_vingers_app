// Creates a Stripe subscription with payment_behavior=default_incomplete
// and returns the Payment Sheet params to the React Native client.
// JWT verification is ON — only authenticated users may start a checkout.

import Stripe from 'https://esm.sh/stripe@17?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401);
    }

    // Authenticate via the caller's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const user = userData.user;

    // Service-role client for admin DB operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } }
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, first_name, last_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return jsonResponse({ error: 'Profile not found' }, 404);
    }

    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to persist stripe_customer_id:', updateError);
      }
    }

    const priceId = Deno.env.get('STRIPE_PRICE_ID');
    if (!priceId) {
      return jsonResponse({ error: 'Stripe price not configured' }, 500);
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-12-18.acacia' }
    );

    // Create subscription with payment_behavior=default_incomplete so the
    // Payment Sheet can confirm the first payment intent.
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { user_id: user.id },
    });

    const invoice = subscription.latest_invoice;
    const paymentIntent = invoice.payment_intent;

    if (!paymentIntent?.client_secret) {
      return jsonResponse({ error: 'No payment intent client_secret' }, 500);
    }

    return jsonResponse({
      paymentIntentClientSecret: paymentIntent.client_secret,
      ephemeralKeySecret: ephemeralKey.secret,
      customerId,
      subscriptionId: subscription.id,
    });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    return jsonResponse({ error: err.message }, 500);
  }
});

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
