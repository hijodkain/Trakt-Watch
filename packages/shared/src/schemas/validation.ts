import { z } from 'zod';
import type {
  MediaType,
  ListType,
  ItemStatus,
  Locale,
  CreateListInput,
  UpdateListInput,
  CreateListItemInput,
  UpdateListItemInput,
  SearchParams,
  DiscoverParams,
} from '../types';

export const mediaTypeSchema = z.enum(['movie', 'tv']);
export const listTypeSchema = z.enum(['watchlist', 'watched', 'favorites', 'custom']);
export const itemStatusSchema = z.enum(['to_watch', 'watching', 'watched', 'dropped']);
export const localeSchema = z.enum(['es', 'en', 'auto']);

export const createListInputSchema: z.ZodSchema<CreateListInput> = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: listTypeSchema.optional(),
  is_public: z.boolean().optional(),
});

export const updateListInputSchema: z.ZodSchema<UpdateListInput> = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  type: listTypeSchema.optional(),
  is_public: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export const createListItemInputSchema: z.ZodSchema<CreateListItemInput> = z.object({
  list_id: z.string().uuid(),
  tmdb_id: z.number().int().positive(),
  imdb_id: z.string().regex(/^tt\d{7,8}$/).optional(),
  media_type: mediaTypeSchema,
  status: itemStatusSchema.optional(),
  rating: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateListItemInputSchema: z.ZodSchema<UpdateListItemInput> = z.object({
  status: itemStatusSchema.optional(),
  rating: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  sort_order: z.number().int().optional(),
});

export const searchParamsSchema: z.ZodSchema<SearchParams> = z.object({
  query: z.string().min(1).max(200),
  page: z.number().int().positive().optional().default(1),
  language: localeSchema.optional().default('es'),
  include_adult: z.boolean().optional().default(false),
  region: z.string().length(2).optional(),
});

export const discoverParamsSchema: z.ZodSchema<DiscoverParams> = z.object({
  media_type: mediaTypeSchema.optional(),
  page: z.number().int().positive().optional().default(1),
  language: localeSchema.optional().default('es'),
  sort_by: z.string().optional(),
  with_genres: z.string().optional(),
  with_keywords: z.string().optional(),
  'vote_average.gte': z.number().min(0).max(10).optional(),
  'vote_count.gte': z.number().int().positive().optional(),
  'release_date.gte': z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  'release_date.lte': z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  'first_air_date.gte': z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  'first_air_date.lte': z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  with_watch_providers: z.string().optional(),
  watch_region: z.string().length(2).optional(),
});

export const uuidSchema = z.string().uuid();
export const positiveIntSchema = z.number().int().positive();
export const ratingSchema = z.number().int().min(1).max(10);
export const imdbIdSchema = z.string().regex(/^tt\d{7,8}$/);
export const tmdbIdSchema = z.number().int().positive();

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      page: z.number().int().positive(),
      per_page: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      total_pages: z.number().int().nonnegative(),
    }),
  });

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.nullable(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.unknown()).optional(),
      })
      .nullable(),
    meta: z
      .object({
        page: z.number().int().positive().optional(),
        per_page: z.number().int().positive().optional(),
        total: z.number().int().nonnegative().optional(),
        total_pages: z.number().int().nonnegative().optional(),
      })
      .optional(),
  });

export const stremioManifestSchema = z.object({
  id: z.string(),
  version: z.string(),
  name: z.string(),
  description: z.string(),
  logo: z.string().url(),
  resources: z.array(z.string()),
  types: z.array(z.string()),
  idPrefixes: z.array(z.string()),
  catalogs: z.array(
    z.object({
      type: z.string(),
      id: z.string(),
      name: z.string(),
    })
  ),
});

export const stremioMetaSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  poster: z.string().url().optional(),
  posterShape: z.enum(['regular', 'square', 'landscape']).optional(),
  background: z.string().url().optional(),
  logo: z.string().url().optional(),
  description: z.string().optional(),
  releaseInfo: z.string().optional(),
  director: z.array(z.string()).optional(),
  cast: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  rating: z.number().min(0).max(10).optional(),
  imdbRating: z.number().min(0).max(10).optional(),
  trailer: z.string().url().optional(),
  videos: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        season: z.number().int().optional(),
        episode: z.number().int().optional(),
        released: z.string().optional(),
        overview: z.string().optional(),
        thumbnail: z.string().url().optional(),
      })
    )
    .optional(),
});

export const stremioStreamSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  behaviorHints: z
    .object({
      notWebReady: z.boolean().optional(),
      bingeGroup: z.string().optional(),
      filename: z.string().optional(),
      videoSize: z.number().int().positive().optional(),
    })
    .optional(),
  subtitles: z
    .array(
      z.object({
        id: z.string(),
        url: z.string().url(),
        language: z.string().optional(),
      })
    )
    .optional(),
});