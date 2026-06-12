import * as Sentry from '@sentry/cloudflare';
import { env } from 'cloudflare:workers';
import { defineMiddleware } from 'astro:middleware';

/**
 * Server-side Sentry, wired through Astro middleware.
 *
 * Sentry's Cloudflare docs wrap the worker entrypoint (`wrangler.json#main`),
 * but on Webflow Cloud the deploy system owns the worker entry — so we wrap
 * each request here instead. `wrapRequestHandler` initializes the SDK per
 * request (isolation scope, http.server span, error capture) and flushes
 * events via waitUntil. @sentry/cloudflare sends with `fetch`, so it works
 * on any worker compatibility_date.
 *
 * Set SENTRY_DSN in your Webflow Cloud environment variables (runtime).
 */
export const onRequest = defineMiddleware((context, next) => {
  return Sentry.wrapRequestHandler(
    {
      options: {
        dsn: (env as Env & { SENTRY_DSN?: string }).SENTRY_DSN,
        tracesSampleRate: 1.0,
        // Send Sentry structured logs (Sentry.logger.*) from the server.
        enableLogs: true,
      },
      request: context.request,
      // Astro v6's Cloudflare adapter exposes the execution context as
      // locals.cfContext (locals.runtime.ctx in Astro v5); passing it lets
      // Sentry flush via waitUntil after the response.
      context: context.locals.cfContext,
    },
    () => next()
  );
});
