---
sidebar_position: 2
title: Hosting and deployment
description: Deploying the admin and portal apps to production
---

# Hosting and deployment

Both apps are standard Next.js 16 applications and can be deployed to any platform that supports Next.js. This guide covers Vercel as the recommended option.

## Vercel deployment

### Initial setup

1. Import the monorepo into Vercel.
2. Create two separate projects — one for `admin`, one for `portal`.
3. For each project, set the **Root Directory** to the app's path:
   - Admin: `apps/admin`
   - Portal: `apps/portal`
4. Set the **Build Command** to `cd ../.. && npx turbo build --filter=<app-name>`.
5. Set the **Output Directory** to `.next`.

### Environment variables

Add all required environment variables in the Vercel dashboard under **Settings > Environment Variables** for each project. Use different values for preview and production environments where needed.

### Custom domains

| App | Suggested domain |
| --- | --- |
| Admin | `admin.yourgym.com` |
| Portal | `portal.yourgym.com` |

Configure these under **Settings > Domains** in each Vercel project.

## Supabase configuration

### Auth redirect URLs

Add your production and preview URLs to the Supabase **Auth > URL Configuration** settings:

- `https://admin.yourgym.com/**`
- `https://portal.yourgym.com/**`
- `https://*.vercel.app/**` (for preview deployments)

### Database schema

Both apps use the `gym` schema. Make sure your Supabase project has the schema created and migrations applied before the first deployment.

## CI/CD with Turborepo

Turborepo caches build outputs, so only changed apps rebuild. Vercel's Turborepo integration handles this automatically.

For other CI platforms, use Turborepo's remote caching:

```bash
npx turbo build --filter=admin --token=$TURBO_TOKEN --team=$TURBO_TEAM
```

:::tip
Enable Vercel's **Ignored Build Step** to skip builds when only the other app changed. Use Turborepo's `turbo-ignore` command:

```bash
npx turbo-ignore admin
```
:::
