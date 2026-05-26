import { supabase } from './supabase';
import { AANVRAAG_STATUS } from './aanvraagStatus';

export async function getActiveSamenwerking(userId) {
  if (!supabase || !userId) return { data: null, error: null };

  const { data, error } = await supabase
    .from('aanvragen')
    .select('id, perceel_id, sender_id, status, created_at, percelen(id, naam, plaats, fotos, voorzieningen, grootte)')
    .eq('sender_id', userId)
    .eq('status', AANVRAAG_STATUS.CONFIRMED)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { data: data || null, error: error || null };
}

export async function getLogboekEntries(aanvraagId, limit = 20) {
  if (!supabase || !aanvraagId) return { data: [], error: null };

  const { data, error } = await supabase
    .from('logboek_entries')
    .select('id, aanvraag_id, author_id, description, fotos, logged_at, created_at')
    .eq('aanvraag_id', aanvraagId)
    .order('logged_at', { ascending: false })
    .limit(limit);

  return { data: data || [], error: error || null };
}

export async function getWeeklyProgress(userId) {
  if (!supabase || !userId) return { data: null, error: null };

  const { data, error } = await supabase.rpc('get_weekly_log_progress', {
    p_user_id: userId,
  });

  const row = Array.isArray(data) ? data[0] : data;
  return { data: row || null, error: error || null };
}

export async function updateWeeklyLogGoal(userId, goal) {
  if (!supabase || !userId) return { error: null };

  const clampedGoal = Math.min(7, Math.max(1, Number(goal)));

  const { error } = await supabase
    .from('profiles')
    .update({ weekly_log_goal: clampedGoal })
    .eq('id', userId);

  return { error: error || null };
}
