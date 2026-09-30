import type { List, ListItem, ListType, MediaType, ItemStatus, SyncLog } from '../types/app';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SyncEvent {
  type: 'list_created' | 'list_updated' | 'list_deleted' | 'item_created' | 'item_updated' | 'item_deleted';
  payload: List | ListItem;
  source: 'app' | 'stremio';
  timestamp: string;
}

export interface SyncState {
  connected: boolean;
  lastSync: string | null;
  pendingChanges: number;
  error: string | null;
}

type SyncCallback = (event: SyncEvent) => void;

export class SyncEngine {
  private supabase: SupabaseClient;
  private userId: string;
  private channel: ReturnType<SupabaseClient['channel']> | null = null;
  private callbacks: Set<SyncCallback> = new Set();
  private state: SyncState = {
    connected: false,
    lastSync: null,
    pendingChanges: 0,
    error: null,
  };

  constructor(supabaseUrl: string, supabaseKey: string, userId: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.userId = userId;
  }

  subscribe(callback: SyncCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  getState(): SyncState {
    return { ...this.state };
  }

  async connect(): Promise<void> {
    this.channel = this.supabase
      .channel(`sync:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => this.handleListChange(payload as any)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'list_items',
          filter: `list_id=in.(${this.getListIdsFilter()})`,
        },
        (payload) => this.handleItemChange(payload as any)
      )
      .subscribe(status => {
        this.state.connected = status === 'SUBSCRIBED';
        if (status === 'SUBSCRIBED') {
          this.state.error = null;
        } else if (status === 'CHANNEL_ERROR') {
          this.state.error = 'Connection lost';
        }
      });
  }

  private getListIdsFilter(): string {
    return `(SELECT id FROM lists WHERE user_id = '${this.userId}')`;
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.state.connected = false;
  }

  private handleListChange(payload: { eventType: string; new: List | null; old: List | null }): void {
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
    const list = payload.new || payload.old;
    if (!list) return;

    const event: SyncEvent = {
      type: eventType === 'INSERT' ? 'list_created' : eventType === 'UPDATE' ? 'list_updated' : 'list_deleted',
      payload: list,
      source: 'app',
      timestamp: new Date().toISOString(),
    };

    this.notify(event);
    this.updateState({ lastSync: event.timestamp });
  }

  private handleItemChange(payload: { eventType: string; new: ListItem | null; old: ListItem | null }): void {
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
    const item = payload.new || payload.old;
    if (!item) return;

    const event: SyncEvent = {
      type: eventType === 'INSERT' ? 'item_created' : eventType === 'UPDATE' ? 'item_updated' : 'item_deleted',
      payload: item,
      source: 'app',
      timestamp: new Date().toISOString(),
    };

    this.notify(event);
    this.updateState({ lastSync: event.timestamp });
  }

  private notify(event: SyncEvent): void {
    this.callbacks.forEach(cb => cb(event));
  }

  private updateState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial };
  }

  // List operations

  async createList(input: { name: string; description?: string; type?: ListType; is_public?: boolean }): Promise<List> {
    const { data, error } = await this.supabase
      .from('lists')
      .insert({
        user_id: this.userId,
        name: input.name,
        description: input.description,
        type: input.type || 'custom',
        is_public: input.is_public || false,
      })
      .select()
      .single();

    if (error) throw new SyncError('Failed to create list', error);
    return data;
  }

  async updateList(listId: string, input: Partial<Pick<List, 'name' | 'description' | 'type' | 'is_public' | 'sort_order'>>): Promise<List> {
    const { data, error } = await this.supabase
      .from('lists')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', listId)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) throw new SyncError('Failed to update list', error);
    return data;
  }

  async deleteList(listId: string): Promise<void> {
    const { error } = await this.supabase
      .from('lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', this.userId);

    if (error) throw new SyncError('Failed to delete list', error);
  }

  async getLists(): Promise<List[]> {
    const { data, error } = await this.supabase
      .from('lists')
      .select('*, list_items(count)')
      .eq('user_id', this.userId)
      .order('sort_order', { ascending: true });

    if (error) throw new SyncError('Failed to fetch lists', error);
    return data || [];
  }

  async getPublicLists(userId: string): Promise<List[]> {
    const { data, error } = await this.supabase
      .from('lists')
      .select('*, list_items(count), profiles!inner(username, avatar_url)')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('sort_order', { ascending: true });

    if (error) throw new SyncError('Failed to fetch public lists', error);
    return data || [];
  }

  // List Item operations

  async addItem(input: { list_id: string; tmdb_id: number; imdb_id?: string; media_type: MediaType; status?: ItemStatus; rating?: number; notes?: string }): Promise<ListItem> {
    const { data, error } = await this.supabase
      .from('list_items')
      .insert({
        list_id: input.list_id,
        tmdb_id: input.tmdb_id,
        imdb_id: input.imdb_id,
        media_type: input.media_type,
        status: input.status || 'to_watch',
        rating: input.rating,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw new SyncError('Failed to add item', error);
    return data;
  }

  async updateItem(itemId: string, input: Partial<Pick<ListItem, 'status' | 'rating' | 'notes' | 'sort_order'>>): Promise<ListItem> {
    const updates: Record<string, unknown> = { ...input };
    if (input.status === 'watched' && !updates.watched_at) {
      updates.watched_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('list_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw new SyncError('Failed to update item', error);
    return data;
  }

  async removeItem(itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('list_items')
      .delete()
      .eq('id', itemId);

    if (error) throw new SyncError('Failed to remove item', error);
  }

  async getListItems(listId: string): Promise<ListItem[]> {
    const { data, error } = await this.supabase
      .from('list_items')
      .select('*')
      .eq('list_id', listId)
      .order('sort_order', { ascending: true });

    if (error) throw new SyncError('Failed to fetch list items', error);
    return data || [];
  }

  async reorderItems(listId: string, itemIds: string[]): Promise<void> {
    const updates = itemIds.map((id, index) =>
      this.supabase.from('list_items').update({ sort_order: index }).eq('id', id)
    );
    await Promise.all(updates);
  }

  // Sync from Stremio

  async logSync(event: Omit<SyncLog, 'id' | 'created_at'>): Promise<void> {
    const { error } = await this.supabase.from('sync_logs').insert({
      user_id: this.userId,
      source: event.source,
      action: event.action,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
    });

    if (error) console.error('Failed to log sync:', error);
  }

  async getSyncLogs(limit = 50): Promise<SyncLog[]> {
    const { data, error } = await this.supabase
      .from('sync_logs')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new SyncError('Failed to fetch sync logs', error);
    return data || [];
  }
}

export class SyncError extends Error {
  constructor(message: string, public readonly cause: Error) {
    super(message);
    this.name = 'SyncError';
  }
}

export function createSyncEngine(supabaseUrl: string, supabaseKey: string, userId: string): SyncEngine {
  return new SyncEngine(supabaseUrl, supabaseKey, userId);
}