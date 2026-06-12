import type { APIRoute } from 'astro';
import * as Sentry from '@sentry/cloudflare';

/**
 * Demo endpoint: emits a server-side Sentry structured log on every request.
 * The home page calls it on an interval, so a deployed app produces a steady
 * stream of server logs you can watch in Sentry's Logs view.
 *
 * Pass `?error=1` to throw — verifies server-side error capture end to end.
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const requestedAt = new Date().toISOString();

  Sentry.logger.info('server: sentry-ping received', {
    path: url.pathname,
    requestedAt,
    userAgent: request.headers.get('user-agent') ?? 'unknown',
  });

  if (url.searchParams.get('error') === '1') {
    const err = new Error('sentry-ping: intentional test error (server)');
    // Astro renders route errors into a 500 response before they reach the
    // middleware wrapper, so capture explicitly here.
    Sentry.captureException(err);
    throw err;
  }

  return new Response(JSON.stringify({ ok: true, source: 'server', requestedAt }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
