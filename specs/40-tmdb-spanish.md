# 40 — TMDB en español

## Reglas de idioma
- Todas las llamadas usan `language=es`.
- Imágenes: `include_image_language=es,null`; prioridad `es` → `null` → `en` → mayor voto.
- Vídeos: `include_video_language=es,null`; tráiler preferido: YouTube + `iso_639_1=es` + `type=Trailer` + `official=true`; fallback a cualquier tráiler ES y solo después a EN.

## Identidad IMDB
- `imdb_id` se obtiene de `external_ids.imdb_id` en el detalle.
- Validación: `^tt\d{7,8}$`.
- El ID Stremio futuro será `trakwatch:{media_type}:{tmdb_id}`; `imdb_id` se conserva como identificador alternativo.

## Cache y límites
- Detalle: 24h. Imágenes/géneros: 7d. Búsqueda: 5m. Trending: 1h.
- Rate limit cliente: 40 req/s con reintento y fallback a caché.
- Pósters grid: `w500`; hero backdrop: `w1280`; miniaturas YouTube: `maxresdefault`.
