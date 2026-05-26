import { supabase } from './supabase';

// Conversations linked to status='ended' are hidden in the overview via
// isConversationVisible() in useConversations — no data is deleted.
export async function createConversationForAanvraag({ aanvraagId, ownerId, senderId }) {
  if (!supabase || !aanvraagId || !ownerId || !senderId) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      aanvraag_id: aanvraagId,
      owner_id: ownerId,
      sender_id: senderId,
    })
    .select('id, aanvraag_id, owner_id, sender_id, created_at, last_message_at')
    .single();

  if (error && error.code === '23505') {
    return { data: null, error: null, duplicate: true };
  }

  return { data: data || null, error: error || null };
}
