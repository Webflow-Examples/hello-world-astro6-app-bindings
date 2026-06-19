import type { APIRoute } from "astro";

/**
 * POST /api/env-check
 *
 * Body: { "name": "VAR_NAME", "value": "expected-value" }
 *
 * Returns: { name, exists, matches }
 *
 * Verifies that an env var / secret was wired up with the expected value,
 * without ever returning the stored value itself. Designed for end-to-end
 * deploy testing: the test provides the value it set in the Webflow Cloud
 * dashboard, and the endpoint confirms the worker sees the same value.
 *
 * Security:
 * - The stored value is never returned.
 * - Comparison is constant-time (after a length check) to avoid timing
 *   side-channels on secret values.
 * - Only string env entries are inspected (bindings like D1/KV/R2 are
 *   skipped — they're not env vars).
 */

interface CheckRequest {
  name?: unknown;
  value?: unknown;
}

interface CheckResponse {
  name: string;
  exists: boolean;
  matches: boolean;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  let body: CheckRequest;
  try {
    body = (await request.json()) as CheckRequest;
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON" }, 400);
  }

  if (typeof body.name !== "string" || body.name.length === 0) {
    return jsonResponse({ error: "`name` must be a non-empty string" }, 400);
  }
  if (typeof body.value !== "string") {
    return jsonResponse({ error: "`value` must be a string" }, 400);
  }

  const runtime = locals.runtime as { env?: Record<string, unknown> } | undefined;
  const env: Record<string, unknown> =
    runtime?.env || (locals as unknown as Record<string, unknown>) || {};

  const stored = env[body.name];
  const exists = typeof stored === "string";
  const matches = exists && timingSafeEqual(stored as string, body.value);

  const response: CheckResponse = {
    name: body.name,
    exists,
    matches,
  };

  return jsonResponse(response);
};
