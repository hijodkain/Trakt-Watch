import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface PluginRequest {
  type: 'catalog' | 'meta' | 'stream';
  path: string;
  query: Record<string, string>;
  userId: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('stremio_tokens')
      .select('id, user_id, expires_at')
      .eq('token_hash', await hashToken(token))
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Token expired' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update last sync
    await supabase
      .from('stremio_tokens')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', tokenData.id);

    const userId = tokenData.userId;

    // Route to appropriate handler
    if (path === '/manifest.json') {
      return handleManifest();
    }

    if (path.startsWith('/catalog/')) {
      return handleCatalog(req, url, userId, supabase);
    }

    if (path.startsWith('/meta/')) {
      return handleMeta(req, url, userId, supabase);
    }

    if (path.startsWith('/stream/')) {
      return handleStream(req, url, userId, supabase);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Plugin error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleManifest() {
  const manifest = {
    id: 'com.trakwatch.plugin',
    version: '1.0.0',
    name: 'Trak Watch',
    description: 'Tus listas de Trak Watch sincronizadas en Stremio',
    logo: 'https://trakwatch.vercel.app/logo.png',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie', 'series'],
    idPrefixes: ['trakwatch:'],
    catalogs: [
      { type: 'movie', id: 'trakwatch-watchlist', name: 'Por ver' },
      { type: 'movie', id: 'trakwatch-watched', name: 'Vistas' },
      { type: 'movie', id: 'trakwatch-favorites', name: 'Favoritas' },
      { type: 'series', id: 'trakwatch-watchlist', name: 'Por ver' },
      { type: 'series', id: 'trakwatch-watched', name: 'Vistas' },
      { type: 'series', id: 'trakwatch-favorites', name: 'Favoritas' },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleCatalog(req: Request, url: URL, userId: string, supabase: any) {
  const pathParts = url.pathname.split('/');
  const type = pathParts[2] as 'movie' | 'series';
  const catalogId = pathParts[3]?.replace('.json', '');
  const skip = parseInt(url.searchParams.get('skip') || '0');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 50);

  const listTypeMap: Record<string, string> = {
    'trakwatch-watchlist': 'watchlist',
    'trakwatch-watched': 'watched',
    'trakwatch-favorites': 'favorites',
  };

  const listType = listTypeMap[catalogId];
  if (!listType) {
    return new Response(JSON.stringify({ metas: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: list } = await supabase
    .from('lists')
    .select('id')
    .eq('user_id', userId)
    .eq('type', listType)
    .single();

  if (!list) {
    return new Response(JSON.stringify({ metas: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: items } = await supabase
    .from('list_items')
    .select('tmdb_id, media_type')
    .eq('list_id', list.id)
    .eq('media_type', type === 'movie' ? 'movie' : 'tv')
    .range(skip, skip + limit - 1);

  if (!items || items.length === 0) {
    return new Response(JSON.stringify({ metas: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fetch from TMDB cache
  const metas = await Promise.all(
    items.map(async (item) => {
      const { data: cached } = await supabase
        .from('tmdb_cache')
        .select('data_jsonb')
        .eq('id', item.tmdb_id)
        .eq('media_type', item.media_type)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!cached) return null;

      const detail = cached.data_jsonb;
      return {
        id: `trakwatch:${item.media_type}:${item.tmdb_id}`,
        type: item.media_type,
        name: detail.title,
        poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : undefined,
        posterShape: 'regular',
        year: detail.release_date || detail.first_air_date ? new Date(detail.release_date || detail.first_air_date).getFullYear().toString() : undefined,
        genres: detail.genres?.map((g: any) => g.name) || [],
        rating: detail.vote_average ? Math.round(detail.vote_average * 10) / 10 : undefined,
      };
    })
  );

  return new Response(JSON.stringify({ metas: metas.filter(Boolean) }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleMeta(req: Request, url: URL, userId: string, supabase: any) {
  const pathParts = url.pathname.split('/');
  const id = pathParts[3]?.replace('.json', '');

  const parts = id.split(':');
  if (parts.length !== 3 || parts[0] !== 'trakwatch') {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const mediaType = parts[1] as 'movie' | 'tv';
  const tmdbId = parseInt(parts[2]);

  const { data: cached } = await supabase
    .from('tmdb_cache')
    .select('data_jsonb')
    .eq('id', tmdbId)
    .eq('media_type', mediaType)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!cached) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const detail = cached.data_jsonb;
  const meta = {
    id: `trakwatch:${mediaType}:${tmdbId}`,
    type: mediaType,
    name: detail.title,
    poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : undefined,
    posterShape: 'regular',
    background: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : undefined,
    logo: detail.images?.logos?.[0] ? `https://image.tmdb.org/t/p/w300${detail.images.logos[0].file_path}` : undefined,
    description: detail.overview,
    releaseInfo: detail.release_date || detail.first_air_date ? new Date(detail.release_date || detail.first_air_date).getFullYear().toString() : undefined,
    director: detail.credits?.crew?.filter((c: any) => c.job === 'Director').slice(0, 2).map((c: any) => c.name) || [],
    cast: detail.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [],
    genres: detail.genres?.map((g: any) => g.name) || [],
    rating: detail.vote_average ? Math.round(detail.vote_average * 10) / 10 : undefined,
    imdbRating: detail.vote_average ? Math.round(detail.vote_average * 10) / 10 : undefined,
    trailer: detail.videos?.find((v: any) => v.site === 'YouTube' && v.iso_639_1 === 'es') 
      ? `https://www.youtube.com/watch?v=${detail.videos.find((v: any) => v.site === 'YouTube' && v.iso_639_1 === 'es').key}`
      : undefined,
    videos: detail.videos
      ?.filter((v: any) => v.site === 'YouTube' && v.iso_639_1 === 'es')
      .slice(0, 3)
      .map((v: any, i: number) => ({
        id: String(i),
        title: v.name,
        released: v.published_at,
        overview: v.name,
        thumbnail: `https://img.youtube.com/vi/${v.key}/maxresdefault.jpg`,
      })) || [],
  };

  return new Response(JSON.stringify({ meta }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleStream(req: Request, url: URL, userId: string, supabase: any) {
  // Delegate to Stremio community addons
  return new Response(JSON.stringify({ streams: [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}