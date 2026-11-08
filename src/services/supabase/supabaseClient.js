import { createClient } from '@supabase/supabase-js';

// Read public environment variables safely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('example.supabase.co')
);

// Initialize real Supabase client if credentials are provided
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export function getSupabaseConfigStatus() {
  return {
    isConfigured: isSupabaseConfigured,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 18)}...` : 'Not Set',
    hasAnonKey: Boolean(supabaseAnonKey),
  };
}
