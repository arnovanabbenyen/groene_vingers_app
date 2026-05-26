// Stripe webhook handler. Receives events from Stripe, verifies
// signatures, and synchronizes subscription state to the database.
//
// Security model:
// 1. Signature verification ensures only Stripe can trigger updates
// 2. Idempotency via stripe_events primary key prevents double-processing
// 3. service_role client bypasses RLS to write to subscriptions/profiles

import Stripe from 'https://esm.sh/stripe@17?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: { persistSession: false },
  }
);

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

// Events we care about. Other events are acknowledged but skipped.
const HANDLED_EVENTS = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'checkout.session.completed',
]);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const rawBody = await req.text();

  // 1. Verify the signature
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider() // required for Deno
    );
  } catch (err) {
    console.error('Signature verification failed:', err.message);
    return new Response(`Webhook signature verification failed: ${err.message}`, {
      status: 400,
    });
  }

  console.log(`Received Stripe event: ${event.type} (${event.id})`);

  // 2. Idempotency: try to log the event. If it already exists, skip.
  const { error: logError } = await supabase
    .from('stripe_events')
    .insert({
      id: event.id,
      type: event.type,
      payload: event,
    });

  if (logError) {
    if (logError.code === '23505') {
      // Unique violation = duplicate event, already processed
      console.log(`Event ${event.id} already processed, skipping.`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('Failed to log event:', logError);
    return new Response('Failed to log event', { status: 500 });
  }

  // 3. Handle the event
  if (!HANDLED_EVENTS.has(event.type)) {
    console.log(`Event type ${event.type} not handled.`);
    return new Response(JSON.stringify({ received: true, handled: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    console.error(`Error handling event ${event.id}:`, err);
    // Return 500 — Stripe will retry. The idempotency check above
    // means a successful retry won't double-process.
    return new Response(`Error processing event: ${err.message}`, {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ received: true, handled: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// ──────────────────────────────────────────────────────────────
// Event handlers
// ──────────────────────────────────────────────────────────────

async function handleEvent(event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await syncSubscription(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
  }
}

async function syncSubscription(subscription) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', subscription.customer)
    .maybeSingle();

  if (profileError || !profile) {
    console.error(`No profile found for customer ${subscription.customer}`);
    throw new Error(`No profile for Stripe customer ${subscription.customer}`);
  }

  const userId = profile.id;
  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price.id;

  // Stripe API >= 2025-03-31 moved current_period_* to the subscription item
  const periodStart = firstItem?.current_period_start ?? subscription.current_period_start;
  const periodEnd = firstItem?.current_period_end ?? subscription.current_period_end;

  const toIsoString = (timestamp) => {
    if (timestamp == null || typeof timestamp !== 'number') return null;
    return new Date(timestamp * 1000).toISOString();
  };

  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        stripe_price_id: priceId,
        status: subscription.status,
        current_period_start: toIsoString(periodStart),
        current_period_end: toIsoString(periodEnd),
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        canceled_at: toIsoString(subscription.canceled_at),
      },
      { onConflict: 'stripe_subscription_id' }
    );

  if (upsertError) throw upsertError;

  const { error: syncError } = await supabase.rpc('sync_user_plan_from_subscription', {
    p_user_id: userId,
  });

  if (syncError) throw syncError;

  console.log(`Synced subscription ${subscription.id} for user ${userId}, status=${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription) {
  // Fetch user_id before updating so we can sync the plan afterward
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) throw error;

  if (sub) {
    const { error: syncError } = await supabase.rpc('sync_user_plan_from_subscription', {
      p_user_id: sub.user_id,
    });
    if (syncError) throw syncError;
    console.log(`Subscription ${subscription.id} canceled for user ${sub.user_id}`);
  }
}

async function handleCheckoutCompleted(session) {
  // The user_id is passed as client_reference_id when the checkout
  // session is created by the React Native app.
  const userId = session.client_reference_id;
  const customerId = session.customer;

  if (!userId || !customerId) {
    console.warn('Checkout session missing client_reference_id or customer');
    return;
  }

  // Link the Stripe customer to the user in our DB
  const { error } = await supabase
    .from('profiles')
    .update({ stripe_customer_id: customerId })
    .eq('id', userId);

  if (error) {
    console.error('Failed to link customer to profile:', error);
    throw error;
  }

  console.log(`Linked Stripe customer ${customerId} to user ${userId}`);

  // The subscription.created event will arrive separately and trigger
  // the subscription sync. Nothing else needed here.
}
