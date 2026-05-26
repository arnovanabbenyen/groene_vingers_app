import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getActiveSamenwerking } from '../services/logboek';

export function useActiveSamenwerking(refreshKey = 0) {
  const [samenwerking, setSamenwerking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!supabase) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const userId = sessionData?.session?.user?.id;
        if (!userId) {
          if (mounted) {
            setSamenwerking(null);
            setIsLoading(false);
          }
          return;
        }

        const { data, error: fetchError } = await getActiveSamenwerking(userId);
        if (fetchError) throw fetchError;

        if (mounted) {
          setSamenwerking(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('useActiveSamenwerking error', err);
        if (mounted) {
          setError(err);
          setSamenwerking(null);
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { mounted = false; };
  }, [refreshKey]);

  return { samenwerking, isLoading, error };
}
