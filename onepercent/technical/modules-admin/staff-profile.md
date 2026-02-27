---
sidebar_position: 11
title: Staff Profile
description: "How the staff profile module works — trainer directory, profile editing, avatar uploads, self-service profile modal, user management, and permission configuration."
---

# Staff profile

The staff profile module provides two distinct surfaces for managing staff data. The **Staff Profile page** is a trainer directory where admins view and edit staff profiles. The **Profile Modal** (accessible from the top navigation) lets any staff member edit their own profile. A related **User Management page** under system settings handles account creation, role assignment, permission configuration, and password resets.

**Route:** `apps/admin/src/app/(staff)/staff/profile/page.tsx` (~400 lines) <br />
**Permission module:** `staff-profile` (`can_view` for page access, `can_edit` for editing other staff profiles)

## Data fetching

### Current staff (self)

**Hook:** `src/hooks/use-current-staff.ts` (~151 lines)

Polls `GET /api/auth/me` via SWR to fetch the authenticated staff member's profile and merged permissions.

**SWR configuration:**
- `revalidateOnFocus: true`, `refreshInterval: 60_000` (60 seconds).
- `shouldRetryOnError: false`.

**Auth state listener:** A singleton `onAuthStateChange` listener syncs session to `/api/auth/set-session` on `SIGNED_IN`, `TOKEN_REFRESHED`, and `SIGNED_OUT` events, then revalidates the SWR cache.

**Error handling:**
- `401` — returns empty state (no staff).
- `403` — calls `supabase.auth.signOut()` automatically.

### Trainer list (directory)

**Hook:** `src/hooks/use-trainers.ts` (~141 lines)

Two exported hooks:

| Hook | Purpose |
| --- | --- |
| `useTrainerList()` | Lightweight query of `view_5_3_staff` for trainers, admins, and super admins. Returns profiles only. |
| `useTrainers()` | Full query that also joins schedules, appointments, and member packages to compute `totalClients` and `upcomingAppointments` per trainer. |

There are **no realtime subscriptions** on the staff profile page. Data is refreshed via the Refresh button.

## Staff data model

### `staff` table

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Same UUID as the Supabase Auth user. |
| `name` | String | Required. |
| `email` | String (nullable) | Used for auth matching (case-insensitive). |
| `category` | Enum | `trainer`, `admin`, or `super_admin`. |
| `status` | Enum | `active` or `inactive`. |
| `branch` | Enum (nullable) | `kota damansara`, `kepong`, `all branch`, or null. |
| `gender` | Enum (nullable) | `male` or `female`. |
| `contact` | String (nullable) | Stored in E.164 format (e.g., `60123456789`). |
| `specification` | String (nullable) | Newline-separated list of specializations and certifications. |
| `avatar_url` | String (nullable) | Public URL to `trainer_image` storage bucket. Includes `?t=timestamp` for cache busting. |
| `trainer_type` | Enum (nullable) | `full time` or `part time`. Trainer-specific. |
| `trainer_category` | Enum (nullable) | `junior`, `senior`, `master`, `grand master`, or `director`. Trainer rank for commission. |
| `created_at` | Timestamp | Auto-generated. |

### Staff categories

| Category | Access level |
| --- | --- |
| `trainer` | Limited — by default can't access system settings or edit other staff. |
| `admin` | Can edit trainers and themselves. Can view and manage most modules. |
| `super_admin` | Can edit anyone. Full system access. |

## Page layout

```
┌──────────────────────────────────────────────────────────┐
│  Staff Profile                              [Refresh]     │
├──────────────────────────────────────────────────────────┤
│  Search · Status · Branch · Gender                        │
├──────────────────────────────────────────────────────────┤
│  Trainer Card Grid (1 / 2 / 3 columns responsive)        │
│  - Avatar, name, status badge                             │
│  - Gender, branch, type, category tiles                   │
│  - Click card → TrainerDetailModal                        │
└──────────────────────────────────────────────────────────┘
```

### Filters (all client-side)

| Filter | Options |
| --- | --- |
| **Search** | Matches name or specification text. |
| **Status** | Active / Inactive. |
| **Branch** | Kepong / Kota Damansara. Disabled and pre-set for single-branch staff. |
| **Gender** | Male / Female. |

### Trainer card

Each card displays:

- Avatar (96x96 with cache-busting query param).
- Name and active/inactive badge.
- Four stat tiles: Gender, Branch, Type (`trainer_type`), Category (`trainer_category`).
- "Click to view details" hint.

## Trainer detail modal

**Component:** `src/components/trainers/trainer-detail-modal.tsx` (~1,024 lines)

A full-screen dialog showing one staff member's complete profile with inline editing.

### Sections

