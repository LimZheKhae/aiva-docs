---
sidebar_position: 1
title: Authentication
description: "How portal authentication works — member login, forgot password, password reset, auth callback, session management, and middleware protection."
---

# Authentication

The portal authenticates members via email and password through Supabase Auth. Members log in at `/login`, reset passwords through an email flow, and access protected routes under the `(protected)` route group. The root `/` path redirects to `/schedule`.

## Routes

| Route | File | Lines | Purpose |
| --- | --- | --- | --- |
| `/login` | `app/login/page.tsx` | ~503 | Email/password login form. |
| `/forgot-password` | `app/forgot-password/page.tsx` | ~320 | Email verification and reset link. |
| `/reset-password` | `app/reset-password/page.tsx` | ~445 | New password form after clicking reset link. |
| `/auth/callback` | `app/(auth)/auth/callback/page.tsx` | ~127 | OAuth/PKCE code exchange handler. |

## Login page

**Route:** `apps/portal/src/app/login/page.tsx` (~503 lines)

Custom login form with email and password fields. Calls `supabaseBrowser.auth.signInWithPassword()` on submit.

### Features

- Password visibility toggle.
- Forgot password link to `/forgot-password`.
- Premium mountain background with gradients.

### Error handling

The login page reads URL query parameters to display contextual messages:

| Parameter | Message |
| --- | --- |
| `error=unauthorized` | Session expired or unauthorized. |
| `error=no_account` | No member account found. |
| `error=auth_error` | Authentication error. |
| `error=otp_expired` | Reset link expired. |
| `message=account_ready` | Account is ready, please log in. |
| `message=password_updated` | Password updated successfully. |
| `message=check_email` | Check email for reset link. |

### Post-login flow

1. Member enters email and password.
2. `signInWithPassword()` authenticates against Supabase Auth.
3. Middleware validates the member exists in the `member` table and is active.
4. Redirects to `/schedule` (or the `redirect` query parameter if present).

## Forgot password

**Route:** `apps/portal/src/app/forgot-password/page.tsx` (~320 lines)

1. Member enters their email.
2. The page calls `/api/auth/check-email` to verify the email belongs to an existing member.
3. If valid, calls `supabaseBrowser.auth.resetPasswordForEmail()` with `redirectTo` pointing to `/auth/callback?next=/reset-password`.
4. Shows a success message telling the member to check their email.

## Reset password

**Route:** `apps/portal/src/app/reset-password/page.tsx` (~445 lines)

Handles two scenarios based on the `type` query parameter:

| Scenario | `type` param | Context |
| --- | --- | --- |
| **New account setup** | `invite` | Staff created the account via admin. Member sets their first password. |
| **Password reset** | (absent) | Member clicked a forgot password link. |

### Validation

- Minimum 8 characters.
- New password and confirm password must match.

### Flow

1. Validates the session via `supabaseBrowser.auth.getSession()`.
2. Member enters and confirms their new password.
3. Calls `supabaseBrowser.auth.updateUser()` with the new password.
4. Signs out and redirects to `/login?message=password_updated` (reset) or `/login?message=account_ready` (invite).

## Auth callback

**Route:** `apps/portal/src/app/(auth)/auth/callback/page.tsx` (~127 lines)

Handles two OAuth flows:

| Flow | Trigger | How it works |
| --- | --- | --- |
| **PKCE code exchange** | Portal forgot password | Reads `code` query parameter. Calls `exchangeCodeForSession()` server action. |
| **Implicit grant** | Admin invite or admin-initiated reset | Reads `access_token` and `refresh_token` from URL hash fragment. Calls `setSession()` on the Supabase client. |

After successful session establishment, redirects to the `next` query parameter or `/schedule` as the default.

## Middleware

The portal middleware protects all routes under the `(protected)` route group:

1. Checks for an authenticated Supabase session.
2. Verifies the member exists in the `member` table.
3. If unauthenticated, redirects to `/login` with the current path as a `redirect` parameter.

## Supabase clients

The portal uses three Supabase client implementations:

| Client | File | Usage |
| --- | --- | --- |
| **Browser client** | `src/lib/supabase-browser.ts` | Client components — login, forgot password, auth callback, all hooks. |
| **Server client** | `src/lib/supabase-server.ts` | Server components and server actions — `exchangeCodeForSession()`, check-in, profile updates. |
| **Admin client** | `src/lib/supabase-admin.ts` | Service role operations bypassing RLS (rarely used in portal). |

## Component files

| File | Purpose |
| --- | --- |
| `app/login/page.tsx` | Email/password login with error/success messages (~503 lines). |
| `app/forgot-password/page.tsx` | Email verification and reset link sender (~320 lines). |
| `app/reset-password/page.tsx` | New password form for resets and invites (~445 lines). |
| `app/(auth)/auth/callback/page.tsx` | PKCE and implicit grant session exchange (~127 lines). |
