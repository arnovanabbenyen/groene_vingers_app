import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export function useMapPercelen() {
  const [percelen, setPercelen] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!supabase) {
        if (mounted) setIsLoading(false);
        return;
      }

      // Try with approximate coords (requires migration to be applied)
      const { data, error } = await supabase
        .from('percelen')
        .select('id, naam, beschrijving, plaats, adres, grootte, fotos, voorzieningen, voorkeur_samenwerking, approximate_lat, approximate_lng, owner_id')
        .eq('status', 'active')
        .not('approximate_lat', 'is', null);

      if (error) {
        // 42703 = column does not exist (migration not yet applied)
        // Fall back to fetching without map coords — list view still works
        if (error.code === '42703') {
          console.info('useMapPercelen: approximate_lat column not found — apply the migration in Supabase to enable map pins.');
          const { data: fallback } = await supabase
            .from('percelen')
            .select('id, naam, beschrijving, plaats, adres, grootte, fotos, voorzieningen, owner_id')
            .eq('status', 'active');
          if (mounted) {
            const unique = [...new Map((fallback || []).map(p => [p.id, p])).values()];
            setPercelen(unique);
            setIsLoading(false);
          }
        } else {
          console.warn('useMapPercelen:', error);
          if (mounted) setIsLoading(false);
        }
        return;
      }

      if (mounted) {
        const unique = [...new Map((data || []).map(p => [p.id, p])).values()];
        setPercelen(unique);
        setIsLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  return { percelen, isLoading };
}
