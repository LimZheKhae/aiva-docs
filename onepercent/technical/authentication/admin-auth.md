---
sidebar_position: 2
title: Admin auth flow
description: Authentication flow for the staff-facing admin application
---

# Admin auth flow

The admin app authenticates staff via email/password against Supabase Auth, then validates that the user has an active staff profile before granting access.

## Login flow

1. Staff enters email and password in `LoginForm`
2. Client calls `supabase.auth.signInWithPassword()`
3. On success, client posts the session to `/api/auth/set-session` to sync cookies
4. Client calls `/api/auth/me` to verify the staff profile exists and is active
5. If valid, SWR cache is populated and user redirects to `/dashboard`
6. If staff profile is missing or inactive, the user sees an error and is signed out

```ts
// Simplified login flow from login-form.tsx
const { error } = await supabase.auth.signInWithPassword({ email, password });

// Sync session to server cookies
await fetch("/api/auth/set-session", {
  method: "POST",
  body: JSON.stringify({ event: "SIGNED_IN", session }),
});

// Verify staff profile and load permissions
const response = await fetch("/api/auth/me");
const data = await response.json(); // { user, staff, permissions }
```

## Staff validation

The `/api/auth/me` endpoint does more than check auth -- it also validates the staff profile:

1. Calls `supabase.auth.getUser()` to verify the JWT
2. Queries `gym.staff` by email (case-insensitive)
3. Checks that `status === "active"`
4. Loads role permissions and staff overrides
5. Returns merged permissions via `mergePermissions()`

If any step fails, the endpoint returns `401` (no session) or `403` (no active staff).

## Auth endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/auth/set-session` | POST | Sync browser JWT to server cookies |
| `/api/auth/me` | GET | Get current user, staff profile, and permissions |
| `/api/auth/staff` | GET | List all staff (admin only) |
| `/api/auth/staff/[staffId]` | GET, PATCH | Get or update a staff member |
| `/api/auth/staff/[staffId]/avatar` | POST | Upload staff avatar |
| `/api/auth/staff/[staffId]/reset-password` | POST | Reset a staff member's password |

## Client-side state

The `useCurrentStaff` hook uses SWR to keep staff data fresh on the client:

```ts
const { staff, permissions, isLoading } = useCurrentStaff();
```

This hook polls `/api/auth/me` at a regular interval to keep the session and permissions in sync.