1. **Hero header** — dark gradient background with status badge and Edit/Save/Cancel buttons.
2. **Profile card** — avatar (128x128), name, email (read-only), phone, quick stats (`totalClients`, `upcomingAppointments`).
3. **Info grid** — Gender, Branch (read-only), Type, Category — all editable dropdowns in edit mode except Branch.
4. **Weekly schedule** — recurring schedules from `trainer_schedule`, showing time slots per day (Mon-Sun).
5. **Specific date schedules** — upcoming non-recurring schedule entries within the next 7 days.
6. **Specialization and certifications** — `specification` field rendered as badge chips (split by newline), editable textarea in edit mode.
7. **Assigned members** — derived from `view_4_1_2_member_package` where `trainer_id` matches the trainer, counting unique members.

### Editable fields

| Field | Editable | Notes |
| --- | --- | --- |
| `name` | Yes | Text input. |
| `email` | No | Always read-only. |
| `contact` | Yes | Country code selector + local number. Validated via `validatePhoneWithCountry` with 800ms debounce. |
| `gender` | Yes | Select dropdown. |
| `branch` | No | Always read-only. Only changeable via User Management. |
| `trainer_type` | Yes | Full time / Part time. |
| `trainer_category` | Yes | Junior through Director. |
| `specification` | Yes | Textarea, one item per line. |

**Save:** Updates the `staff` table directly via the Supabase browser client. Email and branch are never updated from this modal.

### Edit permission logic

```
canEditStaff = hasPermission("staff-profile", "edit")

canEditTrainer(trainer):
  - false if !canEditStaff
  - Super Admin: can edit anyone
  - Admin: can edit trainers or themselves
  - Trainer: canEditStaff is false by default
```

## Self-service profile modal

**Component:** `src/components/layout/profile-modal.tsx` (~831 lines)

Opened from the top navigation bar. Available to **all logged-in staff** regardless of module permissions.

### Profile information card

| Field | Editable | Notes |
| --- | --- | --- |
| **Full Name** | Yes | Min 2, max 100 characters. |
| **Email Address** | No | Always disabled, labeled "Read only." |
| **Contact Number** | Yes | Country code selector + local number with phone validation. |
| **Gender** | Yes | Select dropdown. |
| **Specialization** | Yes | Textarea, one item per line. Displayed as badges on the profile. |

**Save:** Calls `PATCH /api/auth/profile` with the updated fields.

### Change password card

| Field | Validation |
| --- | --- |
| **Current Password** | Verified by re-signing in via `supabase.auth.signInWithPassword()`. |
| **New Password** | Min 8 characters, requires uppercase + lowercase + digit. |
| **Confirm New Password** | Must match new password. Must differ from current. |

Validated with `passwordChangeSchema` (Zod). On success, calls `supabase.auth.updateUser()` directly.

### Avatar upload

Posts `multipart/form-data` to `POST /api/auth/profile` with the `avatar` field.

## Avatar upload

Two upload paths depending on context:

| Context | Endpoint | Auth |
| --- | --- | --- |
| Own profile (Profile Modal) | `POST /api/auth/profile` | Authenticated user, looks up staff by email. |
| Any staff (Trainer Detail Modal) | `POST /api/auth/staff/[staffId]/avatar` | Permission-gated: trainers for self only, admins for trainers or self, super admins for anyone. |

**Shared constraints:**

- Allowed types: JPEG, PNG, WebP, GIF.
- Max size: 5 MB.
- Storage bucket: `trainer_image`.
- Filename: `\{staffId\}.\{ext\}` with `upsert: true` (overwrites previous).
- Cache busting: `avatar_url` includes `?t=\{timestamp\}` in the database. The component adds an additional `?t=\{avatarCacheKey\}` state variable to force re-fetch after upload.

## Specialization field

The `specification` field stores specializations and certifications as newline-separated plain text.

**Storage format:**

```
ISSA Certified Personal Trainer
TRX Suspension Training
Nutrition Coaching
```

**Display:** Each line is parsed and rendered as a separate outline badge. Empty lines are filtered out.

**Editing:** A textarea with the placeholder "Enter each specialization or certification on a new line..." Available in both the Trainer Detail Modal and the self-service Profile Modal.

**Search:** The Staff Profile page search matches against `specification` text in addition to name.

## User management page

**Route:** `apps/admin/src/app/(staff)/settings/user-management/page.tsx` (~1,503 lines) <br />
**Permission module:** `system-settings` (`can_view` for page access, `can_edit` for modifications)

This page handles account-level operations that are intentionally separated from profile editing.

### Layout

Split-panel layout:

- **Left panel** — staff list with search, branch filter, and role filter. Each row shows name, email, status badge, role badge, and branch badge.
- **Right panel** — permission configuration table for the selected staff member.

### Configuration panel

For the selected staff, shows:

1. **Basic info row** — Role selector, Status selector, Branch selector (all editable dropdowns).
2. **Module permissions table** — all 13 modules in 5 categories with toggle switches for `view`, `edit`, `export`.

