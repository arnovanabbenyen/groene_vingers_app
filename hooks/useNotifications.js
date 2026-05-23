import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export function useNotifications(refreshKey = 0) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!supabase) {
        if (mounted) setIsLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;

      if (!uid) {
        if (mounted) setIsLoading(false);
        return;
      }

      if (mounted) setUserId(uid);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!mounted) return;
      if (error) console.warn('Failed to load notifications', error);
      setNotifications(data || []);
      setIsLoading(false);
    }

    init();
    return () => { mounted = false; };
  }, [refreshKey]);

  useEffect(() => {
    if (!userId || !supabase) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications((prev) =>
          prev.map((n) => n.id === payload.new.id ? payload.new : n)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markAsRead = useCallback(async (id) => {
    if (!supabase) return;
    const now = new Date().toISOString();
    await supabase.from('notifications').update({ read_at: now }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read_at: now } : n)
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!supabase || !userId) return;
    const now = new Date().toISOString();
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', userId)
      .is('read_at', null);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || now }))
    );
  }, [userId]);

  return { notifications, isLoading, unreadCount, markAsRead, markAllAsRead };
}
