import { supabase } from './supabase';

// TODO: decide UX for what happens when an aanvraag is retroactively
// declined/cancelled while a conversation exists. Options: archive the
// conversation, show a "samenwerking beeindigd" banner, or delete via cascade.
// For MVP, conversation remains usable.
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
