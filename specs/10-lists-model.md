# 10 — Modelo de listas

## Taxonomía
Estados base del sistema:
- `pendientes`
- `favoritas`
- `siguiendo`
- `seguir-viendo`

Colecciones personalizadas iniciales:
- `Documentales`
- `Apple TV+`
- `HBO Max`
- customs creadas por el usuario

Cada lista tiene `slug` estable, `media_type` permitido (`movie`, `tv` o `mixed`), visibilidad local y orden manual.

## Item de lista
Campos obligatorios:
- `tmdb_id: number`
- `imdb_id: string | null` (formato `tt\d{7,8}`)
- `media_type: movie | tv`
- `status: pendientes | favoritas | siguiendo | seguir-viendo`
- `rating: 1-10 | null`
- `notes: string | null`
- `added_at`, `watched_at | null`, `sort_order`

Restricción: un mismo `tmdb_id + media_type` no se duplica dentro de una lista.

## Filtros como vistas, no como duplicados
Proveedor, año y género son filtros sobre los items hidratados con TMDB, no listas separadas salvo que el usuario guarde la vista como lista custom.

## Reglas
- Borrar una lista no borra el catálogo TMDB cacheado.
- Reordenar solo afecta a `sort_order` de esa lista.
- Marcar `vistas` fija `watched_at`; desmarcar lo limpia.
