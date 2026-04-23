# CONTEXT — hello-world-astro6-app-bindings

Orientation for contributors to this **Astro 6 + bindings** Hello World example
for [Webflow Cloud](https://developers.webflow.com/webflow-cloud). Keep this
file current when structure or workflows change.

## What this is

A minimal, branded **Hello, world** page built with **Astro 6 (SSR via
`@astrojs/cloudflare`)** and deployed on Cloudflare Workers via Webflow Cloud.
This is the **bindings** variant — it wires up all four Cloudflare bindings
provisioned by Webflow Cloud (D1, KV Sessions, KV Flags, R2) and renders live
status cards.

The page shows:

- Webflow brand hero + gradient logo
- A curated set of Webflow Cloud doc cards
- A live **BindingsStatus** block pinging D1, KV, and R2 via
  `/api/binding-status`

## Stack

- Framework: **Astro 6** with `@astrojs/cloudflare` v13+ (requires Node ≥ 22.12)
- Styling: Tailwind v4 (`@tailwindcss/vite`) + `wf-*` brand tokens
- Deploy target: Cloudflare Workers via **Webflow Cloud** (`wrangler.json`)
- Bindings: `DB` (D1), `SESSIONS` + `FLAGS` (KV), `MEDIA` (R2)

## Repo layout

```
src/
  pages/
    index.astro                    ← hero, DOC_LINKS, <BindingsStatus />
    api/binding-status.ts          ← Astro endpoint: pings D1, KV, R2
  layouts/Layout.astro
  components/
    WebflowLogo.astro
    DocCard.astro
    BindingsStatus.astro           ← client-side fetch of /api/binding-status
  styles/global.css                ← Tailwind v4 + .wf-* design tokens
drizzle/                            ← D1 migrations
astro.config.mjs
wrangler.json                       ← bindings declaration
package.json
```

## Running locally

```bash
npm install              # postinstall runs `wrangler types`
npm run dev              # astro dev
npm run dev:cf           # wrangler types && astro dev
```

Requires Node 22.12+ (set in `.nvmrc`).

## Building

```bash
npm run build            # wrangler types && astro build
```

Build output lands in `dist/`. The `@astrojs/cloudflare` adapter emits
`dist/_worker.js/index.js` — this is the `main` entry referenced by
`wrangler.json`.

> **Important**: keep `main: "dist/_worker.js/index.js"` in `wrangler.json` —
> without it, Webflow Cloud serves static assets only and bindings are not
> injected into `env`. `@cloudflare/vite-plugin` (pulled in by
> `@astrojs/cloudflare`) may error on a cold local build because it validates
> `main` before Astro emits the file; Webflow Cloud's deploy pipeline handles
> this at deploy time.

## Bindings

Declared in `wrangler.json`:

| Binding    | Kind | Purpose                         |
| ---------- | ---- | ------------------------------- |
| `DB`       | D1   | SQL database (Drizzle migrations in `drizzle/`) |
| `SESSIONS` | KV   | Session store                   |
| `FLAGS`    | KV   | Feature flags                   |
| `MEDIA`    | R2   | Object storage                  |

Webflow Cloud provisions these on deploy — you don't manage them manually.
`src/pages/api/binding-status.ts` performs a cheap read/write against each
binding and returns per-binding status + latency.

Seed D1 locally:

```bash
npm run db:setup
```

## Editing the UI

- **Page content (hero, CTAs, doc cards):** `src/pages/index.astro`
- **Doc card list:** search for `DOC_LINKS` in `src/pages/index.astro`
- **Bindings status cards:** `src/components/BindingsStatus.astro`
- **Health-check endpoint:** `src/pages/api/binding-status.ts`
- **Brand tokens and `.wf-*` styles:** `src/styles/global.css`

## Deploying to Webflow Cloud

1. Push this repo to GitHub.
2. In your Webflow Cloud project, connect the repo and pick a mount path
   (e.g. `/my-app`). The app runs under any prefix.
3. Webflow Cloud builds with `npm run build` and provisions all bindings
   from `wrangler.json` automatically on deploy.

See [Deployments](https://developers.webflow.com/webflow-cloud/deployments)
and [Environments](https://developers.webflow.com/webflow-cloud/environments).

## Contributing

- Keep the **Webflow brand tone**: blue gradient (`#4353FF` → `#146EF5`), dark
  background, minimal copy. Reuse the existing `.wf-*` CSS tokens.
- This is a Hello World. Do **not** add extra pages, client-state libraries,
  or UI kits. Small and readable beats clever.
- Run `npm run build` before opening a PR.
- Keep **cross-app parity**: if you change shared copy or doc links, update
  the sibling `hello-world-*-app[-bindings]` apps too.

## Related docs

- [Webflow Cloud overview](https://developers.webflow.com/webflow-cloud)
- [Getting started](https://developers.webflow.com/webflow-cloud/getting-started)
- [Storing data overview](https://developers.webflow.com/webflow-cloud/storing-data/overview)
- [SQLite (D1)](https://developers.webflow.com/webflow-cloud/storing-data/sqlite)
- [Key Value Store](https://developers.webflow.com/webflow-cloud/storing-data/key-value-store)
- [Object Storage (R2)](https://developers.webflow.com/webflow-cloud/storing-data/object-storage)
- [Environments](https://developers.webflow.com/webflow-cloud/environments)
- [Deployments](https://developers.webflow.com/webflow-cloud/deployments)
- [Configuration](https://developers.webflow.com/webflow-cloud/environment/configuration)
- [Node.js compatibility](https://developers.webflow.com/webflow-cloud/environment/nodejs-compatibility)
- [Limits](https://developers.webflow.com/webflow-cloud/limits)
