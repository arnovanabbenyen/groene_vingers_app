import { supabase } from './supabase';

export async function getActiveSamenwerking(userId) {
  const { data, error } = await supabase
    .from('aanvragen')
    .select(`
      id, status, confirmed_at, perceel_id, sender_id,
      percelen!inner(id, naam, plaats, fotos, owner_id, lat, lng)
    `)
    .eq('sender_id', userId)
    .eq('status', 'confirmed')
    .maybeSingle();

  if (error) {
    console.warn('Active samenwerking fetch error', error);
    return null;
  }

  if (!data?.percelen?.owner_id) return data;

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('first_name, last_name, avatar_url')
    .eq('id', data.percelen.owner_id)
    .maybeSingle();

  return { ...data, ownerProfile };
}

export async function getLogboekEntries(userId, limit = 50) {
  const { data, error } = await supabase
    .from('logboek_entries')
    .select('id, aanvraag_id, author_id, description, fotos, logged_at, created_at')
    .eq('author_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Logboek entries fetch error', error);
    return [];
  }
  return data || [];
}

export async function getWeeklyProgress(userId) {
  const { data, error } = await supabase
    .rpc('get_weekly_log_progress', { p_user_id: userId });

  if (error || !data?.length) {
    console.warn('Weekly progress fetch error', error);
    return { days_logged: 0, weekly_goal: 4, logged_dates: [] };
  }
  return data[0];
}

export async function updateWeeklyLogGoal(userId, goal) {
  if (goal < 1 || goal > 7) {
    throw new Error('Doel moet tussen 1 en 7 dagen liggen.');
  }
  const { error } = await supabase
    .from('profiles')
    .update({ weekly_log_goal: goal })
    .eq('id', userId);
  if (error) throw error;
  return { success: true };
}
