---
sidebar_position: 1
title: Environment setup
description: "How to set up local development — cloning the monorepo, configuring environment variables, and running the dev server."
---

# Environment setup

Both the admin and portal apps require environment variables for Supabase connectivity. The admin app has additional variables for WhatsApp and email integrations.

## Prerequisites

- **Node.js 20+** — required by Next.js 16.
- **npm 10+** — the monorepo uses npm workspaces (pinned to `npm@10.0.0` in `package.json`).
- **Supabase project** — you need a Supabase project with the `gym` schema created and migrations applied.

## Clone and install

```bash
git clone <repo-url>
cd onepercent
npm install
```

Turborepo and all workspace dependencies install automatically.

## Environment variables

Create a `.env.local` file in each app directory. The portal includes a `.env.example` you can copy. The admin app doesn't have one — create it manually.

```bash
cp apps/portal/.env.example apps/portal/.env.local
```

### Shared variables (both apps)

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxxx.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public API key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key. Server-side only — never expose to the browser. |

Find these in your Supabase dashboard under **Settings > API**.

### Admin-only variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `WAHA_API_URL` | No | `http://localhost:3000` | WAHA (WhatsApp HTTP API) server URL. |
| `WAHA_API_KEY` | No | — | API key for WAHA authentication. |
| `RESEND_API_KEY` | No | — | Resend email service key for invoice emails and portal invitations. |

:::warning
Never commit `.env.local` files. They're already in `.gitignore`, but double-check before pushing.
:::

## Run the dev server

```bash
# Run both apps simultaneously
npm run dev

# Run only the admin app (port 3000)
npm run dev:admin

# Run only the portal app (port 3002)
npm run dev:portal
```

Both apps use **Turbopack** for faster development builds (enabled via the `--turbopack` flag in each app's dev script).

## Other commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Production build for both apps. |
| `npm run type-check` | Run TypeScript type checking across all packages. |
| `npm run lint` | Run ESLint across all packages. |
| `npm run types:generate` | Regenerate database types from the Supabase `gym` schema into `packages/database/src/database.types.ts`. |
| `npm run clean` | Remove all `.next` build outputs and `node_modules`. |

## Supabase client configuration

Both apps configure their Supabase clients to use the `gym` schema (not the default `public` schema). Each app uses a separate auth cookie to avoid session conflicts:

| App | Cookie name |
| --- | --- |
| Admin | `admin-auth` |
| Portal | `portal-auth` |

This means you can be logged into both apps simultaneously without session conflicts.
