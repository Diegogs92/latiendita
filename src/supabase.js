import { createClient } from '@supabase/supabase-js';

const requiredEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const readEnv = (key) => (import.meta.env[key] || '').trim();

export const missingSupabaseEnv = requiredEnv.filter((key) => !readEnv(key));

const supabaseUrl = readEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = readEnv('VITE_SUPABASE_ANON_KEY');

export const supabase =
  missingSupabaseEnv.length === 0
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const supabaseConfigError =
  missingSupabaseEnv.length > 0
    ? `Faltan variables de entorno de Supabase: ${missingSupabaseEnv.join(', ')}`
    : null;
