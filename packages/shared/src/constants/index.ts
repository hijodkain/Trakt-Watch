// Constants and configuration

export const APP_NAME = 'Trak Watch';
export const APP_DESCRIPTION = 'Tus listas de series y películas, sincronizadas con Stremio';
export const APP_URL = 'https://trakwatch.vercel.app';

export const STREMIO_PLUGIN_ID = 'com.trakwatch.plugin';
export const STREMIO_PLUGIN_VERSION = '1.0.0';
export const STREMIO_ID_PREFIX = 'trakwatch:';

export const DEFAULT_LOCALE = 'es';
export const SUPPORTED_LOCALES = ['es', 'en'] as const;

export const LIST_TYPES = ['watchlist', 'watched', 'favorites', 'custom'] as const;
export const ITEM_STATUSES = ['to_watch', 'watching', 'watched', 'dropped'] as const;

export const TMDB_CONFIG = {
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  DEFAULT_LANGUAGE: 'es',
  INCLUDE_IMAGE_LANGUAGE: 'es,null',
  RATE_LIMIT: 40, // requests per second
  CACHE_TTL: {
    DETAILS: 24 * 60 * 60 * 1000, // 24 hours
    IMAGES: 7 * 24 * 60 * 60 * 1000, // 7 days
    SEARCH: 5 * 60 * 1000, // 5 minutes
    TRENDING: 60 * 60 * 1000, // 1 hour
  },
};

export const POSTER_SIZES = {
  THUMB: 'w92',
  SMALL: 'w154',
  MEDIUM: 'w185',
  LARGE: 'w342',
  XL: 'w500',
  XXL: 'w780',
  ORIGINAL: 'original',
} as const;

export const BACKDROP_SIZES = {
  SMALL: 'w300',
  MEDIUM: 'w780',
  LARGE: 'w1280',
  ORIGINAL: 'original',
} as const;

export const YOUTUBE_EMBED_URL = 'https://www.youtube.com/embed/';

export const STREMO_MANIFEST_CATALOGS = [
  { type: 'movie', id: 'trakwatch-watchlist', name: 'Por ver' },
  { type: 'movie', id: 'trakwatch-watched', name: 'Vistas' },
  { type: 'movie', id: 'trakwatch-favorites', name: 'Favoritas' },
  { type: 'series', id: 'trakwatch-watchlist', name: 'Por ver' },
  { type: 'series', id: 'trakwatch-watched', name: 'Vistas' },
  { type: 'series', id: 'trakwatch-favorites', name: 'Favoritas' },
] as const;

export const QUERY_KEYS = {
  auth: {
    user: ['auth', 'user'],
    profile: ['auth', 'profile'],
  },
  lists: {
    all: ['lists'],
    detail: (id: string) => ['lists', id],
    items: (listId: string) => ['lists', listId, 'items'],
    public: (userId: string) => ['lists', 'public', userId],
  },
  media: {
    trending: (type: string, window: string) => ['media', 'trending', type, window],
    discover: (type: string, params: Record<string, unknown>) => ['media', 'discover', type, params],
    search: (query: string, page: number) => ['media', 'search', query, page],
    detail: (type: string, id: number) => ['media', 'detail', type, id],
    videos: (type: string, id: number) => ['media', 'videos', type, id],
    images: (type: string, id: number) => ['media', 'images', type, id],
    genres: (type: string) => ['media', 'genres', type],
  },
  sync: {
    state: ['sync', 'state'],
    logs: ['sync', 'logs'],
  },
  stremio: {
    token: ['stremio', 'token'],
    manifest: ['stremio', 'manifest'],
  },
} as const;

export const STORAGE_KEYS = {
  searchHistory: 'trakwatch:searchHistory',
  theme: 'trakwatch:theme',
  onboardingComplete: 'trakwatch:onboardingComplete',
  lastListView: 'trakwatch:lastListView',
} as const;

export const ROUTES = {
  home: '/',
  search: '/search',
  media: (type: string, id: number) => `/media/${type}/${id}`,
  lists: '/lists',
  listNew: '/lists/new',
  listDetail: (id: string) => `/lists/${id}`,
  profile: '/profile',
  settings: '/settings',
  stremio: '/stremio',
  auth: {
    login: '/auth/login',
    callback: '/auth/callback',
  },
} as const;

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/v1/token?grant_type=password',
    signup: '/auth/v1/signup',
    logout: '/auth/v1/logout',
    user: '/auth/v1/user',
  },
  lists: '/rest/v1/lists',
  listItems: '/rest/v1/list_items',
  profiles: '/rest/v1/profiles',
  tmdbCache: '/rest/v1/tmdb_cache',
  stremioTokens: '/rest/v1/stremio_tokens',
  syncLogs: '/rest/v1/sync_logs',
} as const;

export const EDGE_FUNCTIONS = {
  plugin: '/functions/v1/plugin',
  webhook: '/functions/v1/webhook',
  sync: '/functions/v1/sync',
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  TMDB_ERROR: 'TMDB_ERROR',
  SYNC_ERROR: 'SYNC_ERROR',
  STREMIO_ERROR: 'STREMIO_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;