Modules with custom overrides (different from role defaults) are tagged with a red "CUSTOM" badge. A Quick Actions column (All / None) appears on row hover.

### Permission categories

| Category | Modules |
| --- | --- |
| Core | dashboard, analytics |
| Members and Leads | members, leads |
| Operations | operations-package, operations-payment, operations-appointment, operations-point-system |
| Staff Management | staff-trainer-schedule, staff-commission, staff-profile |
| Communication and Settings | chats, system-settings |

### Permission diff logic

When saving, permissions that match the role defaults are **deleted** from `staff_permissions` (no override needed). Only genuinely different permissions are upserted. This keeps the override table minimal.

### Add staff dialog

Two sections:

| Section | Fields |
| --- | --- |
| **Account** | Name (required), Email (required), Temporary Password (required), Contact Number (with country code), Branch Access, Role (required). |
| **Commission Setting** | Trainer Type (required if trainer), Trainer Category (required if trainer). Includes a warning about commission calculation impact. |

**Submit flow:**

1. Checks for duplicate email in `staff` table (returns 409 if found).
2. Creates Supabase Auth user via admin client (`email_confirm: true`, no invite email sent).
3. Inserts into `staff` table with `id = auth user id`, `status = 'active'`.
4. If `staff` insert fails, rolls back by deleting the auth user.

### Reset password dialog

A single new password field. Submits `PATCH /api/auth/staff/[staffId]/reset-password`. Available to admins and super admins only.

:::note
The admin password reset enforces only a minimum of 6 characters server-side. The self-service password change (in Profile Modal) enforces stronger requirements: min 8 characters with uppercase, lowercase, and digit.
:::

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/auth/me` | GET | Returns current staff profile and merged permissions. |
| `/api/auth/profile` | PATCH | Update own profile (name, contact, gender, specification). |
| `/api/auth/profile` | POST | Upload own avatar. |
| `/api/auth/staff` | GET | List all staff with merged permissions (admin only). |
| `/api/auth/staff` | POST | Create a new staff account (admin only). |
| `/api/auth/staff/[staffId]` | PATCH | Update role, status, branch, and permissions (admin only). |
| `/api/auth/staff/[staffId]/avatar` | POST | Upload avatar for a specific staff member (permission-gated). |
| `/api/auth/staff/[staffId]/reset-password` | PATCH | Reset password for another staff member (admin only). |

### Role hierarchy for staff editing

| Editor role | Can edit |
| --- | --- |
| Trainer | Only themselves (via Profile Modal, not API). |
| Admin | Trainers and themselves. Cannot edit other admins or super admins. |
| Super Admin | Anyone. |

## Validation

**File:** `src/lib/validations/auth.ts`

| Schema | Purpose |
| --- | --- |
| `profileUpdateSchema` | Self-service profile update. Validates `name` (min 2, max 100) + email. |
| `passwordChangeSchema` | Self-service password change. Current password required. New password: min 8, uppercase + lowercase + digit. Must differ from current. |
| `createStaffSchema` | New staff creation. Name, email, strong password, category, branch, gender. |
| `updateStaffSchema` | Staff update via User Management. All fields optional. |
| `passwordResetSchema` | Password reset via email link. Strong password + confirm. |

## Database views and tables

| Source | Purpose |
| --- | --- |
| `view_5_3_staff` (view) | Staff directory view. Used by `useTrainers()` and `useTrainerList()`. Returns all staff fields including `trainer_type` and `trainer_category`. |
| `staff` (table) | Core staff records. Write target for profile updates, account creation, and status changes. |
| `staff_permissions` (table) | Per-staff permission overrides. Written by User Management when permissions differ from role defaults. |
| `role_permissions` (table) | Default permissions per role. Read by `/api/auth/me` and `/api/auth/staff` to compute merged permissions. |

**Storage bucket:** `trainer_image` — staff avatar images.

## Component files

| File | Purpose |
| --- | --- |
| `staff/profile/page.tsx` | Trainer directory grid with search, filters, and card layout (~400 lines). |
| `trainers/trainer-detail-modal.tsx` | Full-screen profile modal with inline editing, schedule display, and assigned members (~1,024 lines). |
| `layout/profile-modal.tsx` | Self-service profile editor from top nav. Profile info + password change (~831 lines). |
| `settings/user-management/page.tsx` | Split-panel user management with staff list, permission table, add staff dialog, and password reset (~1,503 lines). |
| `hooks/use-current-staff.ts` | SWR hook for authenticated staff profile and permissions (~151 lines). |
| `hooks/use-trainers.ts` | Trainer list hooks with optional schedule and stats joins (~141 lines). |
| `lib/validations/auth.ts` | Zod schemas for profile updates, password changes, and staff CRUD. |
