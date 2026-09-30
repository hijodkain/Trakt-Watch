export interface StremioCatalog {
  type: string;
  id: string;
  name: string;
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

export interface StremioCatalogResponse {
  metas: StremioMeta[];
}

export interface StremioMetaResponse {
  meta: StremioMeta;
}

export interface StremioStreamResponse {
  streams: StremioStream[];
}

export interface PluginContext {
  userId: string;
  supabaseUrl: string;
  supabaseKey: string;
}