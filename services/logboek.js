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

export async function getLogboekEntry(entryId) {
  if (!supabase || !entryId) return null;

  const { data, error } = await supabase
    .from('logboek_entries')
    .select('id, aanvraag_id, author_id, description, fotos, logged_at, created_at, updated_at')
    .eq('id', entryId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateLogboekEntry(entryId, updates) {
  if (!supabase || !entryId) throw new Error('Ongeldige parameters.');

  const { error } = await supabase
    .from('logboek_entries')
    .update({
      description: updates.description,
      fotos: updates.fotos,
      logged_at: updates.logged_at,
    })
    .eq('id', entryId);

  if (error) throw error;
  return { success: true };
}

export async function deleteLogboekEntry(entryId) {
  if (!supabase || !entryId) throw new Error('Ongeldige parameters.');

  const { error } = await supabase
    .from('logboek_entries')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
  return { success: true };
}

export async function getLogboekEntriesForMonth(userId, year, month) {
  if (!supabase || !userId) return { logs: [], loggedDates: [] };

  // Build YYYY-MM-DD date strings for range (safer for date-typed column)
  const mm = String(month + 1).padStart(2, '0');
  const nextMonth = month === 11 ? 1 : month + 2;
  const nextYear = month === 11 ? year + 1 : year;
  const mmNext = String(nextMonth).padStart(2, '0');

  const monthStart = `${year}-${mm}-01`;
  const monthEnd = `${nextYear}-${mmNext}-01`;

  const { data, error } = await supabase
    .from('logboek_entries')
    .select('id, aanvraag_id, author_id, description, fotos, logged_at, created_at')
    .eq('author_id', userId)
    .gte('logged_at', monthStart)
    .lt('logged_at', monthEnd)
    .order('logged_at', { ascending: false });

  if (error) {
    console.warn('Month logs fetch error', error);
    return { logs: [], loggedDates: [] };
  }

  const logs = data || [];
  // logged_at from Supabase date column is already "YYYY-MM-DD"
  const loggedDates = Array.from(new Set(logs.map((log) => log.logged_at)));

  return { logs, loggedDates };
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
