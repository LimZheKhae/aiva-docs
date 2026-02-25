---
sidebar_position: 2
title: Hosting and deployment
description: "How the admin and portal apps are deployed — Vercel for staging, Hostinger VPS for production, build configuration, and environment setup."
---

# Hosting and deployment

The project uses a two-environment deployment strategy:

| Environment | Platform | Purpose |
| --- | --- | --- |
| **Staging** | Vercel | Preview deployments, branch testing, and QA. |
| **Production** | Hostinger VPS | Live deployment serving real users. |

Both apps are Next.js 16 applications built with Turbopack. The main branch is `master`.

## Build configuration

### TypeScript strictness

TypeScript errors **fail the production build**. The admin app's `next.config.ts` sets:

```typescript
typescript: {
  ignoreBuildErrors: false,
}
```

Fix all type errors before deploying.

### Turbopack

Both apps use Turbopack for builds (`next build --turbopack` in each app's build script). Turborepo orchestrates builds across the monorepo and caches outputs — only changed apps rebuild.

### Build commands

```bash
# Build both apps
npm run build

# Build runs turbo, which builds dependencies (@repo/database, @repo/invoice-pdf)
# before building the apps that depend on them
```

### Build outputs

Turborepo caches `.next/**` (excluding `.next/cache/**`) and `dist/**` as defined in `turbo.json`.

## Staging — Vercel

### Initial setup

1. Import the monorepo into Vercel.
2. Create **two separate projects** — one for admin, one for portal.
3. For each project, set the **Root Directory** to the app's path:
   - Admin: `apps/admin`
   - Portal: `apps/portal`
4. Vercel auto-detects the Next.js framework. No custom build or output directory settings are needed.

:::note
There's no `vercel.json` in the project. Vercel's auto-detection handles the build pipeline using Turborepo's configuration in `turbo.json`.
:::

### Environment variables

Add all required environment variables in each Vercel project under **Settings > Environment Variables**. Use staging-specific values (e.g., a separate Supabase project for staging).

### Selective builds

To skip builds when only the other app changed, enable Vercel's **Ignored Build Step** with:

```bash
npx turbo-ignore admin
```

## Production — Hostinger VPS

### Server requirements

- **Node.js 20+** — required by Next.js 16.
- **npm 10+** — the monorepo uses npm workspaces.
- **Process manager** — PM2 or similar to keep the apps running.
- **Reverse proxy** — Nginx to route traffic and handle SSL.

### Deploy steps

1. Clone or pull the latest code on the VPS:

```bash
git clone <repo-url> /var/www/onepercent
cd /var/www/onepercent
npm install
```

2. Create `.env.local` files for each app with production values:

```bash
# apps/admin/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
WAHA_API_URL=http://localhost:3001
WAHA_API_KEY=your_waha_key
RESEND_API_KEY=your_resend_key

# apps/portal/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. Build both apps:

```bash
npm run build
```

4. Start with PM2:

```bash
# Admin on port 3000
pm2 start npm --name "admin" -- run start --prefix apps/admin

# Portal on port 3002
pm2 start npm --name "portal" -- run start --prefix apps/portal

# Save PM2 process list for auto-restart on reboot
pm2 save
pm2 startup
```

### Nginx reverse proxy

Configure Nginx to route traffic from your domains to the Next.js apps:

```nginx
# Admin app
server {
    listen 443 ssl;
    server_name admin.yourgym.com;

    ssl_certificate /etc/letsencrypt/live/admin.yourgym.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourgym.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Portal app
server {
    listen 443 ssl;
    server_name portal.yourgym.com;

    ssl_certificate /etc/letsencrypt/live/portal.yourgym.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.yourgym.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

:::tip
Use Certbot to generate free SSL certificates from Let's Encrypt:

```bash
sudo certbot --nginx -d admin.yourgym.com -d portal.yourgym.com
```
:::

### Updating production

```bash
cd /var/www/onepercent
git pull origin master
npm install
npm run build
pm2 restart all
```

## Supabase configuration

### Auth redirect URLs

Add your production, staging, and preview URLs to the Supabase **Auth > URL Configuration** settings:

- `https://admin.yourgym.com/**`
- `https://portal.yourgym.com/**`
- `https://*.vercel.app/**` (for Vercel staging/preview deployments)

### Image remote patterns

The admin app's `next.config.ts` allows images from Supabase Storage:

```typescript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "your-project-id.supabase.co",
      pathname: "/storage/v1/object/public/**",
    },
  ],
}
```

Update the hostname to match your Supabase project URL if it differs.

## Tech stack versions

| Component | Version |
| --- | --- |
| Next.js | ^16.1.4 |
| React | 19.1.0 |
| TypeScript | ^5 |
| Tailwind CSS | ^4 |
| Turborepo | ^2.8.3 |
| npm | 10.0.0 |
