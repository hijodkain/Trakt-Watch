import type { MediaType } from '@/types';

export type SyncEventType = 'item_added' | 'item_removed' | 'status_changed';

export interface SyncEvent {
  id: string;
  ts: string;
  event: SyncEventType;
  list_slug: string;
  media: {
    type: MediaType;
    tmdb_id: number;
    imdb_id: string | null;
  };
}

const KEY = 'trakwatch:outbox:v1';

function read(): SyncEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SyncEvent[]) : [];
  } catch {
    return [];
  }
}

function write(events: SyncEvent[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(events.slice(-500)));
  } catch {
    // almacenamiento lleno o no disponible: no bloquea la app
  }
}

export function appendSyncEvent(event: Omit<SyncEvent, 'id' | 'ts'>): void {
  const events = read();
  events.push({
    ...event,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ts: new Date().toISOString(),
  });
  write(events);
}

export function readSyncEvents(): SyncEvent[] {
  return read();
}

export function clearSyncEvents(): void {
  write([]);
}
