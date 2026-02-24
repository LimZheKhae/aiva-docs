---
sidebar_position: 1
title: Authentication overview
description: How authentication works across the admin and portal apps
---

# Authentication overview

Onepercent uses Supabase Auth with JWT tokens and server-side session management. The admin and portal apps each maintain their own auth flow with separate cookie namespaces.

## Two-app auth model

| | Admin app | Portal app |
| --- | --- | --- |
| **Users** | Staff (trainers, managers, owners) | Gym members |
| **Login method** | Email/password | Email/password |
| **Cookie name** | `admin-auth` | `portal-auth` |
| **Session sync** | Browser to server via `/api/auth/set-session` | Browser to server via `/api/auth/set-session` |
| **Validation** | Staff profile lookup + RBAC permissions | Member profile lookup |

## Auth flow (admin)

```
Browser                        Server                    Supabase
  │                              │                          │
  ├─ signInWithPassword() ──────────────────────────────────►
  │                              │                          │
  ◄──────────────────────── JWT tokens ─────────────────────┤
  │                              │                          │
  ├─ POST /api/auth/set-session ─►                          │
  │   { event, session }         ├─ supabase.auth.setSession()
  │                              │                          │
  ├─ GET /api/auth/me ───────────►                          │
  │                              ├─ getUser()               │
  │                              ├─ query staff profile     │
  │                              ├─ query permissions       │
  │                              ├─ mergePermissions()      │
  ◄──── { user, staff, perms } ──┤                          │
  │                              │                          │
  ├─ redirect to /dashboard      │                          │
```

## Key files (admin)

| File | Purpose |
| --- | --- |
| `lib/supabase-server.ts` | Server-side Supabase client with `admin-auth` cookie |
| `lib/supabase-browser.ts` | Browser-side Supabase client |
| `lib/rbac.ts` | Permission merging and checking utilities |
| `app/api/auth/set-session/route.ts` | Syncs browser JWT to server cookies |
| `app/api/auth/me/route.ts` | Returns current user, staff profile, and permissions |
| `hooks/use-current-staff.ts` | SWR hook for client-side staff data |
| `components/auth/login-form.tsx` | Login form with session sync logic |

## Session management

After login, the browser-side JWT needs to be synced to the server for SSR and API routes. This happens via a `POST /api/auth/set-session` call that sets HTTP-only cookies.

The server client uses `@supabase/ssr` with cookie-based session storage:

```ts
// lib/supabase-server.ts
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: { get, set, remove },
    cookieOptions: { name: "admin-auth" },
    db: { schema: "gym" },
  });
}
```

## RBAC

The admin app uses role-based access control with 13 modules and 3 actions per module (`view`, `edit`, `export`). Permissions come from two sources:

1. **Role defaults** (`role_permissions` table): base permissions for each staff category
2. **Staff overrides** (`staff_permissions` table): per-staff customizations

The `mergePermissions()` function combines them, with staff overrides taking priority.

See [RBAC](./rbac) for the full permission system documentation.
