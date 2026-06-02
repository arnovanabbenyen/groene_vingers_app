import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export function useSavedPercelen(refreshKey = 0) {
  const [percelen, setPercelen] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!supabase) { setIsLoading(false); return; }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) { setPercelen([]); setIsLoading(false); return; }

      const { data, error } = await supabase
        .from('perceel_favorites')
        .select(`
          perceel_id,
          created_at,
          perceel:percelen!inner (
            id, naam, beschrijving, plaats, adres, grootte,
            fotos, voorzieningen, extra_info, approximate_lat, approximate_lng,
            lat, lng, owner_id, status, voorkeur_samenwerking
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error) {
        const activePercelen = (data || [])
          .map((row) => row.perceel)
          .filter((p) => p && p.status === 'active');
        setPercelen(activePercelen);
      }
    } catch (err) {
      console.warn('Failed to load saved percelen', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch, refreshKey]);

  return { percelen, isLoading, refresh: fetch };
}
