import { supabase } from './supabase';

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
