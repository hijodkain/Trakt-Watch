// Core types for Trak Watch

export type MediaType = 'movie' | 'tv';

export type ListType = 'watchlist' | 'watched' | 'favorites' | 'custom';

export type ItemStatus = 'to_watch' | 'watching' | 'watched' | 'dropped';

export type Locale = 'es' | 'en' | 'auto';

export interface TMDBConfig {
  apiKey: string;
  readAccessToken: string;
  baseUrl: string;
  imageBaseUrl: string;
  locale: Locale;
}

export interface TMDBImageConfig {
  base_url: string;
  secure_base_url: string;
  backdrop_sizes: string[];
  logo_sizes: string[];
  poster_sizes: string[];
  profile_sizes: string[];
  still_sizes: string[];
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TMDBProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface TMDBSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TMDBVideo {
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

export interface TMDBImage {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

export interface TMDBMovie {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface TMDBTV {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  origin_country: string[];
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  first_air_date: string;
  name: string;
  vote_average: number;
  vote_count: number;
}

export interface TMDBMovieDetails extends TMDBMovie {
  belongs_to_collection: TMDBCollection | null;
  budget: number;
  genres: TMDBGenre[];
  homepage: string | null;
  imdb_id: string | null;
  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];
  revenue: number;
  runtime: number | null;
  spoken_languages: TMDBSpokenLanguage[];
  status: string;
  tagline: string | null;
  videos: { results: TMDBVideo[] };
  images: { backdrops: TMDBImage[]; logos: TMDBImage[]; posters: TMDBImage[] };
  credits: { cast: TMDBCast[]; crew: TMDBCrew[] };
  external_ids: TMDBExternalIds;
  recommendations: { results: TMDBMovie[] };
  similar: { results: TMDBMovie[] };
}

export interface TMDBTVDetails extends TMDBTV {
  created_by: TMDBCreator[];
  episode_run_time: number[];
  genres: TMDBGenre[];
  homepage: string | null;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  networks: TMDBNetwork[];
  number_of_episodes: number;
  number_of_seasons: number;
  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];
  seasons: TMDBSeason[];
  spoken_languages: TMDBSpokenLanguage[];
  status: string;
  tagline: string | null;
  type: string;
  videos: { results: TMDBVideo[] };
  images: { backdrops: TMDBImage[]; logos: TMDBImage[]; posters: TMDBImage[] };
  credits: { cast: TMDBCast[]; crew: TMDBCrew[] };
  external_ids: TMDBExternalIds;
  recommendations: { results: TMDBTV[] };
  similar: { results: TMDBTV[] };
}

export interface TMDBCollection {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface TMDBCast {
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

export interface TMDBCrew {
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

export interface TMDBCreator {
  id: number;
  credit_id: string;
  name: string;
  gender: number;
  profile_path: string | null;
}

export interface TMDBNetwork {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TMDBSeason {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

export interface TMDBExternalIds {
  imdb_id: string | null;
  facebook_id: string | null;
  instagram_id: string | null;
  twitter_id: string | null;
  wikidata_id: string | null;
}

export interface TMDBSearchResult {
  page: number;
  results: (TMDBMovie | TMDBTV | TMDBPerson)[];
  total_pages: number;
  total_results: number;
}

export interface TMDBPerson {
  adult: boolean;
  gender: number;
  id: number;
  known_for: (TMDBMovie | TMDBTV)[];
  known_for_department: string;
  name: string;
  popularity: number;
  profile_path: string | null;
}

export interface TMDBTrending {
  page: number;
  results: (TMDBMovie | TMDBTV)[];
  total_pages: number;
  total_results: number;
}

export interface TMDBCredits {
  cast: TMDBCast[];
  crew: TMDBCrew[];
}

export interface TMDBImages {
  backdrops: TMDBImage[];
  logos: TMDBImage[];
  posters: TMDBImage[];
}

export interface TMDBVideos {
  results: TMDBVideo[];
}