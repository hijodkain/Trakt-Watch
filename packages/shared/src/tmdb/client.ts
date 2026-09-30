// TMDB API Client with caching, rate limiting, and Spanish locale support

import type {
  TMDBConfig,
  TMDBMovie,
  TMDBTV,
  TMDBMovieDetails,
  TMDBTVDetails,
  TMDBVideo,
  TMDBImage,
  TMDBSearchResult,
  TMDBTrending,
  TMDBGenre,
  TMDBExternalIds,
  TMDBCast,
  TMDBCrew,
} from '../types/tmdb';
import type { MediaType, MediaDetail, MediaSummary, Genre, Video, Image, Credits, ExternalIds } from '../types/app';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const DEFAULT_LOCALE = 'es';

class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(maxTokens = 40, refillRate = 40) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const waitTime = (1 - this.tokens) / this.refillRate * 1000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return this.acquire();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}

class TMDBClient {
  private config: TMDBConfig;
  private rateLimiter: RateLimiter;
  private cache: Map<string, { data: unknown; expires: number }> = new Map();

  constructor(config: TMDBConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || TMDB_BASE_URL,
      imageBaseUrl: config.imageBaseUrl || TMDB_IMAGE_BASE_URL,
      locale: config.locale || DEFAULT_LOCALE,
    };
    this.rateLimiter = new RateLimiter();
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    await this.rateLimiter.acquire();

    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }

    const searchParams = new URLSearchParams({
      api_key: this.config.apiKey,
      language: this.config.locale,
      ...params,
    });

    const response = await fetch(`${this.config.baseUrl}${endpoint}?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${this.config.readAccessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = errorData as Record<string, unknown>;
      throw new TMDBError(
        (error.status_message as string) || `TMDB API error: ${response.status}`,
        response.status,
        error
      );
    }

    const data = await response.json() as T;

    // Cache for 5 minutes by default
    this.cache.set(cacheKey, { data, expires: Date.now() + 5 * 60 * 1000 });

    return data;
  }

  private getImageUrl(path: string | null, size: string = 'w500'): string | null {
    if (!path) return null;
    return `${this.config.imageBaseUrl}/${size}${path}`;
  }

  private mapGenres(genres: TMDBGenre[]): Genre[] {
    return genres.map(g => ({ id: g.id, name: g.name }));
  }

  private mapVideos(videos: TMDBVideo[]): Video[] {
    return videos
      .filter(v => v.site === 'YouTube' && v.iso_639_1 === 'es')
      .map(v => ({
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

  private mapImages(images: { backdrops: TMDBImage[]; logos: TMDBImage[]; posters: TMDBImage[] }): {
    backdrops: Image[];
    logos: Image[];
    posters: Image[];
  } {
    return {
      backdrops: images.backdrops.map(this.mapImage),
      logos: images.logos.map(this.mapImage),
      posters: images.posters.map(this.mapImage),
    };
  }

  private mapImage(img: TMDBImage): Image {
    return {
      aspect_ratio: img.aspect_ratio,
      height: img.height,
      iso_639_1: img.iso_639_1,
      file_path: img.file_path,
      vote_average: img.vote_average,
      vote_count: img.vote_count,
      width: img.width,
    };
  }

  private mapCredits(credits: { cast: TMDBCast[]; crew: TMDBCrew[] }): Credits {
    return {
      cast: credits.cast.map(c => ({
        adult: c.adult,
        gender: c.gender,
        id: c.id,
        known_for_department: c.known_for_department,
        name: c.name,
        original_name: c.original_name,
        popularity: c.popularity,
        profile_path: c.profile_path,
        cast_id: c.cast_id,
        character: c.character,
        credit_id: c.credit_id,
        order: c.order,
      })),
      crew: credits.crew.map(c => ({
        adult: c.adult,
        gender: c.gender,
        id: c.id,
        known_for_department: c.known_for_department,
        name: c.name,
        original_name: c.original_name,
        popularity: c.popularity,
        profile_path: c.profile_path,
        credit_id: c.credit_id,
        department: c.department,
        job: c.job,
      })),
    };
  }

  private mapExternalIds(ids: TMDBExternalIds): ExternalIds {
    return {
      imdb_id: ids.imdb_id,
      facebook_id: ids.facebook_id,
      instagram_id: ids.instagram_id,
      twitter_id: ids.twitter_id,
      wikidata_id: ids.wikidata_id,
    };
  }

  private mapMovieSummary(movie: TMDBMovie): MediaSummary {
    return {
      tmdb_id: movie.id,
      imdb_id: null,
      media_type: 'movie',
      title: movie.title,
      original_title: movie.original_title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: movie.release_date,
      first_air_date: null,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      genre_ids: movie.genre_ids,
      runtime: null,
      episode_run_time: null,
      number_of_seasons: null,
      number_of_episodes: null,
      status: 'released',
      tagline: null,
    };
  }

  private mapTVSummary(tv: TMDBTV): MediaSummary {
    return {
      tmdb_id: tv.id,
      imdb_id: null,
      media_type: 'tv',
      title: tv.name,
      original_title: tv.original_name,
      overview: tv.overview,
      poster_path: tv.poster_path,
      backdrop_path: tv.backdrop_path,
      release_date: null,
      first_air_date: tv.first_air_date,
      vote_average: tv.vote_average,
      vote_count: tv.vote_count,
      genre_ids: tv.genre_ids,
      runtime: null,
      episode_run_time: null,
      number_of_seasons: null,
      number_of_episodes: null,
      status: 'unknown',
      tagline: null,
    };
  }

  private mapMovieDetail(detail: TMDBMovieDetails): MediaDetail {
    const base = this.mapMovieSummary(detail);
    return {
      ...base,
      imdb_id: detail.imdb_id,
      genres: this.mapGenres(detail.genres),
      production_companies: detail.production_companies.map(c => ({
        id: c.id,
        logo_path: c.logo_path,
        name: c.name,
        origin_country: c.origin_country,
      })),
      production_countries: detail.production_countries.map(c => ({
        iso_3166_1: c.iso_3166_1,
        name: c.name,
      })),
      spoken_languages: detail.spoken_languages.map(l => ({
        english_name: l.english_name,
        iso_639_1: l.iso_639_1,
        name: l.name,
      })),
      runtime: detail.runtime,
      videos: this.mapVideos(detail.videos.results),
      images: this.mapImages(detail.images),
      credits: this.mapCredits(detail.credits),
      external_ids: this.mapExternalIds(detail.external_ids),
      recommendations: detail.recommendations.results.map(this.mapMovieSummary),
      similar: detail.similar.results.map(this.mapMovieSummary),
    };
  }

  private mapTVDetail(detail: TMDBTVDetails): MediaDetail {
    const base = this.mapTVSummary(detail);
    return {
      ...base,
      imdb_id: detail.external_ids.imdb_id,
      genres: this.mapGenres(detail.genres),
      production_companies: detail.production_companies.map(c => ({
        id: c.id,
        logo_path: c.logo_path,
        name: c.name,
        origin_country: c.origin_country,
      })),
      production_countries: detail.production_countries.map(c => ({
        iso_3166_1: c.iso_3166_1,
        name: c.name,
      })),
      spoken_languages: detail.spoken_languages.map(l => ({
        english_name: l.english_name,
        iso_639_1: l.iso_639_1,
        name: l.name,
      })),
      episode_run_time: detail.episode_run_time,
      number_of_seasons: detail.number_of_seasons,
      number_of_episodes: detail.number_of_episodes,
      videos: this.mapVideos(detail.videos.results),
      images: this.mapImages(detail.images),
      credits: this.mapCredits(detail.credits),
      external_ids: this.mapExternalIds(detail.external_ids),
      recommendations: detail.recommendations.results.map(this.mapTVSummary),
      similar: detail.similar.results.map(this.mapTVSummary),
    };
  }

  // Public API methods

  async searchMulti(query: string, page = 1): Promise<TMDBSearchResult> {
    return this.fetch<TMDBSearchResult>('/search/multi', {
      query,
      page: String(page),
      include_adult: 'false',
    });
  }

  async searchMovies(query: string, page = 1): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    return this.fetch('/search/movie', { query, page: String(page), include_adult: 'false' });
  }

  async searchTV(query: string, page = 1): Promise<{ results: TMDBTV[]; total_pages: number; total_results: number }> {
    return this.fetch('/search/tv', { query, page: String(page), include_adult: 'false' });
  }

  async getTrending(mediaType: MediaType = 'movie', timeWindow: 'day' | 'week' = 'week'): Promise<TMDBTrending> {
    return this.fetch<TMDBTrending>(`/trending/${mediaType}/${timeWindow}`);
  }

  async getMovieDetails(id: number): Promise<MediaDetail> {
    const data = await this.fetch<TMDBMovieDetails>(`/movie/${id}`, {
      append_to_response: 'videos,images,credits,external_ids,recommendations,similar',
      include_image_language: 'es,null',
    });
    return this.mapMovieDetail(data);
  }

  async getTVDetails(id: number): Promise<MediaDetail> {
    const data = await this.fetch<TMDBTVDetails>(`/tv/${id}`, {
      append_to_response: 'videos,images,credits,external_ids,recommendations,similar',
      include_image_language: 'es,null',
    });
    return this.mapTVDetail(data);
  }

  async getMediaDetails(type: MediaType, id: number): Promise<MediaDetail> {
    return type === 'movie' ? this.getMovieDetails(id) : this.getTVDetails(id);
  }

  async getMovieVideos(id: number): Promise<Video[]> {
    const data = await this.fetch<{ results: TMDBVideo[] }>(`/movie/${id}/videos`, {
      include_video_language: 'es,null',
    });
    return this.mapVideos(data.results);
  }

  async getTVVideos(id: number): Promise<Video[]> {
    const data = await this.fetch<{ results: TMDBVideo[] }>(`/tv/${id}/videos`, {
      include_video_language: 'es,null',
    });
    return this.mapVideos(data.results);
  }

  async getMovieImages(id: number): Promise<{ backdrops: Image[]; logos: Image[]; posters: Image[] }> {
    const data = await this.fetch<{ backdrops: TMDBImage[]; logos: TMDBImage[]; posters: TMDBImage[] }>(
      `/movie/${id}/images`,
      { include_image_language: 'es,null' }
    );
    return this.mapImages(data);
  }

  async getTVImages(id: number): Promise<{ backdrops: Image[]; logos: Image[]; posters: Image[] }> {
    const data = await this.fetch<{ backdrops: TMDBImage[]; logos: TMDBImage[]; posters: TMDBImage[] }>(
      `/tv/${id}/images`,
      { include_image_language: 'es,null' }
    );
    return this.mapImages(data);
  }

  async getGenres(mediaType: MediaType): Promise<Genre[]> {
    const data = await this.fetch<{ genres: TMDBGenre[] }>(`/genre/${mediaType}/list`);
    return this.mapGenres(data.genres);
  }

  async discoverMovies(params: Record<string, string> = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    return this.fetch('/discover/movie', params);
  }

  async discoverTV(params: Record<string, string> = {}): Promise<{ results: TMDBTV[]; total_pages: number; total_results: number }> {
    return this.fetch('/discover/tv', params);
  }

  async getExternalIds(type: MediaType, id: number): Promise<ExternalIds> {
    const data = await this.fetch<TMDBExternalIds>(`/${type}/${id}/external_ids`);
    return this.mapExternalIds(data);
  }

  getPosterUrl(path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
    return this.getImageUrl(path, size);
  }

  getBackdropUrl(path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
    return this.getImageUrl(path, size);
  }

  getProfileUrl(path: string | null, size: 'w45' | 'w185' | 'h632' | 'original' = 'w185'): string | null {
    return this.getImageUrl(path, size);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export class TMDBError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TMDBError';
  }
}

let clientInstance: TMDBClient | null = null;

export function createTMDBClient(config: TMDBConfig): TMDBClient {
  clientInstance = new TMDBClient(config);
  return clientInstance;
}

export function getTMDBClient(): TMDBClient {
  if (!clientInstance) {
    throw new Error('TMDBClient not initialized. Call createTMDBClient first.');
  }
  return clientInstance;
}

export { TMDBClient };