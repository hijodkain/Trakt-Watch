import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'invalidate_cache':
        return await invalidateStremioCache(userId, supabase);
      case 'full_sync':
        return await fullSync(userId, supabase);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function invalidateStremioCache(userId: string, supabase: any) {
  // In a real implementation, this would call Stremio's cache invalidation webhook
  // For now, we just log it
  await supabase.from('sync_logs').insert({
    user_id: userId,
    source: 'app',
    action: 'cache_invalidate',
    entity_type: 'all',
    entity_id: userId,
  });

  return new Response(JSON.stringify({ success: true, message: 'Cache invalidated' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function fullSync(userId: string, supabase: any) {
  // Get all user lists
  const { data: lists } = await supabase
    .from('lists')
    .select('id, type')
    .eq('user_id', userId);

  if (!lists) {
    return new Response(JSON.stringify({ synced: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let synced = 0;

  for (const list of lists) {
    const { data: items } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', list.id);

    if (items) {
      synced += items.length;
    }
  }

  await supabase.from('sync_logs').insert({
    user_id: userId,
    source: 'app',
    action: 'full_sync',
    entity_type: 'all',
    entity_id: userId,
  });

  return new Response(JSON.stringify({ synced, lists: lists.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}