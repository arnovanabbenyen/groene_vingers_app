import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export function useNotifications(refreshKey = 0) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const { data: rows, error: notifError } = await supabase
        .from('notifications')
        .select('id, type, title, body, related_id, related_type, actor_id, created_at, read_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (notifError) throw notifError;

      const notifRows = rows || [];

      // Batch-fetch actor profiles
      const actorIds = [...new Set(notifRows.map((n) => n.actor_id).filter(Boolean))];
      let actorsById = {};

      if (actorIds.length > 0) {
        const { data: actors } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', actorIds);

        actorsById = (actors || []).reduce((acc, a) => {
          acc[a.id] = a;
          return acc;
        }, {});
      }

      setNotifications(
        notifRows.map((n) => ({ ...n, actor: actorsById[n.actor_id] || null }))
      );
      setError(null);
    } catch (err) {
      console.warn('Failed to load notifications', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch + refresh-key re-fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, refreshKey]);

  // Realtime: re-fetch on any INSERT for this user
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    let channel = null;

    async function setup() {
      const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: null }));
      const userId = userData?.user?.id;
      if (!userId || !mounted) return;

      channel = supabase
        .channel(`notifications:${userId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        }, () => { fetchNotifications(); })
        .subscribe();
    }

    setup();
    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  async function markAsRead(notificationId) {
    if (!supabase) return;
    const now = new Date().toISOString();
    const { error: err } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('id', notificationId);

    if (!err) {
      setNotifications((prev) =>
        prev.map((n) => n.id === notificationId ? { ...n, read_at: now } : n)
      );
    }
  }

  async function markAllAsRead() {
    if (!supabase) return;
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const now = new Date().toISOString();
    const { error: err } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .in('id', unreadIds);

    if (!err) {
      setNotifications((prev) =>
        prev.map((n) => (n.read_at ? n : { ...n, read_at: now }))
      );
    }
  }

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
