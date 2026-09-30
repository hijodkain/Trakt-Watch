# TMDB Mapping - Trak Watch

## Field Mapping: TMDB → App Types

### Media Summary (Search/Discover Results)

| App Field | TMDB Source | Transform |
|-----------|-------------|-----------|
| `tmdb_id` | `id` | Direct |
| `imdb_id` | `external_ids.imdb_id` | From details call |
| `media_type` | Endpoint (`movie`/`tv`) | Direct |
| `title` | `title` (movie) / `name` (tv) | Spanish fallback |
| `original_title` | `original_title` / `original_name` | Direct |
| `overview` | `overview` | Spanish fallback |
| `poster_path` | `poster_path` | With `include_image_language=es,null` |
| `backdrop_path` | `backdrop_path` | With `include_image_language=es,null` |
| `release_date` | `release_date` (movie) | ISO string |
| `first_air_date` | `first_air_date` (tv) | ISO string |
| `vote_average` | `vote_average` | Round to 1 decimal |
| `vote_count` | `vote_count` | Direct |
| `genre_ids` | `genre_ids` | Direct |
| `runtime` | `runtime` (movie details) | Minutes |
| `episode_run_time` | `episode_run_time[0]` (tv details) | Minutes |
| `number_of_seasons` | `number_of_seasons` (tv details) | Direct |
| `number_of_episodes` | `number_of_episodes` (tv details) | Direct |
| `status` | `status` | Direct |
| `tagline` | `tagline` (details) | Direct |

---

### Media Detail (Full Details)

| App Field | TMDB Source | Transform |
|-----------|-------------|-----------|
| `genres` | `genres[]` | Map to `{id, name}` |
| `production_companies` | `production_companies[]` | Map to `{id, logo_path, name, origin_country}` |
| `production_countries` | `production_countries[]` | Map to `{iso_3166_1, name}` |
| `spoken_languages` | `spoken_languages[]` | Map to `{english_name, iso_639_1, name}` |
| `videos` | `videos.results[]` | Filter: `site=YouTube` AND `iso_639_1=es` |
| `images` | `images.{backdrops,logos,posters}[]` | Filter: `iso_639_1=es` OR `null` |
| `credits` | `credits.{cast,crew}[]` | Top 10 cast, key crew |
| `external_ids` | `external_ids` | Direct |
| `recommendations` | `recommendations.results[]` | Map to MediaSummary |
| `similar` | `similar.results[]` | Map to MediaSummary |

---

## Spanish Language Strategy

### Primary: `language=es`
All API calls use `language=es` for Spanish translations.

### Fallback Chain
1. `include_image_language=es,null` - Spanish posters first, then no-language
2. `include_video_language=es,null` - Spanish trailers first
3. If Spanish overview empty → fallback to English via second call
4. Genre names: Use TMDB genre list with `language=es`

### Image Selection Priority
```typescript
function selectBestImage(images: TMDBImage[], type: 'poster' | 'backdrop' | 'logo'): string | null {
  // 1. Spanish (iso_639_1 === 'es')
  const spanish = images.find(img => img.iso_639_1 === 'es');
  if (spanish) return spanish.file_path;

  // 2. No language (iso_639_1 === null)
  const noLang = images.find(img => img.iso_639_1 === null);
  if (noLang) return noLang.file_path;

  // 3. English
  const english = images.find(img => img.iso_639_1 === 'en');
  if (english) return english.file_path;

  // 4. Highest voted
  return images.sort((a, b) => b.vote_average - a.vote_average)[0]?.file_path || null;
}
```

### Trailer Selection
```typescript
function selectSpanishTrailer(videos: TMDBVideo[]): TMDBVideo | null {
  // 1. Official Spanish YouTube trailer
  const officialEs = videos.find(v =>
    v.site === 'YouTube' &&
    v.iso_639_1 === 'es' &&
    v.type === 'Trailer' &&
    v.official === true
  );
  if (officialEs) return officialEs;

  // 2. Any Spanish YouTube trailer
  const anyEs = videos.find(v =>
    v.site === 'YouTube' &&
    v.iso_639_1 === 'es' &&
    v.type === 'Trailer'
  );
  if (anyEs) return anyEs;

  // 3. English trailer fallback
  const en = videos.find(v =>
    v.site === 'YouTube' &&
    v.iso_639_1 === 'en' &&
    v.type === 'Trailer'
  );
  return en || null;
}
```

---

## IMDB ID Resolution

