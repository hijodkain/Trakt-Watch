# 60 — Estados de UI

## Globales
- Loading: skeletons, carga progresiva, mínimo 300ms anti-parpadeo.
- Error: inline en formularios, página completa con reintentar en vistas, toast en mutaciones.
- Vacío: ilustrado con CTA contextual.
- Éxito: toast + optimistic update con rollback.

## Por pantalla
- Home: hero skeleton + secciones; error por sección con reintento.
- Search: historial local + sugerencias; escribiendo con debounce; resultados en grid; vacío y error diferenciados.
- Detail: hero skeleton + acciones deshabilitadas; 404 con vuelta a búsqueda; modal de tráiler con cierre.
- Lists: skeletons de tarjetas; vacía con CTA crear; filtrada vacía con mensaje específico.
- ListDetail: cabecera + grid; modo edición inline; vacía con botón buscar; drag-drop con confirmación visual.
- StremioConnect: se congela en v1; solo placeholder que remite al futuro addon.
- Auth/Profile/Settings: fuera de v1 por modo single-user sin login.
