# 30 — Detalle estilo JustWatch

## Estructura
Hero con backdrop, póster, título ES, título original si difiere, año, nota, géneros, duración o temporadas/episodios, estado y tagline.

## Bloques obligatorios
- Sinopsis en español.
- Géneros como badges.
- Reparto principal y dirección.
- Tráiler en español (YouTube) con modal; si no hay ES, fallback documentado en `40-tmdb-spanish.md`.
- Proveedores, reparto extendido y recomendaciones como secciones secundarias.

## Acciones
- CTA principal: “Añadir a lista” con selector de lista personalizada.
- Acciones de estado: pendientes, favoritas, siguiendo, seguir-viendo/vista.
- Compartir y exportar quedan fuera de v1.

## Rendimiento/UX
- Skeleton de hero + contenido; póster `w342`, backdrop `w1280`.
- Imágenes con `loading=lazy` salvo hero.
