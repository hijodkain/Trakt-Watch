export const manifest = {
  id: 'com.trakwatch.plugin',
  version: '1.0.0',
  name: 'Trak Watch',
  description: 'Tus listas de Trak Watch sincronizadas en Stremio',
  logo: 'https://trakwatch.vercel.app/logo.png',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie', 'series'],
  idPrefixes: ['trakwatch:'],
  catalogs: [
    { type: 'movie', id: 'trakwatch-watchlist', name: 'Por ver' },
    { type: 'movie', id: 'trakwatch-watched', name: 'Vistas' },
    { type: 'movie', id: 'trakwatch-favorites', name: 'Favoritas' },
    { type: 'series', id: 'trakwatch-watchlist', name: 'Por ver' },
    { type: 'series', id: 'trakwatch-watched', name: 'Vistas' },
    { type: 'series', id: 'trakwatch-favorites', name: 'Favoritas' },
  ],
};