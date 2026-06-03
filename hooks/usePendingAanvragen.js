import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { AANVRAAG_STATUS } from '../services/aanvraagStatus';
import { getUserAverageRating } from '../services/samenwerkingProposal';

export function usePendingAanvragen(refreshKey = 0) {
  const [aanvragen, setAanvragen] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [internalKey, setInternalKey] = useState(0);

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
            setAanvragen([]);
            setIsLoading(false);
          }
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const verifiedUserId = userData?.user?.id || userId;

        const { data: rawAanvragen, error: aanvragenError } = await supabase
          .from('aanvragen')
          .select(`
            id,
            sender_id,
            motivation,
            type_samenwerking,
            availability,
            start_date,
            status,
            created_at,
            perceel:percelen!inner (
              id,
              naam,
              grootte,
              plaats,
              voorzieningen,
              fotos,
              owner_id
            )
          `)
          .eq('perceel.owner_id', verifiedUserId)
          .eq('status', AANVRAAG_STATUS.PENDING)
          .order('created_at', { ascending: false });

        if (aanvragenError) throw aanvragenError;

        const aanvragenData = rawAanvragen || [];
        const senderIds = [...new Set(aanvragenData.map((a) => a.sender_id).filter(Boolean))];

        let senderProfilesById = {};
        let ratingById = {};
        if (senderIds.length > 0) {
          const [profilesResult, ...ratingResults] = await Promise.all([
            supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', senderIds),
            ...senderIds.map((id) => getUserAverageRating(id).then((r) => [id, r])),
          ]);

          if (profilesResult.error) {
            console.warn('Failed to load sender profiles', profilesResult.error);
          } else {
            senderProfilesById = (profilesResult.data || []).reduce((acc, p) => {
              acc[p.id] = p;
              return acc;
            }, {});
          }

          ratingById = Object.fromEntries(ratingResults);
        }

        const enriched = aanvragenData.map((aanvraag) => ({
          ...aanvraag,
          sender: senderProfilesById[aanvraag.sender_id]
            ? { ...senderProfilesById[aanvraag.sender_id], rating: ratingById[aanvraag.sender_id]?.average ?? null }
            : null,
        }));

        if (mounted) {
          setAanvragen(enriched);
          setIsLoading(false);
        }
      } catch (err) {
        if (err?.name === 'AuthSessionMissingError' || String(err?.message || '').includes('Auth session missing')) {
          if (mounted) {
            setAanvragen([]);
            setIsLoading(false);
          }
          return;
        }

        console.warn('Failed to load aanvragen', err);
        if (mounted) {
          setError(err);
          setAanvragen([]);
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [refreshKey, internalKey]);

  useEffect(() => {
    const channel = supabase
      .channel(`pending-aanvragen-watch-${Math.random()}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'aanvragen' },
        () => { setInternalKey((k) => k + 1); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { aanvragen, isLoading, error, setAanvragen };
}