import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export function usePendingAanvragen() {
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
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const userId = userData?.user?.id;
        if (!userId) {
          if (mounted) {
            setAanvragen([]);
            setIsLoading(false);
          }
          return;
        }

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
              fotos,
              owner_id
            )
          `)
          .eq('perceel.owner_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (aanvragenError) throw aanvragenError;

        const aanvragenData = rawAanvragen || [];
        const senderIds = [...new Set(aanvragenData.map((a) => a.sender_id).filter(Boolean))];

        let senderProfilesById = {};
        if (senderIds.length > 0) {
          const { data: senderProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .in('id', senderIds);

          if (profilesError) {
            console.warn('Failed to load sender profiles', profilesError);
          } else {
            senderProfilesById = (senderProfiles || []).reduce((accumulator, senderProfile) => {
              accumulator[senderProfile.id] = senderProfile;
              return accumulator;
            }, {});
          }
        }

        const enriched = aanvragenData.map((aanvraag) => ({
          ...aanvraag,
          sender: senderProfilesById[aanvraag.sender_id] || null,
        }));

        if (mounted) {
          setAanvragen(enriched);
          setIsLoading(false);
        }
      } catch (err) {
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
  }, []);

  return { aanvragen, isLoading, error, setAanvragen };
}