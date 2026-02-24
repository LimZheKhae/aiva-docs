---
sidebar_position: 1
title: Environment setup
description: Environment variables and local development configuration
---

# Environment setup

Both the admin and portal apps require environment variables for Supabase, authentication, and app-specific settings.

## Required variables

### Shared (both apps)

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

### Admin app

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Admin app URL (e.g., `https://admin.yourgym.com`) |
| `ADMIN_COOKIE_NAME` | Cookie name for admin sessions (default: `admin-auth`) |

### Portal app

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Portal app URL (e.g., `https://portal.yourgym.com`) |
| `PORTAL_COOKIE_NAME` | Cookie name for portal sessions (default: `portal-auth`) |

## Local development

1. Clone the monorepo and install dependencies:

```bash
git clone <repo-url>
cd onepercent
npm install
```

2. Copy the example env file in each app:

```bash
cp apps/admin/.env.example apps/admin/.env.local
cp apps/portal/.env.example apps/portal/.env.local
```

3. Fill in your Supabase credentials from the [Supabase dashboard](https://supabase.com/dashboard) under **Settings > API**.

4. Start the dev server:

```bash
# Run both apps
npx turbo dev

# Run a specific app
npx turbo dev --filter=admin
npx turbo dev --filter=portal
```

:::caution
Never commit `.env.local` files. They are already in `.gitignore`, but double-check before pushing.
:::
