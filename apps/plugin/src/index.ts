import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { manifest } from './manifest';
import { catalogHandler, metaHandler, streamHandler } from './handlers';
import { authMiddleware } from './middleware/auth';
import type { StremioManifest } from './types';

const app = new Hono();

// CORS for Stremio
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400,
}));

// Manifest - public
app.get('/manifest.json', (c) => {
  return c.json(manifest as StremioManifest);
});

// Protected routes - require token
app.use('/catalog/*', authMiddleware);
app.use('/meta/*', authMiddleware);
app.use('/stream/*', authMiddleware);

app.get('/catalog/:type/:id.json', catalogHandler);
app.get('/meta/:type/:id.json', metaHandler);
app.get('/stream/:type/:id.json', streamHandler);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;