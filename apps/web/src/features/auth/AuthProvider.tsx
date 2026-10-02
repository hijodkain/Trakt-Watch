'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from './supabase';

export { supabase, getSupabase, isSupabaseConfigured } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (provider: 'google' | 'github' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      // Modo single-user sin backend: no hay sesión, pero la app debe arrancar.
      setLoading(false);
      return;
    }

    // Get initial session (con catch: si falla la red o las keys,
    // nunca nos quedamos en loading infinito)
    client.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((err) => {
        console.error('Error obteniendo sesión de Supabase:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen for auth changes
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
      subscription = data.subscription;
    } catch (err) {
      console.error('Error suscribiendo cambios de auth:', err);
      setLoading(false);
    }

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (provider: 'google' | 'github' | 'apple') => {
    const client = getSupabase();
    if (!client) throw new Error('Supabase no está configurado.');
    const redirectTo = `${window.location.origin}/auth/callback`;
    await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
  };

  const signOut = async () => {
    await getSupabase()?.auth.signOut();
  };

  const refreshSession = async () => {
    const client = getSupabase();
    if (!client) return;
    const { data: { session } } = await client.auth.refreshSession();
    setSession(session);
    setUser(session?.user ?? null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}