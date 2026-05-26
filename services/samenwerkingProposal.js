import { supabase } from './supabase';

export async function endSamenwerking({ aanvraagId, conversationId, userId, reason }) {
  const { error: updateError } = await supabase
    .from('aanvragen')
    .update({
      status: 'ended',
      samenwerking_ended_at: new Date().toISOString(),
      samenwerking_ended_by: userId,
      samenwerking_ended_reason: reason || null,
    })
    .eq('id', aanvraagId);

  if (updateError) throw updateError;

  if (conversationId) {
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      type: 'system_samenwerking_ended',
    });
    if (msgError) console.warn('Failed to insert system_samenwerking_ended message', msgError);
  }

  return { success: true };
}

export async function submitRating({ aanvraagId, raterId, ratedId, score, reviewText }) {
  if (score < 1 || score > 5) throw new Error('Score moet tussen 1 en 5 zijn.');

  const { error } = await supabase.from('ratings').insert({
    aanvraag_id: aanvraagId,
    rater_id: raterId,
    rated_id: ratedId,
    score,
    review_text: reviewText || null,
  });

  if (error) {
    if (error.code === '23505') throw new Error('Je hebt deze samenwerking al beoordeeld.');
    throw error;
  }

  return { success: true };
}

export async function proposeSamenwerking(aanvraagId, conversationId, userId) {
  const { error: updateError } = await supabase
    .from('aanvragen')
    .update({
      samenwerking_proposed_at: new Date().toISOString(),
      samenwerking_proposed_by: userId,
    })
    .eq('id', aanvraagId);

  if (updateError) throw updateError;

  const { error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      type: 'system_samenwerking_proposed',
    });

  if (messageError) throw messageError;

  return { success: true };
}

export async function confirmSamenwerking(aanvraagId, conversationId, userId) {
  const { error: updateError } = await supabase
    .from('aanvragen')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', aanvraagId);

  if (updateError) throw updateError;

  const { error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      type: 'system_samenwerking_confirmed',
    });

  if (messageError) throw messageError;

  return { success: true };
}

export async function cancelSamenwerkingProposal(aanvraagId, conversationId, userId) {
  const { error: updateError } = await supabase
    .from('aanvragen')
    .update({
      samenwerking_proposed_at: null,
      samenwerking_proposed_by: null,
    })
    .eq('id', aanvraagId);

  if (updateError) throw updateError;

  const { error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      type: 'system_samenwerking_cancelled',
    });

  if (messageError) throw messageError;

  return { success: true };
}
