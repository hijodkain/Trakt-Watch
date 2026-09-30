import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface WebhookPayload {
  event: 'list_item_added' | 'list_item_removed' | 'list_item_updated' | 'playback_started';
  user_id: string;
  media: {
    type: 'movie' | 'series';
    tmdb_id: number;
    imdb_id?: string;
  };
  list_type?: 'watchlist' | 'watched' | 'favorites';
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify webhook signature
    const signature = req.headers.get('X-Stremio-Signature');
    const webhookSecret = Deno.env.get('STREMIO_WEBHOOK_SECRET');
    
    if (webhookSecret && signature) {
      const body = await req.text();
      const valid = await verifySignature(body, signature, webhookSecret);
      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const payload: WebhookPayload = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log sync event
    await supabase.from('sync_logs').insert({
      user_id: payload.user_id,
      source: 'stremio',
      action: payload.event.replace('list_item_', '').replace('playback_started', 'play'),
      entity_type: 'list_item',
      entity_id: `trakwatch:${payload.media.type}:${payload.media.tmdb_id}`,
    });

    // Handle playback started -> mark as watched
    if (payload.event === 'playback_started') {
      await handlePlaybackStarted(payload, supabase);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handlePlaybackStarted(payload: WebhookPayload, supabase: any) {
  const { user_id, media } = payload;

  // Find the list item in user's "watchlist" or "watched" lists
  const { data: lists } = await supabase
    .from('lists')
    .select('id')
    .eq('user_id', user_id)
    .in('type', ['watchlist', 'watched']);

  if (!lists || lists.length === 0) return;

  const listIds = lists.map(l => l.id);

  // Find matching item
  const { data: items } = await supabase
    .from('list_items')
    .select('id, status, list_id')
    .in('list_id', listIds)
    .eq('tmdb_id', media.tmdb_id)
    .eq('media_type', media.type === 'movie' ? 'movie' : 'tv');

  if (!items || items.length === 0) return;

  // Update status to 'watched' if not already
  for (const item of items) {
    if (item.status !== 'watched') {
      await supabase
        .from('list_items')
        .update({ 
          status: 'watched',
          watched_at: new Date().toISOString(),
        })
        .eq('id', item.id);
    }
  }
}

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const sigBuffer = Uint8Array.from(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  return crypto.subtle.verify('HMAC', key, sigBuffer, encoder.encode(body));
}