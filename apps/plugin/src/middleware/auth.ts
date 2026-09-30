import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Context, Next } from 'hono';
import { PluginContext } from '../types';
import bcrypt from 'bcryptjs';

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const token = c.req.query('token');
  
  if (!token) {
    return c.json({ error: 'Token required' }, 401);
  }

  const supabaseUrl = c.env.SUPABASE_URL;
  const supabaseKey = c.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return c.json({ error: 'Server configuration error' }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find token hash in database
  const { data: tokens, error } = await supabase
    .from('stremio_tokens')
    .select('id, user_id, token_hash, expires_at')
    .eq('token_hash', await hashToken(token))
    .single();

  if (error || !tokens) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  // Check expiration
  if (new Date(tokens.expires_at) < new Date()) {
    return c.json({ error: 'Token expired' }, 401);
  }

  // Update last_sync
  await supabase
    .from('stremio_tokens')
    .update({ last_sync: new Date().toISOString() })
    .eq('id', tokens.id);

  // Set context
  const ctx: PluginContext = {
    userId: tokens.user_id,
    supabaseUrl,
    supabaseKey,
  };
  
  c.set('pluginContext', ctx);
  
  return next();
}

async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function verifyToken(token: string, supabase: SupabaseClient): Promise<string | null> {
  const tokenHash = await bcrypt.hash(token, 10);
  const { data, error } = await supabase
    .from('stremio_tokens')
    .select('user_id, expires_at')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  
  return data.user_id;
}