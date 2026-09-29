import { Hono } from 'hono';
import type { RequestEvent } from '@sveltejs/kit';

// We base all Hono routes under /api
const app = new Hono().basePath('/api');

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'auth-api' });
});

// For any request falling into /api/*, pass it to Hono
const handler = (event: RequestEvent) => app.fetch(event.request);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
