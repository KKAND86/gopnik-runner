/**
 * Supabase API layer
 * Спринт 1: заглушки. Спринт 3-4: реальная интеграция.
 */

const SUPABASE_URL = '';
const SUPABASE_KEY = '';

let supabase = null;

export async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[Supabase] Нет ключей. Лидерборд отключён.');
    return null;
  }
  try {
    const { createClient } = await import('./supabase-stub.js');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    return supabase;
  } catch (e) {
    console.warn('[Supabase] Модуль недоступен:', e.message);
    return null;
  }
}

export async function saveScore(name, distance, coins) {
  if (!supabase) {
    console.log('[Supabase] Score (local):', { name, distance, coins });
    return { local: true };
  }
}

export async function getLeaderboard(limit = 10) {
  if (!supabase) {
    return [
      { name: 'Гопник1999', distance: 1250 },
      { name: 'МамаНаБалконе', distance: 890 }
    ];
  }
}
