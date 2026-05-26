import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getActiveSamenwerking } from '../services/logboek';

export function useActiveSamenwerking(refreshKey = 0) {
  const [samenwerking, setSamenwerking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!supabase) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
          if (mounted) { setSamenwerking(null); setIsLoading(false); }
          return;
        }

        const data = await getActiveSamenwerking(userId);
        if (mounted) { setSamenwerking(data); setIsLoading(false); }
      } catch (err) {
        console.warn('useActiveSamenwerking error', err);
        if (mounted) { setSamenwerking(null); setIsLoading(false); }
      }
    }

    load();
    return () => { mounted = false; };
  }, [refreshKey]);

  return { samenwerking, isLoading, hasActiveSamenwerking: !!samenwerking };
}
