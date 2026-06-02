import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';

export function useFavorites(refreshKey = 0) {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchFavorites = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        if (mountedRef.current) { setFavoriteIds(new Set()); setIsLoading(false); }
        return;
      }

      const { data, error } = await supabase
        .from('perceel_favorites')
        .select('perceel_id')
        .eq('user_id', userId);

      if (!error && mountedRef.current) {
        setFavoriteIds(new Set((data || []).map((row) => row.perceel_id)));
      }
    } catch (err) {
      console.warn('Failed to load favorites', err);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchFavorites();
    return () => { mountedRef.current = false; };
  }, [fetchFavorites, refreshKey]);

  async function toggleFavorite(perceelId) {
    if (!perceelId || !supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    const isCurrentlyFavorite = favoriteIds.has(perceelId);

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyFavorite) { next.delete(perceelId); } else { next.add(perceelId); }
      return next;
    });

    if (isCurrentlyFavorite) {
      const { error } = await supabase
        .from('perceel_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('perceel_id', perceelId);

      if (error) {
        setFavoriteIds((prev) => new Set(prev).add(perceelId));
        console.warn('Failed to remove favorite', error);
      }
    } else {
      const { error } = await supabase
        .from('perceel_favorites')
        .insert({ user_id: userId, perceel_id: perceelId });

      if (error && error.code !== '23505') {
        setFavoriteIds((prev) => { const next = new Set(prev); next.delete(perceelId); return next; });
        console.warn('Failed to add favorite', error);
      }
    }
  }

  function isFavorite(perceelId) {
    return favoriteIds.has(perceelId);
  }

  return { favoriteIds, isFavorite, toggleFavorite, isLoading, refresh: fetchFavorites };
}
