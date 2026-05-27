import { supabase } from './supabase';

export async function getOpvolgingen(aanvraagId) {
  return supabase
    .from('opvolgingen')
    .select('*')
    .eq('aanvraag_id', aanvraagId)
    .order('completed_at', { ascending: true, nullsFirst: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
}

export async function createOpvolging(aanvraagId, authorId, { title, description, due_date }) {
  return supabase
    .from('opvolgingen')
    .insert({ aanvraag_id: aanvraagId, author_id: authorId, title, description, due_date })
    .select()
    .single();
}

export async function toggleOpvolgingComplete(id, isCompleted, userId) {
  return supabase
    .from('opvolgingen')
    .update({
      completed_at: isCompleted ? new Date().toISOString() : null,
      completed_by: isCompleted ? userId : null,
    })
    .eq('id', id)
    .select()
    .single();
}

export async function deleteOpvolging(id) {
  return supabase.from('opvolgingen').delete().eq('id', id);
}
