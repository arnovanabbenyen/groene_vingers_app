import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { AANVRAAG_STATUS } from '../services/aanvraagStatus';

export function useMyAanvragen(refreshKey = 0) {
  const [aanvragen, setAanvragen] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) {
        setAanvragen([]);
        setIsLoading(false);
        return;
      }
      setUserId(uid);

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
        .eq('sender_id', uid)
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

      setAanvragen(enriched);
      setIsLoading(false);
    } catch (err) {
      if (
        err?.name === 'AuthSessionMissingError' ||
        String(err?.message || '').includes('Auth session missing')
      ) {
        setAanvragen([]);
        setIsLoading(false);
        return;
      }
      console.warn('Failed to load my aanvragen', err);
      setError(err);
      setAanvragen([]);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // Realtime: refetch when any of the tuinzoeker's aanvragen changes status.
  // This ensures declined/cancelled aanvragen disappear immediately without a restart.
  useEffect(() => {
    if (!supabase || !userId) return;

    const channel = supabase
      .channel(`my_aanvragen:${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'aanvragen',
        filter: `sender_id=eq.${userId}`,
      }, () => { load(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, load]);

  return { aanvragen, isLoading, error };
}
