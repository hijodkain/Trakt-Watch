# Database Schema - Trak Watch

## Overview

PostgreSQL database hosted on Supabase with Row Level Security (RLS) for multi-tenant data isolation.

## Tables

### profiles
Extends `auth.users` with application-specific data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK → auth.users(id) | User identifier |
| username | TEXT | UNIQUE, NOT NULL | Display name |
| avatar_url | TEXT | NULLABLE | Profile image URL |
| locale | TEXT | DEFAULT 'es', CHECK IN ('es','en') | Preferred language |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes**: `idx_profiles_username` (unique)

**RLS Policies**:
- `own_profile`: SELECT, UPDATE WHERE `auth.uid() = id`
- `public_profiles`: SELECT WHERE `true`

---

### lists
User-created lists for organizing media.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | List identifier |
| user_id | UUID | FK → profiles(id) CASCADE | Owner |
| name | TEXT | NOT NULL | List name |
| description | TEXT | NULLABLE | Description |
| type | TEXT | CHECK IN ('watchlist','watched','favorites','custom'), DEFAULT 'custom' | List category |
| is_public | BOOLEAN | DEFAULT FALSE | Public visibility |
| sort_order | INT | DEFAULT 0 | Display order |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes**:
- `idx_lists_user_id` ON (user_id)
- `idx_lists_type` ON (type)
- `idx_lists_is_public` ON (is_public) WHERE is_public = true

**RLS Policies**:
- `own_lists`: ALL WHERE `auth.uid() = user_id`
- `public_lists`: SELECT WHERE `is_public = true`

---

### list_items
Individual media items within lists.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Item identifier |
| list_id | UUID | FK → lists(id) CASCADE | Parent list |
| tmdb_id | INT | NOT NULL | TMDB identifier |
| imdb_id | TEXT | NULLABLE | IMDB identifier (format: tt\d{7,8}) |
| media_type | TEXT | CHECK IN ('movie','tv'), NOT NULL | Media type |
| status | TEXT | CHECK IN ('to_watch','watching','watched','dropped'), DEFAULT 'to_watch' | Watch status |
| rating | INT | CHECK BETWEEN 1 AND 10, NULLABLE | User rating (1-10) |
| notes | TEXT | NULLABLE | Personal notes |
| added_at | TIMESTAMPTZ | DEFAULT NOW() | When added to list |
| watched_at | TIMESTAMPTZ | NULLABLE | When marked watched |
| sort_order | INT | DEFAULT 0 | Display order |

**Unique Constraint**: `(list_id, tmdb_id, media_type)`

**Indexes**:
- `idx_list_items_list_id` ON (list_id)
- `idx_list_items_tmdb_id` ON (tmdb_id)
- `idx_list_items_media_type` ON (media_type)
- `idx_list_items_status` ON (status)

**RLS Policies**:
- `own_list_items`: ALL WHERE `EXISTS (SELECT 1 FROM lists WHERE lists.id = list_items.list_id AND lists.user_id = auth.uid())`
- `public_list_items`: SELECT WHERE `EXISTS (SELECT 1 FROM lists WHERE lists.id = list_items.list_id AND lists.is_public = true)`

---

### tmdb_cache
Local cache for TMDB API responses to reduce rate limit usage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK | TMDB ID |
| media_type | TEXT | CHECK IN ('movie','tv') | Media type |
| data_jsonb | JSONB | NOT NULL | Cached response |
| expires_at | TIMESTAMPTZ | NOT NULL | Cache expiration |

**Indexes**:
- `idx_tmdb_cache_expires_at` ON (expires_at)

**Cleanup**: Cron job removes expired entries daily.

---

### stremio_tokens
Authentication tokens for Stremio plugin connection.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Token identifier |
| user_id | UUID | FK → profiles(id) CASCADE | Owner |
| token_hash | TEXT | NOT NULL | Hashed token (bcrypt) |
| device_name | TEXT | NULLABLE | Device identifier |
| last_sync | TIMESTAMPTZ | NULLABLE | Last sync timestamp |
| expires_at | TIMESTAMPTZ | NOT NULL | Token expiration |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Indexes**:
- `idx_stremio_tokens_user_id` ON (user_id)
- `idx_stremio_tokens_token_hash` ON (token_hash) UNIQUE

**RLS Policies**:
- `own_stremio_tokens`: ALL WHERE `auth.uid() = user_id`

---

### sync_logs
Audit trail for synchronization events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PK | Log identifier |
| user_id | UUID | FK → profiles(id) SET NULL | User (nullable for system events) |
| source | TEXT | CHECK IN ('app','stremio') | Event source |
| action | TEXT | NOT NULL | Action type (create/update/delete) |
| entity_type | TEXT | NOT NULL | Entity type (list/list_item) |
| entity_id | UUID | NOT NULL | Entity identifier |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Event timestamp |

**Indexes**:
- `idx_sync_logs_user_id` ON (user_id)
- `idx_sync_logs_created_at` ON (created_at DESC)

**RLS Policies**:
- `own_sync_logs`: SELECT WHERE `auth.uid() = user_id`

---

## Triggers & Functions

### update_updated_at_column()
Updates `updated_at` timestamp on row modification.

**Applied to**: profiles, lists

### handle_new_user()
Creates profile row when new user signs up via Supabase Auth.

**Trigger**: AFTER INSERT ON auth.users

### create_default_lists()
Creates three default lists for new users:
1. "Por ver" (watchlist)
2. "Vistas" (watched)
3. "Favoritas" (favorites)

**Trigger**: AFTER INSERT ON profiles

---

## Migrations

### 001_initial_schema.sql
Creates all tables, indexes, RLS policies, triggers, and functions.

---

## RLS Policy Summary

| Table | Owner Access | Public Access |
|-------|--------------|---------------|
| profiles | Full (own) | Read (all) |
| lists | Full (own) | Read (public only) |
| list_items | Full (via list) | Read (via public list) |
| stremio_tokens | Full (own) | None |
| sync_logs | Read (own) | None |

---

## Connection Pooling

- **Pooler**: Supabase Session Pooler (PgBouncer)
- **Max Connections**: 100
- **Idle Timeout**: 30s
- **Prepared Statements**: Disabled (use query parameters)

---

## Backup & Recovery

- **Point-in-time Recovery**: 7 days (Supabase Pro)
- **Daily Backups**: Automatic
- **Manual Backup**: `pg_dump` via CLI

---

## Performance Considerations

1. **Pagination**: Always use cursor-based or offset pagination with LIMIT
2. **Joins**: Prefer separate queries over complex joins for RLS compatibility
3. **Caching**: TMDB cache reduces external API calls by ~80%
4. **Indexes**: Cover all foreign keys and common filter columns
5. **JSONB**: Use for flexible TMDB response storage with GIN indexes if needed