### Strategy
1. **Primary**: `external_ids.imdb_id` from TMDB details call
2. **Cache**: Store IMDB ID in `list_items.imdb_id` for Stremio sync
3. **Format Validation**: Must match `^tt\d{7,8}$`

### Stremio ID Format
```
trakwatch:{media_type}:{tmdb_id}
Examples:
- trakwatch:movie:550
- trakwatch:series:1399
```

---

## Caching Strategy

### Cache Keys
| Data | Key | TTL |
|------|-----|-----|
| Movie Details | `movie:{id}` | 24h |
| TV Details | `tv:{id}` | 24h |
| Search Results | `search:{query}:{page}` | 5min |
| Trending | `trending:{type}:{window}` | 1h |
| Genres | `genres:{type}` | 7d |
| Images | `images:{type}:{id}` | 7d |
| Videos | `videos:{type}:{id}` | 24h |

### Cache Invalidation
- Manual: Admin panel "Clear Cache" button
- Automatic: On cache miss → fetch fresh → store
- TTL Expired: Background refresh on next request

---

## Rate Limiting

### TMDB Limits
- **Standard**: 40 requests/second
- **Burst**: 100 requests (short term)

### Client Implementation
```typescript
class TMDBRateLimiter {
  private tokens = 40;
  private lastRefill = Date.now();

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens--;
      return;
    }
    const waitMs = (1 - this.tokens) / 40 * 1000;
    await new Promise(r => setTimeout(r, waitMs));
    return this.acquire();
  }

  private refill() {
    const elapsed = (Date.now() - this.lastRefill) / 1000;
    this.tokens = Math.min(40, this.tokens + elapsed * 40);
    this.lastRefill = Date.now();
  }
}
```

---

## Error Handling

| TMDB Error | HTTP Status | App Response |
|------------|-------------|--------------|
| Invalid API Key | 401 | Log error, show config warning |
| Rate Limited | 429 | Retry with exponential backoff |
| Not Found | 404 | Return 404 to client |
| Server Error | 5xx | Retry 2x, then fallback to cache |
| Timeout | - | Retry 1x, then fallback to cache |

---

## Genre Mapping (Static)

Pre-fetch and cache genre lists for both movie and TV:

```typescript
const MOVIE_GENRES = {
  28: 'Acción',
  12: 'Aventura',
  16: 'Animación',
  35: 'Comedia',
  80: 'Crimen',
  99: 'Documental',
  18: 'Drama',
  10751: 'Familiar',
  14: 'Fantasía',
  36: 'Historia',
  27: 'Terror',
  10402: 'Música',
  9648: 'Misterio',
  10749: 'Romance',
  878: 'Ciencia Ficción',
  10770: 'Película de TV',
  53: 'Suspense',
  10752: 'Bélica',
  37: 'Western',
};

const TV_GENRES = {
  ...MOVIE_GENRES,
  10759: 'Acción y Aventura',
  10762: 'Niños',
  10763: 'Noticias',
  10764: 'Reality',
  10765: 'Ciencia Ficción y Fantasía',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'Guerra y Política',
};
```

---

## Search Behavior

### Multi-Search Endpoint
`GET /search/multi?query={q}&language=es&include_adult=false`

### Result Normalization
- Movies → `media_type: 'movie'`
- TV → `media_type: 'tv'`
- People → Excluded (not used)

### Ranking
1. Exact title match (case-insensitive)
2. Title starts with query
3. Title contains query
4. Popularity score

---

## Image URL Construction

```typescript
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const POSTER_SIZES = {
  thumb: 'w92',
  small: 'w154',
  medium: 'w185',
  large: 'w342',
  xlarge: 'w500',  // Default for grids
  xxlarge: 'w780',
  original: 'original',
};

const BACKDROP_SIZES = {
  small: 'w300',
  medium: 'w780',
  large: 'w1280',  // Default for hero
  original: 'original',
};

function buildImageUrl(path: string | null, size: keyof typeof POSTER_SIZES = 'xlarge'): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${POSTER_SIZES[size]}${path}`;
}
```

---

## Webhook Payloads (Stremio Sync)

### App → Stremio (List Change)
```json
{
  "event": "list_item_added",
  "user_id": "uuid",
  "list_type": "watchlist",
  "media": {
    "type": "movie",
    "tmdb_id": 550,
    "imdb_id": "tt0111161"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Stremio → App (Playback)
```json
{
  "event": "playback_started",
  "user_token": "hashed_token",
  "media": {
    "type": "movie",
    "id": "trakwatch:movie:550"
  },
  "progress": 0,
  "timestamp": "2024-01-15T20:45:00Z"
}
```