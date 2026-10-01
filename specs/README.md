# Specs — Trakt-Watch-app

Metodología: SDD. Cada spec es normativa para su área. Los specs del addon Stremio viven en `Trakt-Watch-Stremio/specs/` y aquí solo se define el contrato que la app expone.

Convención: `specs/NN-kebab-case.md`, minúsculas, sin tildes ni espacios, prefijo numérico para orden.

| Fichero | Área | Estado |
|---|---|---|
| `00-overview.md` | Alcance app-only, single-user | approved |
| `10-lists-model.md` | Taxonomía de listas e items | approved |
| `20-search-disambiguation.md` | Búsqueda y desambiguación | approved |
| `30-detail-justwatch.md` | Detalle estilo JustWatch | approved |
| `40-tmdb-spanish.md` | TMDB en español | approved |
| `50-stremio-sync-contract.md` | Contrato sync-ready | approved |
| `60-ui-states.md` | Estados de UI | approved |

Fuentes repartidas desde los specs legados: `api-contract.md`, `db-schema.md`, `ui-states.md`, `tmdb-mapping.md`. El spec del plugin (`plugin-manifest.md`) pertenece al proyecto addon.
