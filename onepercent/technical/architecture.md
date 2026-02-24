---
sidebar_position: 1
title: Architecture overview
description: System architecture of the Onepercent gym management platform
---

# Architecture overview

Onepercent is a Turborepo monorepo with two Next.js 16 applications that share a Supabase backend.

## Apps

| App | Purpose | Users | Route |
| --- | --- | --- | --- |
| `admin` | Staff dashboard for gym operations | Staff, managers, owners | `admin.yourgym.com` |
| `portal` | Member self-service app | Gym members | `portal.yourgym.com` |

## Monorepo structure

```
onepercent/
├── apps/
│   ├── admin/          # Staff-facing Next.js app
│   └── portal/         # Member-facing Next.js app
├── packages/           # Shared packages
├── turbo.json          # Turborepo pipeline config
└── package.json        # Root workspace config
```

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Monorepo | Turborepo |
| Auth | Supabase Auth (JWT, PKCE) |
| Database | Supabase PostgreSQL (`gym` schema) |
| Styling | Tailwind CSS, shadcn/ui |
| State | SWR for client-side data fetching |
| Language | TypeScript |

## Database schema

Both apps connect to the same Supabase project using a custom `gym` schema (not the default `public` schema). Key tables include:

- `gym.staff`: staff profiles, roles, and status
- `gym.members`: member profiles and contact info
- `gym.role_permissions`: default permissions per role
- `gym.staff_permissions`: per-staff permission overrides

## Authentication model

The two apps use separate auth flows with distinct cookie names to avoid session conflicts:

- **Admin**: `admin-auth` cookie, email/password login, staff validation
- **Portal**: `portal-auth` cookie, email/password login, member validation

See [Authentication overview](./authentication/overview) for details.
