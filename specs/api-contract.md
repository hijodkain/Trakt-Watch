# API Contract - Trak Watch

## Base Configuration

- **Base URL**: `https://trakwatch.vercel.app/api`
- **Authentication**: Supabase JWT (Bearer token)
- **Content-Type**: `application/json`
- **Rate Limiting**: 100 req/min per user

## Error Response Format

```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Success Response Format

```json
{
  "data": {},
  "error": null,
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

## Authentication Endpoints

### GET /auth/user
Get current authenticated user profile.

**Response**: `Profile`

### POST /auth/logout
Sign out current user.

**Response**: `{ success: true }`

## Lists Endpoints

### GET /lists
Get all lists for current user.

**Query Parameters**:
- `type` (optional): `watchlist` | `watched` | `favorites` | `custom`
- `include_items` (optional): boolean, default false

**Response**: `List[]`

### POST /lists
Create a new list.

**Request Body**:
```json
{
  "name": "string (1-100 chars)",
  "description": "string (max 500 chars, optional)",
  "type": "watchlist | watched | favorites | custom",
  "is_public": "boolean (default false)"
}
```

**Response**: `List`

### GET /lists/:id
Get a specific list with items.

**Query Parameters**:
- `page` (optional): number, default 1
- `per_page` (optional): number, default 50, max 100
- `status` (optional): `to_watch` | `watching` | `watched` | `dropped`
- `sort` (optional): `added_at` | `title` | `rating` | `release_date`

**Response**: `ListWithItems`

### PATCH /lists/:id
Update a list.

**Request Body**:
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "type": "watchlist | watched | favorites | custom (optional)",
  "is_public": "boolean (optional)",
  "sort_order": "number (optional)"
}
```

**Response**: `List`

### DELETE /lists/:id
Delete a list.

**Response**: `{ success: true }`

## List Items Endpoints

### POST /lists/:listId/items
Add item to list.

**Request Body**:
```json
{
  "tmdb_id": "number (required)",
  "imdb_id": "string (optional, format: tt\\d{7,8})",
  "media_type": "movie | tv (required)",
  "status": "to_watch | watching | watched | dropped (default: to_watch)",
  "rating": "number 1-10 (optional)",
  "notes": "string (max 2000 chars, optional)"
}
```

**Response**: `ListItem`

### PATCH /lists/:listId/items/:itemId
Update list item.

**Request Body**:
```json
{
  "status": "to_watch | watching | watched | dropped (optional)",
  "rating": "number 1-10 | null (optional)",
  "notes": "string | null (optional)",
  "sort_order": "number (optional)"
}
```

**Response**: `ListItem`

### DELETE /lists/:listId/items/:itemId
Remove item from list.

**Response**: `{ success: true }`

### POST /lists/:listId/items/reorder
Reorder items in list.

**Request Body**:
```json
{
  "item_ids": ["uuid", "uuid", ...]
}
```

**Response**: `{ success: true }`

## Media Endpoints (TMDB Proxy)

### GET /media/search
Search movies and TV shows.

**Query Parameters**:
- `query`: string (required, min 1 char)
- `page`: number (default 1)
- `language`: `es` | `en` (default es)
- `include_adult`: boolean (default false)

**Response**: `PaginatedResponse<MediaSummary>`

### GET /media/trending
Get trending content.

**Query Parameters**:
- `type`: `movie` | `tv` | `all` (default all)
- `window`: `day` | `week` (default week)

**Response**: `PaginatedResponse<MediaSummary>`

### GET /media/discover
Discover content with filters.

**Query Parameters**:
- `media_type`: `movie` | `tv` (optional)
- `page`: number (default 1)
- `sort_by`: string (default `popularity.desc`)
- `with_genres`: string (comma-separated genre IDs)
- `with_keywords`: string (comma-separated keyword IDs)
- `vote_average.gte`: number (0-10)
- `vote_count.gte`: number
- `release_date.gte`: YYYY-MM-DD
- `release_date.lte`: YYYY-MM-DD
- `first_air_date.gte`: YYYY-MM-DD
- `first_air_date.lte`: YYYY-MM-DD

**Response**: `PaginatedResponse<MediaSummary>`

### GET /media/:type/:id
Get detailed media information.

**Path Parameters**:
- `type`: `movie` | `tv`
- `id`: number (TMDB ID)

**Response**: `MediaDetail`

### GET /media/:type/:id/videos
Get videos (trailers) for media.

**Response**: `{ results: Video[] }`

### GET /media/:type/:id/images
Get images for media.

**Response**: `{ backdrops: Image[]; logos: Image[]; posters: Image[] }`

### GET /media/genres/:type
Get genres for media type.

**Response**: `Genre[]`

## Profile Endpoints

### GET /profile
Get current user profile with stats.

**Response**: `Profile & { stats: UserStats }`

### PATCH /profile
Update profile.

**Request Body**:
```json
{
  "username": "string (optional, unique)",
  "avatar_url": "string (optional, URL)",
  "locale": "es | en (optional)"
}
```

**Response**: `Profile`

### POST /profile/avatar
Upload avatar image.

**Request**: multipart/form-data with `avatar` file

**Response**: `{ avatar_url: "string" }`

### GET /profile/export
Export user data (lists + items).

**Response**: JSON file download

### POST /profile/import
Import user data.

**Request**: multipart/form-data with `file` (JSON or Trakt CSV)

**Response**: `{ imported: number, errors: string[] }`

## Stremio Endpoints

### GET /stremio/token
Generate Stremio connection token.

**Response**: `{ token: "string", expires_at: "ISO8601", url: "stremio://addon/..." }`

### DELETE /stremio/token/:tokenId
Revoke Stremio token.

**Response**: `{ success: true }`

### GET /stremio/sync
Get sync status.

**Response**: `{ last_sync: "ISO8601", pending: number }`

## Webhooks

### POST /webhook/stremio
Receive sync events from Stremio.

**Headers**:
- `X-Stremio-Signature`: HMAC-SHA256 of body

**Request Body**:
```json
{
  "event": "item_added | item_removed | item_updated",
  "media": { "type": "movie | series", "id": "string" },
  "list": "watchlist | watched | favorites",
  "timestamp": "ISO8601"
}
```

**Response**: `{ received: true }`

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Auth | 10/min |
| Lists CRUD | 60/min |
| Media Search | 30/min |
| Media Details | 60/min |
| Profile | 30/min |
| Stremio | 20/min |

## WebSocket (Realtime)

### Channel: `sync:{userId}`

**Events**:
- `lists:*` - List changes
- `list_items:*` - Item changes

**Payload**: Postgres changes format