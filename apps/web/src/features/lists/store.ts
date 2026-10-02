import { create } from 'zustand';
import type { ItemStatus, ListItem, ListType, MediaSummary, MediaType } from '@/types';
import { appendSyncEvent } from '@/features/sync/outbox';
import { yearOf } from '@/lib/tmdb';

export type ListMedia = 'movie' | 'tv' | 'mixed';

export interface MediaList {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: ListType;
  kind: 'system' | 'custom';
  media: ListMedia;
  presetProviders?: string[];
  presetGenres?: number[];
  sortOrder: number;
  createdAt: string;
}

export interface ListFilters {
  text?: string;
  mediaType?: MediaType | 'all';
  providers?: string[];
  genres?: number[];
  yearFrom?: number | null;
  yearTo?: number | null;
  minRating?: number | null;
}

const STORAGE_KEY = 'trakwatch:lists:v1';

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function seedLists(): MediaList[] {
  const now = new Date().toISOString();
  const defs: Array<Omit<MediaList, 'id' | 'createdAt'>> = [
    { slug: 'pendientes', name: 'Pendientes', description: 'Para ver más tarde', type: 'pendientes', kind: 'system', media: 'mixed', sortOrder: 1 },
    { slug: 'favoritas', name: 'Favoritas', description: 'Mis favoritas', type: 'favoritas', kind: 'system', media: 'mixed', sortOrder: 2 },
    { slug: 'siguiendo', name: 'Siguiendo', description: 'Series y sagas que sigo', type: 'siguiendo', kind: 'system', media: 'mixed', sortOrder: 3 },
    { slug: 'seguir-viendo', name: 'Seguir viendo', description: 'Empezadas sin terminar', type: 'seguir-viendo', kind: 'system', media: 'mixed', sortOrder: 4 },
    { slug: 'documentales', name: 'Documentales', description: 'Docs de pelis y series', type: 'custom', kind: 'custom', media: 'mixed', presetGenres: [99], sortOrder: 5 },
    { slug: 'apple-tv-plus', name: 'Apple TV+', description: 'Disponibles en Apple TV+', type: 'custom', kind: 'custom', media: 'mixed', presetProviders: ['Apple TV Plus', 'Apple TV+'], sortOrder: 6 },
    { slug: 'hbo-max', name: 'HBO Max', description: 'Disponibles en HBO Max', type: 'custom', kind: 'custom', media: 'mixed', presetProviders: ['Max', 'HBO Max', 'HBO'], sortOrder: 7 },
  ];
  return defs.map((d) => ({ ...d, id: uid(), createdAt: now }));
}

function load(): { lists: MediaList[]; items: ListItem[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lists: MediaList[]; items: ListItem[] };
    if (!Array.isArray(parsed.lists)) return null;
    return { lists: parsed.lists, items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch {
    return null;
  }
}

function persist(lists: MediaList[], items: ListItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lists, items }));
  } catch {
    // sin almacenamiento: la app sigue funcionando en memoria
  }
}

const STATUSES: ItemStatus[] = ['pendientes', 'favoritas', 'siguiendo', 'seguir-viendo', 'vistas'];

function statusForList(list: MediaList): ItemStatus {
  return (STATUSES as string[]).includes(list.slug) ? (list.slug as ItemStatus) : 'pendientes';
}

export interface AddItemInput {
  media: MediaSummary;
  imdbId?: string | null;
  providers?: string[];
  status?: ItemStatus;
  rating?: number;
  notes?: string;
}

interface ListsState {
  lists: MediaList[];
  items: ListItem[];
  createList: (input: { name: string; description?: string; media?: ListMedia }) => MediaList;
  renameList: (id: string, input: { name?: string; description?: string | null }) => void;
  deleteList: (id: string) => void;
  addItem: (listId: string, input: AddItemInput) => ListItem | null;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, input: Partial<Pick<ListItem, 'status' | 'rating' | 'notes'>>) => void;
  reorderItems: (listId: string, itemIds: string[]) => void;
  itemsOf: (listId: string) => ListItem[];
  filteredItems: (listId: string, filters: ListFilters) => ListItem[];
  exportJson: () => string;
  importJson: (json: string) => { imported: number; errors: string[] };
}

const initial = load();

