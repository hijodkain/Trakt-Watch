'use client';

import React, { useState } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@trak-watch/ui/components/primitives/Dialog';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { Input } from '@trak-watch/ui/components/primitives/Input';
import { Badge } from '@trak-watch/ui/components/primitives/Badge';
import type { MediaSummary } from '@/types';
import { useLists } from '@/features/lists/store';
import { getDetails, getWatchProviders } from '@/lib/tmdb';
import { useToast } from '@trak-watch/ui/components/primitives/useToast';

interface AddToListDialogProps {
  open: boolean;
  onClose: () => void;
  media: MediaSummary | null;
}

export function AddToListDialog({ open, onClose, media }: AddToListDialogProps) {
  const { lists, items, createList, addItem } = useLists();
  const { toast } = useToast();
  const [newListName, setNewListName] = useState('');
  const [savingListId, setSavingListId] = useState<string | null>(null);

  if (!media) return null;

  const inLists = new Set(
    items
      .filter((i) => i.tmdb_id === media.tmdb_id && i.media_type === media.media_type)
      .map((i) => i.list_id)
  );

  const handleAdd = async (listId: string) => {
    setSavingListId(listId);
    try {
      let snapshot = media;
      let imdbId: string | null = media.imdb_id;
      let providers: string[] = [];
      try {
        const [detail, provs] = await Promise.all([
          getDetails(media.media_type, media.tmdb_id),
          getWatchProviders(media.media_type, media.tmdb_id).catch(() => [] as string[]),
        ]);
        imdbId = detail.imdb_id || media.imdb_id;
        providers = provs;
        snapshot = {
          ...media,
          imdb_id: imdbId,
          genre_ids: media.genre_ids.length > 0 ? media.genre_ids : detail.genres.map((g) => g.id),
          genres: media.genres || detail.genres,
        };
      } catch {
        // sin red o sin token: se guarda con el snapshot disponible
      }
      const added = addItem(listId, { media: snapshot, imdbId, providers });
      if (added) {
        toast({ title: 'Añadido', description: `«${media.title}» está en la lista`, variant: 'success' });
      } else {
        toast({ title: 'Aviso', description: 'No se pudo añadir', variant: 'warning' });
      }
      onClose();
    } finally {
      setSavingListId(null);
    }
  };

  const handleCreate = () => {
    const name = newListName.trim();
    if (!name) return;
    const list = createList({ name });
    setNewListName('');
    void handleAdd(list.id);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir a lista</DialogTitle>
          <DialogDescription className="truncate">{media.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4 max-h-[40vh] overflow-y-auto">
          {lists.map((list) => {
            const added = inLists.has(list.id);
            const count = items.filter((i) => i.list_id === list.id).length;
            return (
              <button
                key={list.id}
                onClick={() => !added && void handleAdd(list.id)}
                disabled={added || savingListId !== null}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-bg-elevated border border-border hover:border-accent transition-colors disabled:opacity-60 text-left"
              >
                <span>
                  <span className="block font-medium text-fg">{list.name}</span>
                  <span className="block text-xs text-fg-subtle">
                    {count} elementos{list.presetProviders ? ` · ${list.presetProviders[0]}` : ''}
                  </span>
                </span>
                {savingListId === list.id ? (
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                ) : added ? (
                  <Badge variant="success" size="sm" className="gap-1">
                    <Check className="h-3 w-3" /> En lista
                  </Badge>
                ) : (
                  <Plus className="h-5 w-5 text-fg-subtle" />
                )}
              </button>
            );
          })}
          {lists.length === 0 && (
            <p className="text-sm text-fg-muted text-center py-4">No tienes listas todavía. Crea la primera abajo.</p>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nueva lista..."
            value={newListName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewListName(e.target.value)}
            maxLength={100}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
          <Button onClick={handleCreate} disabled={!newListName.trim()}>
            Crear
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
