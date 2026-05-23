import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

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

        const conversationsData = rawConversations || [];
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
            .select('id, conversation_id, content, sender_id, created_at, read_at')
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

  return { conversations, isLoading, error, setConversations };
}