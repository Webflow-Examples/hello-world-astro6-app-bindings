import type { APIRoute } from "astro";

/**
 * GET /api/env-debug
 *
 * Reports the env vars + secrets visible to this app at runtime. Returns
 * ONLY names + heuristic classifications — values are never returned.
 *
 * Use this endpoint to verify, after deploying via Webflow Cloud, that
 * the env vars / secrets you configured in the dashboard are actually
 * landing in the deployed worker.
 *
 * Classifications:
 * - `likelySecret`   — name matches a known sensitive keyword (SECRET,
 *                      KEY, TOKEN, …). At runtime there is no first-class
 *                      way to distinguish a Cloudflare secret from a plain
 *                      `[vars]` entry — both arrive as strings in env —
 *                      so this is a best-effort name heuristic.
 * - `frontendPrefix` — name uses Astro's `PUBLIC_*` public-var prefix,
 *                      meaning it gets inlined into client code at build
 *                      time. Anything else is backend-only.
 */

const SENSITIVE_KEYWORDS = [
  "SECRET",
  "KEY",
  "TOKEN",
  "PASSWORD",
  "CREDENTIAL",
  "PRIVATE",
  "AUTH",
  "API_KEY",
  "APIKEY",
  "ACCESS",
  "BEARER",
  "JWT",
  "CERT",
  "PEM",
  "RSA",
];

const FRONTEND_PREFIXES = ["PUBLIC_"];

function isLikelySecret(name: string): boolean {
  const upper = name.toUpperCase();
  return SENSITIVE_KEYWORDS.some((k) => upper.includes(k));
}

function isFrontendExposed(name: string): boolean {
  return FRONTEND_PREFIXES.some((p) => name.startsWith(p));
}

interface EnvVarInfo {
  name: string;
  likelySecret: boolean;
  frontendPrefix: boolean;
}

export const GET: APIRoute = async ({ locals }) => {
  // In Webflow Cloud (Cloudflare Workers via @astrojs/cloudflare),
  // env vars and secrets are exposed via `locals.runtime.env`. Bindings
  // (D1/KV/R2) also live there — we filter to string values to keep this
  // endpoint focused on env vars / secrets.
  const runtime = locals.runtime as { env?: Record<string, unknown> } | undefined;
  const env: Record<string, unknown> =
    runtime?.env || (locals as unknown as Record<string, unknown>) || {};

  const envVars: EnvVarInfo[] = Object.entries(env)
    .filter(([, value]) => typeof value === "string")
    .map(([name]) => ({
      name,
      likelySecret: isLikelySecret(name),
      frontendPrefix: isFrontendExposed(name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const body = {
    framework: "astro",
    frontendPrefixes: FRONTEND_PREFIXES,
    totalCount: envVars.length,
    envVars,
    timestamp: new Date().toISOString(),
    note: "Names only — values are never returned. `likelySecret` is a name heuristic; at runtime Cloudflare secrets and [vars] entries are indistinguishable.",
  };

  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
};
