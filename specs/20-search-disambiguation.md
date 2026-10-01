# 20 — Búsqueda con desambiguación

## Requisito
La búsqueda acepta cualquier idioma, pero lo guardado y listado siempre se muestra en español.

## Comportamiento
- Query mínima: 2 caracteres; debounce 300ms; página `page`.
- Llamada TMDB multi-search con `language=es`, `include_adult=false`.
- Cada resultado muestra: póster, título ES, título original si difiere, año, tipo `película|serie`, nota TMDB.
- Click en resultado abre `/media/:type/:id`; no añade directamente a ninguna lista.
- Sin resultados: mensaje contextual + sugerencia de probar otros términos.

## Resolución de identidad
- La identidad canónica es `tmdb_id + media_type`.
- `imdb_id` se resuelve en el detalle vía `external_ids` y se persiste en el item.
- Si un título existe como película y serie, ambas aparecen como opciones separadas.

## Cache
- Resultados de búsqueda: 5 minutos.
- Detalle e imágenes: según `40-tmdb-spanish.md`.
