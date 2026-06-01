import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { AANVRAAG_STATUS } from '../services/aanvraagStatus';

export function useMyAanvragen(refreshKey = 0) {
  const [aanvragen, setAanvragen] = useState([]);
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
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (!userId) {
          if (mounted) { setAanvragen([]); setIsLoading(false); }
          return;
        }

        const { data: rawAanvragen, error: aanvragenError } = await supabase
          .from('aanvragen')
          .select(`
            id,
            status,
            created_at,
            perceel_id,
            percelen!inner (
              id, naam, beschrijving, grootte, adres, plaats, fotos, voorzieningen, voorkeur_samenwerking, approximate_lat, approximate_lng, lat, lng, extra_info, status, owner_id
            )
          `)
          .eq('sender_id', userId)
          .in('status', [AANVRAAG_STATUS.PENDING, AANVRAAG_STATUS.ACCEPTED, AANVRAAG_STATUS.CONFIRMED])
          .order('created_at', { ascending: false });

        if (aanvragenError) throw aanvragenError;

        const aanvragenData = rawAanvragen || [];

        const ownerIds = [...new Set(aanvragenData.map((a) => a.percelen?.owner_id).filter(Boolean))];
        let ownersById = {};
        if (ownerIds.length > 0) {
          const { data: owners } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', ownerIds);
          ownersById = (owners || []).reduce((acc, o) => {
            acc[o.id] = o;
            return acc;
          }, {});
        }

        const enriched = aanvragenData.map((a) => ({
          ...a,
          perceel: a.percelen,
          owner: ownersById[a.percelen?.owner_id] || null,
        }));

        if (mounted) { setAanvragen(enriched); setIsLoading(false); }
      } catch (err) {
        if (
          err?.name === 'AuthSessionMissingError' ||
          String(err?.message || '').includes('Auth session missing')
        ) {
          if (mounted) { setAanvragen([]); setIsLoading(false); }
          return;
        }
        console.warn('Failed to load my aanvragen', err);
        if (mounted) { setError(err); setAanvragen([]); setIsLoading(false); }
      }
    }

    load();
    return () => { mounted = false; };
  }, [refreshKey]);

  return { aanvragen, isLoading, error };
}
