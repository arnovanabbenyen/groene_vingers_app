import { supabase } from './supabase';
import { AANVRAAG_STATUS } from './aanvraagStatus';

export async function getActiveSamenwerking(userId) {
  if (!supabase || !userId) return { data: null, error: null };

  const { data, error } = await supabase
    .from('aanvragen')
    .select('id, perceel_id, sender_id, status, confirmed_at, type_samenwerking, created_at, percelen(id, naam, beschrijving, grootte, adres, fotos, plaats, voorzieningen, voorkeur_samenwerking, approximate_lat, approximate_lng, lat, lng, extra_info, owner_id)')
    .eq('sender_id', userId)
    .eq('status', AANVRAAG_STATUS.CONFIRMED)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return { data: data || null, error: error || null };

  const ownerId = data.percelen?.owner_id;
  const [ownerResult, convResult] = await Promise.all([
    ownerId
      ? supabase.from('profiles').select('id, first_name, last_name, avatar_url').eq('id', ownerId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('conversations').select('id, aanvraag_id').eq('aanvraag_id', data.id).maybeSingle(),
  ]);

  return {
    data: {
      ...data,
      ownerProfile: ownerResult.data || null,
      conversation: convResult.data || null,
    },
    error: null,
  };
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

export async function getWeeklyProgress(userId, aanvraagId) {
  if (!supabase || !userId) return { data: null, error: null };

  const { data, error } = await supabase.rpc('get_weekly_log_progress', {
    p_user_id: userId,
    p_aanvraag_id: aanvraagId ?? null,
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

export async function getLogboekEntriesForMonth(userId, year, month, aanvraagId) {
  if (!supabase || !userId) return { logs: [], loggedDates: [] };

  // Build YYYY-MM-DD date strings for range (safer for date-typed column)
  const mm = String(month + 1).padStart(2, '0');
  const nextMonth = month === 11 ? 1 : month + 2;
  const nextYear = month === 11 ? year + 1 : year;
  const mmNext = String(nextMonth).padStart(2, '0');

  const monthStart = `${year}-${mm}-01`;
  const monthEnd = `${nextYear}-${mmNext}-01`;

  let query = supabase
    .from('logboek_entries')
    .select('id, aanvraag_id, author_id, description, fotos, logged_at, created_at')
    .eq('author_id', userId)
    .gte('logged_at', monthStart)
    .lt('logged_at', monthEnd)
    .order('logged_at', { ascending: false });

  if (aanvraagId) query = query.eq('aanvraag_id', aanvraagId);

  const { data, error } = await query;

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
