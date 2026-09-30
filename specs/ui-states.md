# UI States - Trak Watch

## Global States

### Loading
- **Skeleton screens** for all data-fetching views
- **Progressive loading**: Show layout first, populate content
- **Minimum display time**: 300ms to prevent flash

### Error
- **Inline errors**: Form validation, toast notifications
- **Page errors**: Full-screen with retry action
- **Network errors**: Offline banner with retry

### Empty
- **Illustrated empty states** with clear CTAs
- **Context-aware messages**: "No hay películas en esta lista" vs "No se encontraron resultados"

### Success
- **Toast confirmations** for mutations
- **Optimistic updates** with rollback on error

---

## Page States

### Home / Discover (`/`)

| State | Description |
|-------|-------------|
| **Initial Load** | Hero skeleton + 4 section skeletons (trending, popular, top-rated, airing) |
| **Loaded** | Hero banner (trending movie) + 4 PosterGrid sections |
| **Error** | Hero shows fallback + sections show error with retry |
| **Empty** | Not applicable (always has content) |

### Search (`/search?q=`)

| State | Description |
|-------|-------------|
| **Initial** | Search history (localStorage) + trending suggestions |
| **Typing** | Debounced (300ms) → loading spinner in input |
| **Results** | PosterGrid with results + "X resultados para 'query'" |
| **No Results** | Empty state: "No se encontró nada para 'query'" + suggestions |
| **Error** | Inline error + retry button |

### Media Detail (`/media/:type/:id`)

| State | Description |
|-------|-------------|
| **Loading** | Hero skeleton + info skeleton + actions disabled |
| **Loaded** | HeroBanner + metadata + cast + videos + recommendations |
| **Trailer Modal** | YouTube embed fullscreen with close |
| **Not Found** | 404 page with search link |
| **Error** | Full page error with retry |

### Lists Index (`/lists`)

| State | Description |
|-------|-------------|
| **Loading** | Grid of 6 list card skeletons |
| **Loaded** | List cards with item count + cover image |
| **Empty (no lists)** | Illustration + "Crea tu primera lista" CTA |
| **Empty (filtered)** | "No hay listas con este filtro" |

### List Detail (`/lists/:id`)

| State | Description |
|-------|-------------|
| **Loading** | List header skeleton + PosterGrid skeleton |
| **Loaded** | Header (cover, title, stats) + PosterGrid + empty slot for new items |
| **Editing** | Inline edit mode for title/description |
| **Empty** | "Esta lista está vacía" + search button |
| **Error** | Header loads, grid shows error |

### Profile (`/profile`)

| State | Description |
|-------|-------------|
| **Loading** | Avatar skeleton + stats skeleton + lists skeleton |
| **Loaded** | Avatar, username, stats (counts), recent activity, public lists |
| **Own Profile** | Edit buttons, settings link, Stremio connect |
| **Public Profile** | View-only, follow button (future) |

### Settings (`/settings`)

| State | Description |
|-------|-------------|
| **Loading** | Form skeleton |
| **Loaded** | Sections: Cuenta, Apariencia, Notificaciones, Stremio, Datos |
| **Saving** | Button loading state + toast on success |
| **Error** | Field-level errors + toast |

### Stremio Connect (`/stremio`)

| State | Description |
|-------|-------------|
| **No Tokens** | Explanation + "Generar token" button |
| **Generating** | Button loading |
| **Tokens List** | Table: Device, Creado, Último sync, Expira, Revocar |
| **QR/URL** | Modal with `stremio://` URL + QR code |

### Auth Pages

| Page | States |
|------|--------|
| `/auth/login` | Form → Loading → Error/Success → Redirect |
| `/auth/callback` | Loading → Processing → Redirect to `/` or `/auth/login?error=` |

---

## Component States

### PosterCard
| State | Visual |
|-------|--------|
| Default | Poster image, title, year, rating |
| Hover | Overlay gradient + action buttons (add, watched, favorite) |
| Loading | Skeleton poster shape |
| Error | Placeholder 🎬 + retry |
| In List | Status badge (Por ver/Viendo/Vista/Abandonada) |
| Favorite | Heart icon filled red |
| User Rated | Stars (1-10) below poster |

### PosterGrid
| State | Visual |
|-------|--------|
| Loading | 12 skeleton posters (responsive columns) |
| Loaded | Masonry grid with stagger animation |
| Empty | Centered illustration + message + action |
| End Reached | "Fin de resultados" subtle label |

### Global Search (Header)
| State | Visual |
|-------|--------|
| Closed | Magnifying glass icon in header |
| Open (focus) | Full-width modal, recent searches, trending |
| Typing | Debounced results dropdown (max 8) |
| Results | Poster + title + year + type + add button |
| No Results | "Nada encontrado para 'query'" |
| Keyboard Nav | Arrow keys + Enter to select |

### List Card (Lists Index)
| State | Visual |
|-------|--------|
| Default | Cover image (first item or generated), title, count, type badge |
| Hover | Slight scale + overlay with actions |
| Empty List | Generated gradient cover + "Vacía" badge |
| Public | Globe icon |
| Default Lists | Special icons (👁️ Por ver, ✅ Vistas, ❤️ Favoritas) |

### HeroBanner (Media Detail)
| State | Visual |
|-------|--------|
| Default | Backdrop + gradient + poster + title + meta + actions |
| No Backdrop | Solid bg + larger poster |
| Trailer Available | "Ver tráiler" button prominent |
| Loading | Full skeleton with shimmer |

### Modal (Add to List)
| State | Visual |
|-------|--------|
| Closed | Trigger button |
| Open | Centered modal, list of user's lists + "Crear nueva" |
| List Selected | Checkmark + "Añadido" toast |
| Creating New | Inline form in modal |

### Toast Notifications
| Type | Visual | Duration |
|------|--------|----------|
| Success | Green border, check icon | 4s |
| Error | Red border, X icon | 6s |
| Warning | Yellow border, alert icon | 5s |
| Info | Blue border, info icon | 4s |

---

## Responsive Breakpoints

| Breakpoint | Width | Grid Columns (PosterGrid) |
|------------|-------|---------------------------|
| base | < 640px | 2 |
| sm | 640px | 3 |
| md | 768px | 4 |
| lg | 1024px | 5 |
| xl | 1280px | 6 |
| 2xl | 1536px | 7 |

---

## Accessibility

- **Focus management**: Trap focus in modals, restore on close
- **ARIA labels**: All icon buttons, form inputs, interactive elements
- **Keyboard nav**: Tab order, Enter/Space activation, Escape to close
- **Screen readers**: Live regions for toasts, loading announcements
- **Color contrast**: WCAG AA minimum (4.5:1 text, 3:1 UI)
- **Reduced motion**: Respect `prefers-reduced-motion`

---

## Dark/Light Mode

- **Default**: Dark (matches JustWatch/Netflix aesthetic)
- **Toggle**: Settings → Apariencia
- **Persistence**: localStorage + OS preference fallback
- **CSS Variables**: All colors via CSS custom properties

---

## Animation Guidelines

| Interaction | Animation | Duration |
|-------------|-----------|----------|
| Page transition | Fade + slide up | 300ms |
| Poster hover | Scale 1.02 + shadow | 200ms |
| Modal open | Fade + zoom in | 200ms |
| Toast enter | Slide from right | 300ms |
| Skeleton pulse | Opacity wave | 1.5s infinite |
| Button press | Scale 0.98 | 100ms |