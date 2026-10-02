import type { Genre, Image, MediaDetail, MediaSummary, MediaType, Video } from '@/types';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const LOCALE = 'es';

export function isTmdbConfigured(): boolean {
  return Boolean(import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN);
}

function authHeaders(): Record<string, string> {
  const token = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN as string | undefined;
  if (!token) {
    throw new Error(
      'TMDB no está configurado. Define VITE_TMDB_READ_ACCESS_TOKEN en Vercel y redespliega.'
    );
  }
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
}

async function get<T>(endpoint: string, params: Record<string, string> = {}, signal?: AbortSignal): Promise<T> {
  const search = new URLSearchParams({ language: LOCALE, ...params });
  const res = await fetch(`${BASE_URL}${endpoint}?${search}`, {
    headers: authHeaders(),
    signal,
  });
  if (!res.ok) {
    throw new Error(`TMDB error ${res.status} en ${endpoint}`);
  }
  return (await res.json()) as T;
}

interface TMDBVideoRaw {
  iso_639_1: string;
  iso_3166_1: string;
  name: string;
  key: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
  id: string;
}

interface TMDBImageRaw {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

interface TMDBBase {
  id: number;
  overview: string;
  popularity: number;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
}

interface TMDBMovieRaw extends TMDBBase {
  title: string;
  original_title: string;
  release_date: string;
}

interface TMDBTvRaw extends TMDBBase {
  name: string;
  original_name: string;
  first_air_date: string;
}

interface TMDBPersonRaw {
  media_type: 'person';
  id: number;
  name: string;
}

type TMDBMultiItem = (TMDBMovieRaw & { media_type: 'movie' }) | (TMDBTvRaw & { media_type: 'tv' }) | TMDBPersonRaw;

export function posterUrl(path: string | null, size = 'w500'): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function backdropUrl(path: string | null, size = 'w1280'): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function toSummary(item: TMDBMovieRaw | TMDBTvRaw, mediaType: MediaType): MediaSummary {
  const isMovie = mediaType === 'movie';
  const m = item as TMDBMovieRaw;
  const t = item as TMDBTvRaw;
  return {
    tmdb_id: item.id,
    imdb_id: null,
    media_type: mediaType,
    title: isMovie ? m.title : t.name,
    original_title: isMovie ? m.original_title : t.original_name,
    overview: item.overview || null,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: isMovie ? m.release_date || null : null,
    first_air_date: !isMovie ? t.first_air_date || null : null,
    vote_average: Math.round(item.vote_average * 10) / 10,
    vote_count: item.vote_count,
    genre_ids: item.genre_ids || [],
    runtime: null,
    episode_run_time: null,
    number_of_seasons: null,
    number_of_episodes: null,
    status: 'unknown',
    tagline: null,
  };
}

export async function searchMedia(
  query: string,
  page = 1,
  signal?: AbortSignal
): Promise<{ results: MediaSummary[]; total_pages: number; total_results: number }> {
  const data = await get<{ results: TMDBMultiItem[]; total_pages: number; total_results: number }>(
    '/search/multi',
    { query, page: String(page), include_adult: 'false' },
    signal
  );
  const results = data.results
    .filter((r): r is (TMDBMovieRaw & { media_type: 'movie' }) | (TMDBTvRaw & { media_type: 'tv' }) =>
      r.media_type === 'movie' || r.media_type === 'tv'
    )
    .map((r) => toSummary(r, r.media_type));
  return { results, total_pages: data.total_pages, total_results: data.total_results };
}

export async function getTrending(
  mediaType: MediaType,
  timeWindow: 'day' | 'week' = 'week'
): Promise<MediaSummary[]> {
  const data = await get<{ results: (TMDBMovieRaw | TMDBTvRaw)[] }>(`/trending/${mediaType}/${timeWindow}`);
  return data.results.map((r) => toSummary(r, mediaType));
}

export async function discoverMedia(
  mediaType: MediaType,
  params: Record<string, string> = {}
): Promise<MediaSummary[]> {
  const data = await get<{ results: (TMDBMovieRaw | TMDBTvRaw)[] }>(`/discover/${mediaType}`, {
    sort_by: 'popularity.desc',
    ...params,
  });
  return data.results.map((r) => toSummary(r, mediaType));
}

function mapVideos(videos: TMDBVideoRaw[]): Video[] {
  return videos
    .filter((v) => v.site === 'YouTube')
    .map((v) => ({
      iso_639_1: v.iso_639_1,
      iso_3166_1: v.iso_3166_1,
      name: v.name,
      key: v.key,
      site: v.site,
      size: v.size,
      type: v.type,
      official: v.official,
      published_at: v.published_at,
      id: v.id,
    }));
}

export function pickSpanishTrailer(videos: Video[]): Video | null {
  const es = videos.filter((v) => v.site === 'YouTube' && v.iso_639_1 === 'es');
  return (
    es.find((v) => v.type === 'Trailer' && v.official) ||
    es.find((v) => v.type === 'Trailer') ||
    es[0] ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    null
  );
}

function mapImages(images: { backdrops: TMDBImageRaw[]; logos: TMDBImageRaw[]; posters: TMDBImageRaw[] }): {
  backdrops: Image[];
  logos: Image[];
  posters: Image[];
} {
  const map = (list: TMDBImageRaw[]): Image[] =>
    list.map((i) => ({
      aspect_ratio: i.aspect_ratio,
      height: i.height,
      iso_639_1: i.iso_639_1,
      file_path: i.file_path,
      vote_average: i.vote_average,
      vote_count: i.vote_count,
      width: i.width,
    }));
  return { backdrops: map(images.backdrops || []), logos: map(images.logos || []), posters: map(images.posters || []) };
}

export async function getDetails(mediaType: MediaType, id: number): Promise<MediaDetail> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = await get<any>(`/${mediaType}/${id}`, {
    append_to_response: 'videos,images,credits,external_ids,recommendations,similar',
    include_image_language: 'es,null',
  });
  const isMovie = mediaType === 'movie';
  const base = toSummary(d, mediaType);
  return {
    ...base,
    imdb_id: d.imdb_id || d.external_ids?.imdb_id || null,
    genres: (d.genres || []).map((g: { id: number; name: string }) => ({ id: g.id, name: g.name })),
    production_companies: d.production_companies || [],
    production_countries: d.production_countries || [],
    spoken_languages: d.spoken_languages || [],
    runtime: isMovie ? d.runtime ?? null : null,
    episode_run_time: !isMovie ? d.episode_run_time ?? null : null,
    number_of_seasons: !isMovie ? d.number_of_seasons ?? null : null,
    number_of_episodes: !isMovie ? d.number_of_episodes ?? null : null,
    status: d.status || 'unknown',
    tagline: d.tagline || null,
    videos: mapVideos(d.videos?.results || []),
    images: mapImages(d.images || { backdrops: [], logos: [], posters: [] }),
    credits: {
      cast: (d.credits?.cast || []).slice(0, 10),
      crew: d.credits?.crew || [],
    },
    external_ids: {
      imdb_id: d.external_ids?.imdb_id || d.imdb_id || null,
      facebook_id: d.external_ids?.facebook_id || null,
      instagram_id: d.external_ids?.instagram_id || null,
      twitter_id: d.external_ids?.twitter_id || null,
      wikidata_id: null,
    },
    recommendations: ((isMovie ? d.recommendations?.results : d.recommendations?.results) || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => toSummary(r, mediaType)
    ),
    similar: ((d.similar?.results) || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => toSummary(r, mediaType)
    ),
  };
}

export async function getWatchProviders(mediaType: MediaType, id: number): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = await get<any>(`/${mediaType}/${id}/watch/providers`);
  const names = new Set<string>();
  const regions = [d.results?.ES, d.results?.US];
  for (const r of regions) {
    if (!r) continue;
    for (const bucket of [r.flatrate, r.rent, r.buy, r.free, r.ads]) {
      for (const p of bucket || []) {
        if (p?.provider_name) names.add(p.provider_name as string);
      }
    }
  }
  return [...names];
}

const genreCache = new Map<string, Genre[]>();

export async function getGenres(mediaType: MediaType): Promise<Genre[]> {
  const key = mediaType;
  if (genreCache.has(key)) return genreCache.get(key) as Genre[];
  try {
    const d = await get<{ genres: Genre[] }>(`/genre/${mediaType}/list`);
    genreCache.set(key, d.genres);
    return d.genres;
  } catch {
    return [];
  }
}

export function yearOf(m: { release_date?: string | null; first_air_date?: string | null }): number | null {
  const d = m.release_date || m.first_air_date;
  if (!d) return null;
  const y = new Date(d).getFullYear();
  return Number.isNaN(y) ? null : y;
}
