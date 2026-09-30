# Stremio Plugin Manifest - Trak Watch

## Manifest Configuration

```json
{
  "id": "com.trakwatch.plugin",
  "version": "1.0.0",
  "name": "Trak Watch",
  "description": "Tus listas de Trak Watch sincronizadas en Stremio",
  "logo": "https://trakwatch.vercel.app/logo.png",
  "resources": ["catalog", "meta", "stream"],
  "types": ["movie", "series"],
  "idPrefixes": ["trakwatch:"],
  "catalogs": [
    { "type": "movie", "id": "trakwatch-watchlist", "name": "Por ver" },
    { "type": "movie", "id": "trakwatch-watched", "name": "Vistas" },
    { "type": "movie", "id": "trakwatch-favorites", "name": "Favoritas" },
    { "type": "series", "id": "trakwatch-watchlist", "name": "Por ver" },
    { "type": "series", "id": "trakwatch-watched", "name": "Vistas" },
    { "type": "series", "id": "trakwatch-favorites", "name": "Favoritas" }
  ]
}
```

## Resource Endpoints

### Manifest
```
GET /manifest.json
```
Returns the manifest above.

### Catalog
```
GET /catalog/{type}/{catalogId}.json?token={userToken}
```

**Path Parameters**:
- `type`: `movie` | `series`
- `catalogId`: `trakwatch-watchlist` | `trakwatch-watched` | `trakwatch-favorites`

**Query Parameters**:
- `token`: User authentication token (required)
- `skip`: number (pagination offset)
- `limit`: number (pagination limit, max 50)

**Response**:
```json
{
  "metas": [
    {
      "id": "trakwatch:movie:12345",
      "type": "movie",
      "name": "Título en español",
      "poster": "https://image.tmdb.org/t/p/w500/...",
      "posterShape": "regular",
      "year": "2024",
      "genres": ["Acción", "Ciencia Ficción"],
      "rating": 8.5
    }
  ]
}
```

### Meta
```
GET /meta/{type}/{id}.json?token={userToken}
```

**Path Parameters**:
- `type`: `movie` | `series`
- `id`: `trakwatch:{mediaType}:{tmdbId}` (e.g., `trakwatch:movie:550`)

**Query Parameters**:
- `token`: User authentication token (required)

**Response**:
```json
{
  "meta": {
    "id": "trakwatch:movie:550",
    "type": "movie",
    "name": "Título en español",
    "poster": "https://image.tmdb.org/t/p/w500/...",
    "posterShape": "regular",
    "background": "https://image.tmdb.org/t/p/w1280/...",
    "logo": "https://image.tmdb.org/t/p/w300/...",
    "description": "Sinopsis en español...",
    "releaseInfo": "2024",
    "director": ["Director Name"],
    "cast": ["Actor 1", "Actor 2", "Actor 3"],
    "genres": ["Acción", "Ciencia Ficción"],
    "rating": 8.5,
    "imdbRating": 8.3,
    "trailer": "https://www.youtube.com/watch?v=...",
    "videos": [
      {
        "id": "1",
        "title": "Tráiler oficial",
        "released": "2024-01-15",
        "overview": "Tráiler en español",
        "thumbnail": "https://img.youtube.com/vi/.../maxresdefault.jpg"
      }
    ]
  }
}
```

### Stream
```
GET /stream/{type}/{id}.json?token={userToken}
```

**Path Parameters**:
- `type`: `movie` | `series`
- `id`: `trakwatch:{mediaType}:{tmdbId}`

**Query Parameters**:
- `token`: User authentication token (required)

**Response**:
```json
{
  "streams": [
    {
      "url": "stremio://community-addons/...",
      "title": "Fuente comunitaria",
      "behaviorHints": {
        "notWebReady": true,
        "bingeGroup": "trakwatch:movie:550"
      }
    }
  ]
}
```

**Note**: Stream handler delegates to Stremio community addons. Returns empty array if no sources found.

## Authentication

### Token Generation (App Side)
1. User clicks "Conectar Stremio" in app
2. App generates JWT with claims:
   ```json
   {
     "sub": "user_id",
     "type": "stremio_access",
     "exp": timestamp_30_days,
     "iat": timestamp_now
   }
   ```
3. Token hashed with bcrypt and stored in `stremio_tokens` table
4. App shows `stremio://addon/{edge_function_url}/manifest.json?token={raw_token}`

### Token Validation (Plugin Side)
1. Plugin receives token via query parameter
2. Edge Function looks up token hash in `stremio_tokens`
3. Validates expiration and user ownership
4. Sets `user_id` in request context for downstream handlers

## Sync Architecture

### App → Stremio (Push)
1. User modifies list in app
2. Supabase Realtime triggers `list_items` change
3. Edge Function receives change event
4. Calls Stremio's `addonCatalogCacheRefresh` webhook (if available)
5. Or: Stremio polls catalog on app focus (default behavior)

### Stremio → App (Pull)
1. User plays content in Stremio
2. Community addon reports playback to Stremio
3. Stremio calls `/stream` handler
4. Edge Function logs `sync_logs` with action `play`
5. If item in user's "Por ver" list → updates status to `watched`
6. Realtime pushes update to app UI

## Error Handling

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| Missing token | 401 | `{ "error": "Token required" }` |
| Invalid token | 401 | `{ "error": "Invalid token" }` |
| Expired token | 401 | `{ "error": "Token expired" }` |
| Rate limited | 429 | `{ "error": "Too many requests" }` |
| Not found | 404 | `{ "error": "Not found" }` |
| Server error | 500 | `{ "error": "Internal error" }` |

## Rate Limits

- Catalog: 30 req/min per token
- Meta: 60 req/min per token
- Stream: 30 req/min per token
- Manifest: 10 req/min (cached)

## Caching Strategy

- Manifest: 1 hour (Cloudflare/Edge)
- Catalog: 5 minutes (Stremio internal)
- Meta: 1 hour (Stremio internal)
- Stream: No cache (dynamic)

## Deployment

### Edge Function: `plugin`
```
supabase functions deploy plugin --project-ref $PROJECT_REF
```

**Environment Variables**:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TMDB_API_KEY`
- `TMDB_READ_ACCESS_TOKEN`
- `JWT_SECRET` (for token signing)

**Routes**:
- `GET /manifest.json`
- `GET /catalog/:type/:id.json`
- `GET /meta/:type/:id.json`
- `GET /stream/:type/:id.json`

---

## Testing Checklist

- [ ] Manifest loads in Stremio addon manager
- [ ] Catalogs appear with correct names
- [ ] Meta returns Spanish titles and posters
- [ ] Trailers play in Stremio
- [ ] Streams delegate to community addons
- [ ] Token authentication works
- [ ] Expired tokens rejected
- [ ] Sync from app → Stremio visible
- [ ] Sync from Stremio → app updates status
- [ ] Rate limiting enforced