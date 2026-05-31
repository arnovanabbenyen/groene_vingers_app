import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const FALLBACK_AVATAR = require('../images/tuinzoeker_pfp.png');

export function useUserProfile(refreshKey = 0) {
  const [firstName, setFirstName] = useState('');
  const [plaats, setPlaats] = useState('');
  const [plan, setPlan] = useState('free');
  const [avatarSource, setAvatarSource] = useState(FALLBACK_AVATAR);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!supabase) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) {
          if (mounted) setIsLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, plaats, plan, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (mounted) {
          if (profile?.first_name) setFirstName(profile.first_name);
          if (profile?.plaats) setPlaats(profile.plaats);
          if (profile?.plan) setPlan(profile.plan);
          if (profile?.avatar_url) setAvatarSource(profile.avatar_url);
          setIsLoading(false);
        }
      } catch (err) {
        if (
          err?.name === 'AuthSessionMissingError' ||
          String(err?.message || '').includes('Auth session missing')
        ) {
          if (mounted) setIsLoading(false);
          return;
        }
        console.warn('Failed to load user profile', err);
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [refreshKey]);

  return { firstName, plaats, plan, avatarSource, isLoading };
}
