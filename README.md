# Trak Watch

> Tu app visual para listas de series y películas, sincronizada con Stremio.

## 🎯 Características

- **Interfaz visual tipo JustWatch** - Grid de posters, hero banners, detalles ricos
- **Datos de TMDB en español** - Posters, metadatos, trailers en español
- **Búsqueda global persistente** - Lupa en header, historial, resultados instantáneos
- **Listas inteligentes** - Por ver, Vistas, Favoritas + listas personalizadas
- **Sync bidireccional con Stremio** - Plugin nativo, tokens seguros
- **Auth completo** - OAuth (Google, GitHub, Apple) via Supabase
- **PWA ready** - Offline-first, installable

## 🏗️ Arquitectura

```
trak-watch/
├── apps/
│   ├── web/           # React 18 + Vite + Tailwind + Radix UI
│   ├── plugin/        # Hono + TypeScript (Stremio addon)
│   └── edge-fns/      # Supabase Edge Functions
├── packages/
│   ├── shared/        # Types, TMDB client, Zod schemas, Sync engine
│   └── ui/            # Design System (Radix + Tailwind)
├── supabase/
│   └── migrations/    # SQL schema + RLS policies
├── specs/             # SDD contracts (API, DB, Plugin, UI)
└── .github/workflows/ # CI/CD pipeline
```

## 🚀 Quick Start

### Prerequisitos
- Node.js 20+
- npm 10+
- Cuenta Supabase
- Cuenta TMDB
- Cuenta Vercel (opcional, para deploy)

### 1. Clona y configura

```bash
git clone <repo-url>
cd trak-watch

# Copia variables de entorno
cp .env.example .env.local
# Edita .env.local con tus keys
```

### 2. Configura Supabase

1. Crea proyecto en [Supabase](https://supabase.com)
2. Ve a Settings → API y copia:
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`
   - service_role key → GitHub Secret `SUPABASE_SERVICE_ROLE_KEY`
3. Ve a Settings → Access Tokens → Create new token → GitHub Secret `SUPABASE_ACCESS_TOKEN`
4. Project Reference ID → GitHub Secret `SUPABASE_PROJECT_REF`
5. Ejecuta migraciones:
   ```bash
   npx supabase db push
   ```

### 3. Configura TMDB

1. Crea API key en [TMDB](https://www.themoviedb.org/settings/api)
2. Copia:
   - API Key (v3) → `VITE_TMDB_API_KEY` + GitHub Secret `TMDB_API_KEY`
   - Read Access Token (v4) → `VITE_TMDB_READ_ACCESS_TOKEN` + GitHub Secret `TMDB_READ_ACCESS_TOKEN`

### 4. Instala dependencias

```bash
npm install
```

### 5. Desarrollo

```bash
# Inicia todos los workspaces
npm run dev

# Solo frontend
npm run dev --filter=@trak-watch/web

# Solo plugin
npm run dev --filter=@trak-watch/plugin
```

## 🔧 Scripts

```bash
npm run build          # Build all workspaces
npm run lint           # ESLint all workspaces
npm run typecheck      # TypeScript check all
npm run test           # Run tests
npm run test:coverage  # Tests with coverage
npm run format         # Prettier format
npm run db:push        # Push Supabase migrations
```

## 📦 Deploy

### Frontend (Vercel)
1. Conecta repo en Vercel
2. Añade Environment Variables desde `.env.local`
3. Deploy automático en push a `main`

### Edge Functions (Supabase)
```bash
npx supabase functions deploy plugin --project-ref $SUPABASE_PROJECT_REF
npx supabase functions deploy webhook --project-ref $SUPABASE_PROJECT_REF
npx supabase functions deploy sync --project-ref $SUPABASE_PROJECT_REF
```

### Stremio Plugin
El plugin se despliega automáticamente con las Edge Functions.
URL del manifest: `https://tu-proyecto.supabase.co/functions/v1/plugin/manifest.json`

## 🔐 GitHub Secrets

Configura en Settings → Secrets → Actions:

| Secret | Descripción |
|--------|-------------|
| `SUPABASE_ACCESS_TOKEN` | Token de acceso Supabase |
| `SUPABASE_PROJECT_REF` | Reference ID del proyecto |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secreto) |
| `SUPABASE_DB_PASSWORD` | Password de la DB |
| `VERCEL_TOKEN` | Token de Vercel |
| `VERCEL_ORG_ID` | Organization ID de Vercel |
| `VERCEL_PROJECT_ID` | Project ID de Vercel |
| `TMDB_API_KEY` | TMDB API Key v3 |
| `TMDB_READ_ACCESS_TOKEN` | TMDB Read Access Token v4 |
| `TURBO_TOKEN` | Turbo token (opcional) |
| `TURBO_TEAM` | Turbo team (opcional) |

## 📚 Specs (SDD)

Todos los contratos están en `/specs`:

- `api-contract.md` - OpenAPI spec completo
- `db-schema.md` - Schema SQL + RLS + triggers
- `plugin-manifest.md` - Stremio plugin spec
- `ui-states.md` - Estados de UI por página/componente
- `tmdb-mapping.md` - Mapeo TMDB → App types

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📁 Estructura de paquetes

### `@trak-watch/shared`
- `types/` - TypeScript types (TMDB, App, Stremio)
- `schemas/` - Zod validation schemas
- `tmdb/client.ts` - TMDB API client con cache + rate limiting
- `sync/engine.ts` - Sync engine con Supabase Realtime
- `constants/` - Config, routes, query keys

### `@trak-watch/ui`
- `components/primitives/` - Button, Input, Card, Avatar, Badge, Dialog, DropdownMenu, Tooltip, Toast, Skeleton
- `components/media/` - PosterCard, PosterGrid, HeroBanner
- `components/layout/` - Container, Section, Grid, Flex, Stack
- `components/feedback/` - Modal, ConfirmModal
- `hooks/` - useMediaQuery, useLocalStorage, useClickOutside, useDebounce, etc.
- `utils/` - cn(), formatNumber, formatRuntime, formatDate, etc.

### `@trak-watch/web`
- `features/auth/` - AuthProvider, useAuth
- `features/search/` - useGlobalSearch, SearchResultsDropdown
- `pages/` - Home, Search, MediaDetail, Lists, Profile, Settings, Stremio
- `components/` - Layout, ProtectedRoute

## 🔄 Sync Stremio

### App → Stremio
1. Usuario modifica lista en app
2. Supabase Realtime detecta cambio
3. Edge Function invalida cache Stremio

### Stremio → App
1. Usuario reproduce en Stremio
2. Community addon reporta playback
3. Webhook `/webhook` recibe evento
4. Actualiza `list_items.status = 'watched'`

## 📝 Licencia

MIT License - ver [LICENSE](LICENSE)

---

**Desarrollado con ❤️ usando ECC (Everything Claude Code) methodology**