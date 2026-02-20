import { createClient } from '@supabase/supabase-js';

const requiredEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

export const missingSupabaseEnv = requiredEnv.filter((key) => !import.meta.env[key]);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  missingSupabaseEnv.length === 0
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const supabaseConfigError =
  missingSupabaseEnv.length > 0
    ? `Faltan variables de entorno de Supabase: ${missingSupabaseEnv.join(', ')}`
    : null;
