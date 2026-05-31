import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { mapPerceelToPlot } from '../utils/mapPerceelToPlot';

export function usePercelen(refreshKey = 0) {
  const [percelen, setPercelen] = useState(null); // null = not yet loaded
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!supabase) {
        if (mounted) { setPercelen([]); setIsLoading(false); }
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('percelen')
          .select('id, naam, grootte, plaats, fotos, voorzieningen, extra_info, owner_id, adres, approximate_lat, approximate_lng')
          .eq('status', 'active');

        if (fetchError) throw fetchError;

        const mapped = (data || []).map(mapPerceelToPlot).filter(Boolean);
        if (mounted) { setPercelen(mapped); setIsLoading(false); }
      } catch (err) {
        console.warn('Failed to load percelen', err);
        if (mounted) { setError(err); setPercelen([]); setIsLoading(false); }
      }
    }

    load();
    return () => { mounted = false; };
  }, [refreshKey]);

  return { percelen, isLoading, error };
}
