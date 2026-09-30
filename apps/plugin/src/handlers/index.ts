import { Context } from 'hono';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PluginContext, StremioCatalogResponse, StremioMeta } from '../types';

export async function catalogHandler(c: Context): Promise<Response> {
  const ctx = c.get('pluginContext') as PluginContext;
  const type = c.req.param('type') as 'movie' | 'series';
  const catalogId = c.req.param('id') || '';
  const skip = parseInt(c.req.query('skip') || '0');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 50);

  const supabase = createClient(ctx.supabaseUrl, ctx.supabaseKey);

  // Map catalog ID to list type
  const listTypeMap: Record<string, string> = {
    'trakwatch-watchlist': 'watchlist',
    'trakwatch-watched': 'watched',
    'trakwatch-favorites': 'favorites',
  };

  const listType = listTypeMap[catalogId];
  if (!listType) {
    return c.json({ metas: [] }, 404);
  }

  // Get user's list of this type
  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('type', listType)
    .single();

  if (listError || !list) {
    return c.json({ metas: [] });
  }

  // Get items from list
  const { data: items, error: itemsError } = await supabase
    .from('list_items')
    .select('tmdb_id, imdb_id, media_type')
    .eq('list_id', list.id)
    .eq('media_type', type === 'movie' ? 'movie' : 'tv')
    .range(skip, skip + limit - 1);

  if (itemsError || !items || items.length === 0) {
    return c.json({ metas: [] });
  }

  // Fetch media details from TMDB (could be cached)
  const metas = await Promise.all(
    items.map(async (item) => {
      const meta = await buildStremioMeta(item.tmdb_id, item.media_type, ctx.supabaseUrl, ctx.supabaseKey);
      if (!meta) return null;
      return { ...meta, id: `trakwatch:${item.media_type}:${item.tmdb_id}` };
    })
  );

  return c.json({ metas: metas.filter(Boolean) } as StremioCatalogResponse);
}

export async function metaHandler(c: Context): Promise<Response> {
  const ctx = c.get('pluginContext') as PluginContext;
  const type = c.req.param('type') as 'movie' | 'series';
  const id = c.req.param('id') || '';

  // Parse trakwatch:movie:123
  const parts = id.split(':');
  if (parts.length !== 3 || parts[0] !== 'trakwatch') {
    return c.json({ error: 'Invalid ID format' }, 400);
  }

  const mediaType = parts[1] as 'movie' | 'tv';
  const tmdbId = parseInt(parts[2]);

  const meta = await buildStremioMeta(tmdbId, mediaType, ctx.supabaseUrl, ctx.supabaseKey);
  
  if (!meta) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json({ meta: { ...meta, id: `trakwatch:${mediaType}:${tmdbId}` } });
}

export async function streamHandler(c: Context): Promise<Response> {
  const ctx = c.get('pluginContext') as PluginContext;
  const type = c.req.param('type') as 'movie' | 'series';
  const id = c.req.param('id') || '';

  // Parse trakwatch:movie:123
  const parts = id.split(':');
  if (parts.length !== 3 || parts[0] !== 'trakwatch') {
    return c.json({ streams: [] }, 400);
  }

  // For Stremio plugin, we don't host streams - we delegate to community addons
  // Return empty streams array; Stremio will use its own addon system
  return c.json({ streams: [] });
}

async function buildStremioMeta(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  supabaseUrl: string,
  supabaseKey: string
): Promise<StremioMeta | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check cache first
  const { data: cached } = await supabase
    .from('tmdb_cache')
    .select('data_jsonb')
    .eq('id', tmdbId)
    .eq('media_type', mediaType)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (cached) {
    return mapToStremioMeta(cached.data_jsonb);
  }

  // Fetch from TMDB (in production, this would be an Edge Function call)
  // For now, return minimal meta
  return null;
}

function mapToStremioMeta(detail: any): StremioMeta {
  const isMovie = detail.media_type === 'movie';
  
  return {
    id: `trakwatch:${detail.media_type}:${detail.tmdb_id}`,
    type: detail.media_type,
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
}