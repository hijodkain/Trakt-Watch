# 50 — Contrato sync-ready para Stremio

## Principio
La app no implementa el addon, pero todo lo que guarda debe ser consumible por `Trakt-Watch-Stremio` sin migraciones.

## Catálogos que la app expone (lógico)
- Por estado: `pendientes`, `vistas`, `favoritas`, `siguiendo`, `seguir-viendo`.
- Por lista custom: `Documentales`, `Apple TV+`, `HBO Max`, más customs.
- Cada entrada: `trakwatch:{media_type}:{tmdb_id}`, `imdb_id`, título ES, póster ES, año, géneros, nota.

## Eventos
- `item_added`, `item_removed`, `status_changed`.
- Payload mínimo: `user_ref: local`, `media: {type, tmdb_id, imdb_id}`, `list_slug`, `timestamp`.
- Idempotencia por `tmdb_id + media_type`; reintentos seguros.

## Transiciones que el addon podrá pedir (fase 2)
- `vistas`, `favoritas`, `siguiendo`, `pendientes`.
- `vistas` fija `watched_at`; salir de `vistas` lo limpia.
- Las listas personalizadas se siguen gestionando en la app; el addon solo cambia estado base.
