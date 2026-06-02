import { supabase } from './supabase';

export async function createCheckoutSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Niet ingelogd');
  }

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Kon checkout sessie niet aanmaken');
  }

  return response.json();
}

export async function createBillingPortalSession({ returnUrl }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Niet ingelogd');
  }

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-billing-portal-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ returnUrl }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Kon abonnementspagina niet openen');
  }

  return response.json();
}

/**
 * Polls profiles.plan after payment until it becomes 'pro'.
 * The webhook sets this asynchronously after Stripe confirms the subscription.
 */
export async function pollForProStatus(maxAttempts = 8, intervalMs = 1500) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  for (let i = 0; i < maxAttempts; i++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data?.plan === 'pro') return true;

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}
