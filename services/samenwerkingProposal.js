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

export async function getEndedSamenwerking(aanvraagId) {
  const { data: aanvraag, error } = await supabase
    .from('aanvragen')
    .select(`
      id, status, sender_id, perceel_id,
      samenwerking_ended_at, samenwerking_ended_by, samenwerking_ended_reason,
      confirmed_at, type_samenwerking,
      percelen(id, naam, plaats, fotos, owner_id, voorzieningen, voorkeur_samenwerking, grootte, beschrijving)
    `)
    .eq('id', aanvraagId)
    .maybeSingle();

  if (error || !aanvraag) throw new Error('Samenwerking niet gevonden');

  const { data: initiatorRating } = await supabase
    .from('ratings')
    .select('id, score, review_text, rater_id, rated_id, created_at')
    .eq('aanvraag_id', aanvraagId)
    .eq('rater_id', aanvraag.samenwerking_ended_by)
    .maybeSingle();

  const senderId = aanvraag.sender_id;
  const ownerId = aanvraag.percelen?.owner_id;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url')
    .in('id', [senderId, ownerId].filter(Boolean));

  const map = {};
  (profiles || []).forEach((p) => { map[p.id] = p; });

  return {
    ...aanvraag,
    initiatorRating: initiatorRating || null,
    senderProfile: map[senderId] || null,
    ownerProfile: ownerId ? (map[ownerId] || null) : null,
  };
}

export async function hasUserRatedSamenwerking(aanvraagId, userId) {
  const { data, error } = await supabase
    .from('ratings')
    .select('id')
    .eq('aanvraag_id', aanvraagId)
    .eq('rater_id', userId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

export async function getUserAverageRating(userId) {
  const { data, error } = await supabase
    .rpc('get_user_average_rating', { p_user_id: userId });

  if (error || !data?.length) return { average: null, count: 0 };

  const row = data[0];
  return {
    average: row.average ? parseFloat(row.average) : null,
    count: Number(row.count) || 0,
  };
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
