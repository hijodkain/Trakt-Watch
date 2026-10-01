# 00 — Overview Trakt-Watch-app

## Qué es
App personal para crear listas de películas y series, buscar por nombre, elegir la opción correcta, ver el detalle con datos de TMDB en español y UI visual estilo JustWatch.

## Alcance congelado
- Solo app de listas. El plugin de Stremio vive fuera, en `Trakt-Watch-Stremio/`.
- Un solo usuario, sin login por ahora. Sin cuentas, sin RLS multiusuario, sin onboarding social.
- Películas y series como dominios separados pero con el mismo flujo.

## Flujo principal
1. Buscar por nombre en cualquier idioma.
2. Elegir explícitamente entre las opciones.
3. Ver detalle con datos TMDB en español.
4. Añadir a una lista personalizada.
5. Filtrar cada lista por proveedor, año o género.

## Fuera de alcance v1
- Auth/OAuth, perfiles públicos, compartir listas.
- Reproductor propio o fuentes de streaming.
- Escritura desde Stremio; solo se deja el contrato sync-ready.

## Definición de terminado
- Crear, renombrar, borrar y reordenar listas e items sin errores.
- Todo lo listado/guardado se muestra en español aunque la búsqueda fuese en otro idioma.
- Cada item guarda `tmdb_id + imdb_id + media_type` para el futuro addon.
