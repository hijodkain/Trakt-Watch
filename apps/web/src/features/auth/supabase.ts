import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string);
  }
  return client;
}

// Compat: el resto del código importa `supabase` directamente.
// Si no hay configuración, exportamos un proxy que falla de forma
// controlada en lugar de romper toda la app en el arranque.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getSupabase();
    if (!c) {
      throw new Error(
        'Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel y redespliega.'
      );
    }
    const value = (c as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(c) : value;
  },
});
