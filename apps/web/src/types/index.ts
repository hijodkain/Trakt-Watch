// Local type definitions for web app (to avoid module resolution issues)

export type MediaType = 'movie' | 'tv';
export type ListType = 'watchlist' | 'watched' | 'favorites' | 'custom';
export type ItemStatus = 'to_watch' | 'watching' | 'watched' | 'dropped';
export type Locale = 'es' | 'en' | 'auto';

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
  title?: string;
  release_date?: string | null;
  first_air_date?: string | null;
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