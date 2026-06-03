import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { isConversationVisible } from '../utils/conversationFilters';

const HIDDEN_STATUSES = new Set(['ended', 'cancelled', 'declined']);

export function useConversations(refreshKey = 0) {
  const [conversations, setConversations] = useState([]);
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
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const userId = sessionData?.session?.user?.id;
        if (!userId) {
          if (mounted) {
            setConversations([]);
            setIsLoading(false);
          }
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const verifiedUserId = userData?.user?.id || userId;

        const { data: rawConversations, error: convError } = await supabase
          .from('conversations')
          .select('id, aanvraag_id, owner_id, sender_id, created_at, last_message_at')
          .or(`owner_id.eq.${verifiedUserId},sender_id.eq.${verifiedUserId}`)
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });

        if (convError) throw convError;

        // Fetch aanvraag statuses in a separate query — embedded joins can silently return
        // null under certain RLS configurations, which would cause hidden conversations to
        // remain visible. A direct .in() query is simpler and more reliable.
        const allAanvraagIds = (rawConversations || []).map((c) => c.aanvraag_id).filter(Boolean);
        let aanvraagStatusById = {};
        if (allAanvraagIds.length > 0) {
          const { data: aanvragenData } = await supabase
            .from('aanvragen')
            .select('id, status')
            .in('id', allAanvraagIds);
          aanvraagStatusById = (aanvragenData || []).reduce((acc, a) => {
            acc[a.id] = a.status;
            return acc;
          }, {});
        }

        // Attach the status so isConversationVisible can read conversation.aanvragen.status,
        // then filter out conversations with hidden statuses.
        const conversationsWithStatus = (rawConversations || []).map((c) => ({
          ...c,
          aanvragen: { status: aanvraagStatusById[c.aanvraag_id] ?? null },
        }));

        // No data is deleted — this is a client-side filter only.
        const conversationsData = conversationsWithStatus.filter(isConversationVisible);
        const otherUserIds = [...new Set(
          conversationsData.map((conversation) => (
            conversation.owner_id === verifiedUserId ? conversation.sender_id : conversation.owner_id
          ))
        )];

        let profilesById = {};
        if (otherUserIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .in('id', otherUserIds);

          if (profilesError) {
            console.warn('Failed to load profiles for conversations', profilesError);
          } else {
            profilesById = (profiles || []).reduce((accumulator, profile) => {
              accumulator[profile.id] = profile;
              return accumulator;
            }, {});
          }
        }

        const conversationIds = conversationsData.map((conversation) => conversation.id);
        const lastMessagesByConversation = {};
        const unreadCountsByConversation = {};

        if (conversationIds.length > 0) {
          const { data: recentMessages, error: msgError } = await supabase
            .from('messages')
            .select('id, conversation_id, content, sender_id, created_at, read_at, media_url, media_urls, media_type, type')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false });

          if (msgError) {
            console.warn('Failed to load messages', msgError);
          } else {
            for (const message of recentMessages || []) {
              if (!lastMessagesByConversation[message.conversation_id]) {
                lastMessagesByConversation[message.conversation_id] = message;
              }

              if (message.sender_id !== verifiedUserId && !message.read_at) {
                unreadCountsByConversation[message.conversation_id] = (unreadCountsByConversation[message.conversation_id] || 0) + 1;
              }
            }
          }
        }

        const enriched = conversationsData.map((conversation) => {
          const otherUserId = conversation.owner_id === verifiedUserId ? conversation.sender_id : conversation.owner_id;

          return {
            ...conversation,
            otherUser: profilesById[otherUserId] || null,
            lastMessage: lastMessagesByConversation[conversation.id] || null,
            unreadCount: unreadCountsByConversation[conversation.id] || 0,
          };
        });

        if (mounted) {
          setConversations(enriched);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load conversations', err);
        if (mounted) {
          setError(err);
          setConversations([]);
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    const channel = supabase
      .channel('aanvragen-status-watch')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'aanvragen' },
        (payload) => {
          if (HIDDEN_STATUSES.has(payload.new?.status)) {
            setConversations((prev) =>
              prev.filter((c) => c.aanvraag_id !== payload.new.id)
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { conversations, isLoading, error, setConversations };
}