export const useLists = create<ListsState>()((set, get) => {
  const seed = initial || { lists: seedLists(), items: [] };

  function save(lists: MediaList[], items: ListItem[]) {
    persist(lists, items);
    set({ lists, items });
  }

  return {
    lists: seed.lists,
    items: seed.items,

    createList: (input) => {
      const { lists, items } = get();
      const base = slugify(input.name) || `lista-${Date.now()}`;
      let slug = base;
      let n = 2;
      while (lists.some((l) => l.slug === slug)) slug = `${base}-${n++}`;
      const list: MediaList = {
        id: uid(),
        slug,
        name: input.name.slice(0, 100),
        description: input.description?.slice(0, 500) || null,
        type: 'custom',
        kind: 'custom',
        media: input.media || 'mixed',
        sortOrder: lists.length + 1,
        createdAt: new Date().toISOString(),
      };
      save([...lists, list], items);
      return list;
    },

    renameList: (id, input) => {
      const { lists, items } = get();
      save(
        lists.map((l) =>
          l.id === id
            ? {
                ...l,
                name: input.name !== undefined ? input.name.slice(0, 100) : l.name,
                description: input.description !== undefined ? input.description : l.description,
              }
            : l
        ),
        items
      );
    },

    deleteList: (id) => {
      const { lists, items } = get();
      save(
        lists.filter((l) => l.id !== id),
        items.filter((i) => i.list_id !== id)
      );
    },

    addItem: (listId, input) => {
      const { lists, items } = get();
      const list = lists.find((l) => l.id === listId);
      if (!list) return null;
      const { media } = input;
      const exists = items.find(
        (i) => i.list_id === listId && i.tmdb_id === media.tmdb_id && i.media_type === media.media_type
      );
      if (exists) return exists;
      const status = input.status || statusForList(list);
      const now = new Date().toISOString();
      const item: ListItem = {
        id: uid(),
        list_id: listId,
        tmdb_id: media.tmdb_id,
        imdb_id: input.imdbId ?? media.imdb_id ?? null,
        media_type: media.media_type,
        status,
        rating: input.rating ?? null,
        notes: input.notes ?? null,
        added_at: now,
        watched_at: status === 'vistas' ? now : null,
        sort_order: items.filter((i) => i.list_id === listId).length,
        title: media.title,
        original_title: media.original_title,
        overview: media.overview,
        poster_path: media.poster_path,
        backdrop_path: media.backdrop_path,
        release_date: media.release_date,
        first_air_date: media.first_air_date,
        vote_average: media.vote_average,
        genre_ids: media.genre_ids,
        genres: media.genres,
        providers: input.providers ?? [],
      };
      appendSyncEvent({
        event: 'item_added',
        list_slug: list.slug,
        media: { type: media.media_type, tmdb_id: media.tmdb_id, imdb_id: item.imdb_id },
      });
      save(lists, [...items, item]);
      return item;
    },

    removeItem: (itemId) => {
      const { lists, items } = get();
      const item = items.find((i) => i.id === itemId);
      if (item) {
        const list = lists.find((l) => l.id === item.list_id);
        appendSyncEvent({
          event: 'item_removed',
          list_slug: list?.slug || 'custom',
          media: { type: item.media_type, tmdb_id: item.tmdb_id, imdb_id: item.imdb_id },
        });
      }
      save(
        lists,
        items.filter((i) => i.id !== itemId)
      );
    },

    updateItem: (itemId, input) => {
      const { lists, items } = get();
      const prev = items.find((i) => i.id === itemId);
      const next = items.map((i) => {
        if (i.id !== itemId) return i;
        const status = input.status ?? i.status;
        return {
          ...i,
          ...input,
          status,
          watched_at: status === 'vistas' ? i.watched_at || new Date().toISOString() : null,
        };
      });
      if (prev && input.status && input.status !== prev.status) {
        const list = lists.find((l) => l.id === prev.list_id);
        appendSyncEvent({
          event: 'status_changed',
          list_slug: list?.slug || 'custom',
          media: { type: prev.media_type, tmdb_id: prev.tmdb_id, imdb_id: prev.imdb_id },
        });
      }
      save(lists, next);
    },

    reorderItems: (listId, itemIds) => {
      const { lists, items } = get();
      const order = new Map(itemIds.map((id, idx) => [id, idx] as const));
      save(
        lists,
        items.map((i) => (i.list_id === listId && order.has(i.id) ? { ...i, sort_order: order.get(i.id) as number } : i))
      );
    },

    itemsOf: (listId) => {
      return get()
        .items.filter((i) => i.list_id === listId)
        .sort((a, b) => a.sort_order - b.sort_order);
    },

    filteredItems: (listId, filters) => {
      const base = get()
        .items.filter((i) => i.list_id === listId)
        .sort((a, b) => a.sort_order - b.sort_order);
      const q = (filters.text || '').trim().toLowerCase();
      return base.filter((i) => {
        if (filters.mediaType && filters.mediaType !== 'all' && i.media_type !== filters.mediaType) return false;
        if (q) {
          const hay = `${i.title || ''} ${i.original_title || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (filters.providers && filters.providers.length > 0) {
          const mine = (i.providers || []).map((p) => p.toLowerCase());
          if (!filters.providers.some((p) => mine.includes(p.toLowerCase()))) return false;
        }
        if (filters.genres && filters.genres.length > 0) {
          const mine = i.genre_ids || [];
          if (!filters.genres.some((g) => mine.includes(g))) return false;
        }
        const y = yearOf({ release_date: i.release_date || null, first_air_date: i.first_air_date || null });
        if (filters.yearFrom != null && (y == null || y < filters.yearFrom)) return false;
        if (filters.yearTo != null && (y == null || y > filters.yearTo)) return false;
        if (filters.minRating != null && (i.vote_average || 0) < filters.minRating) return false;
        return true;
      });
    },

    exportJson: () => {
      const { lists, items } = get();
      return JSON.stringify({ app: 'trak-watch', version: 1, exported_at: new Date().toISOString(), lists, items }, null, 2);
    },

    importJson: (json) => {
      const errors: string[] = [];
      let imported = 0;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = JSON.parse(json) as any;
        const lists = Array.isArray(data.lists) ? data.lists : [];
        const items = Array.isArray(data.items) ? data.items : [];
        const { lists: cur, items: curItems } = get();
        const bySlug = new Map(cur.map((l) => [l.slug, l] as const));
        const nextLists = [...cur];
        const idMap = new Map<string, string>();
        for (const l of lists) {
          if (!l || typeof l.name !== 'string') {
            errors.push('Lista sin nombre omitida');
            continue;
          }
          const slug = typeof l.slug === 'string' ? l.slug : slugify(l.name);
          if (bySlug.has(slug)) {
            idMap.set(String(l.id), (bySlug.get(slug) as MediaList).id);
            continue;
          }
          const fresh: MediaList = {
            id: uid(),
            slug,
            name: String(l.name).slice(0, 100),
            description: typeof l.description === 'string' ? l.description : null,
            type: 'custom',
            kind: 'custom',
            media: l.media === 'movie' || l.media === 'tv' ? l.media : 'mixed',
            sortOrder: nextLists.length + 1,
            createdAt: new Date().toISOString(),
          };
          idMap.set(String(l.id), fresh.id);
          bySlug.set(slug, fresh);
          nextLists.push(fresh);
          imported++;
        }
        const nextItems = [...curItems];
        for (const it of items) {
          if (!it || typeof it.tmdb_id !== 'number') {
            errors.push('Item sin tmdb_id omitido');
            continue;
          }
          const listId = idMap.get(String(it.list_id)) || String(it.list_id);
          if (!nextLists.some((l) => l.id === listId)) {
            errors.push(`Item ${it.tmdb_id} con lista desconocida omitido`);
            continue;
          }
          nextItems.push({
            id: uid(),
            list_id: listId,
            tmdb_id: it.tmdb_id,
            imdb_id: it.imdb_id || null,
            media_type: it.media_type === 'tv' ? 'tv' : 'movie',
            status: it.status || 'pendientes',
            rating: it.rating ?? null,
            notes: it.notes ?? null,
            added_at: it.added_at || new Date().toISOString(),
            watched_at: it.watched_at || null,
            sort_order: nextItems.filter((x) => x.list_id === listId).length,
            title: it.title,
            original_title: it.original_title,
            overview: it.overview,
            poster_path: it.poster_path,
            backdrop_path: it.backdrop_path,
            release_date: it.release_date,
            first_air_date: it.first_air_date,
            vote_average: it.vote_average,
            genre_ids: it.genre_ids,
            genres: it.genres,
            providers: it.providers,
          });
          imported++;
        }
        save(nextLists, nextItems);
      } catch {
        errors.push('JSON inválido');
      }
      return { imported, errors };
    },
  };
});
