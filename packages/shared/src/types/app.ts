// App-specific types (database entities, API responses)

import { MediaType, ListType, ItemStatus, Locale } from './tmdb';

export type { MediaType, ListType, ItemStatus, Locale };

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  locale: Locale;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: ListType;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface ListItem {
  id: string;
  list_id: string;
  tmdb_id: number;
  imdb_id: string | null;
  media_type: MediaType;
  status: ItemStatus;
  rating: number | null;
  notes: string | null;
  added_at: string;
  watched_at: string | null;
  sort_order: number;
  media?: MediaSummary;
}

export interface MediaSummary {
  tmdb_id: number;
  imdb_id: string | null;
  media_type: MediaType;
  title: string;
  original_title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  first_air_date: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  genres?: Genre[];
  runtime: number | null;
  episode_run_time: number[] | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  status: string;
  tagline: string | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface MediaDetail extends MediaSummary {
  genres: Genre[];
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  videos: Video[];
  images: Images;
  credits: Credits;
  external_ids: ExternalIds;
  recommendations: MediaSummary[];
  similar: MediaSummary[];
}

export interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface Video {
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

export interface Images {
  backdrops: Image[];
  logos: Image[];
  posters: Image[];
}

export interface Image {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

export interface Credits {
  cast: Cast[];
  crew: Crew[];
}

export interface Cast {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  cast_id: number;
  character: string;
  credit_id: string;
  order: number;
}

export interface Crew {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  credit_id: string;
  department: string;
  job: string;
}

export interface ExternalIds {
  imdb_id: string | null;
  facebook_id: string | null;
  instagram_id: string | null;
  twitter_id: string | null;
  wikidata_id: string | null;
}

export interface StremioToken {
  id: string;
  user_id: string;
  token_hash: string;
  device_name: string | null;
  last_sync: string | null;
  expires_at: string;
  created_at: string;
}

export interface SyncLog {
  id: number;
  user_id: string | null;
  source: 'app' | 'stremio';
  action: 'create' | 'update' | 'delete';
  entity_type: 'list' | 'list_item';
  entity_id: string;
  created_at: string;
}

export interface TMDBMovieCache {
  id: number;
  media_type: MediaType;
  data_jsonb: MediaDetail;
  expires_at: string;
}

export interface APIResponse<T> {
  data: T | null;
  error: APIError | null;
  meta?: ResponseMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: ResponseMeta;
}

export interface SearchParams {
  query: string;
  page?: number;
  language?: Locale;
  include_adult?: boolean;
  region?: string;
}

export interface DiscoverParams {
  media_type?: MediaType;
  page?: number;
  language?: Locale;
  sort_by?: string;
  with_genres?: string;
  with_keywords?: string;
  'vote_average.gte'?: number;
  'vote_count.gte'?: number;
  'release_date.gte'?: string;
  'release_date.lte'?: string;
  'first_air_date.gte'?: string;
  'first_air_date.lte'?: string;
  with_watch_providers?: string;
  watch_region?: string;
}

export interface CreateListInput {
  name: string;
  description?: string;
  type?: ListType;
  is_public?: boolean;
}

export interface UpdateListInput {
  name?: string;
  description?: string;
  type?: ListType;
  is_public?: boolean;
  sort_order?: number;
}

export interface CreateListItemInput {
  list_id: string;
  tmdb_id: number;
  imdb_id?: string;
  media_type: MediaType;
  status?: ItemStatus;
  rating?: number;
  notes?: string;
}

export interface UpdateListItemInput {
  status?: ItemStatus;
  rating?: number | null;
  notes?: string | null;
  sort_order?: number;
}

export interface StremioManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  logo: string;
  resources: string[];
  types: string[];
  idPrefixes: string[];
  catalogs: StremioCatalog[];
}

export interface StremioCatalog {
  type: string;
  id: string;
  name: string;
}

export interface StremioMeta {
  id: string;
  type: string;
  name: string;
  poster?: string;
  posterShape?: 'regular' | 'square' | 'landscape';
  background?: string;
  logo?: string;
  description?: string;
  releaseInfo?: string;
  director?: string[];
  cast?: string[];
  genres?: string[];
  rating?: number;
  imdbRating?: number;
  trailer?: string;
  videos?: StremioVideo[];
}

export interface StremioVideo {
  id: string;
  title: string;
  season?: number;
  episode?: number;
  released?: string;
  overview?: string;
  thumbnail?: string;
}

export interface StremioStream {
  url: string;
  title?: string;
  behaviorHints?: {
    notWebReady?: boolean;
    bingeGroup?: string;
    filename?: string;
    videoSize?: number;
  };
  subtitles?: StremioSubtitle[];
}

export interface StremioSubtitle {
  id: string;
  url: string;
  language?: string;
}