---
sidebar_position: 13
title: System Settings
description: "How the system settings module works — user management, role-based access control, permission configuration, staff account creation, password resets, and the two-tier permission system."
---

# System settings

The system settings module is the admin app's control center for staff accounts and permissions. It contains a single page — **User Management** — where admins create staff accounts, assign roles, configure per-module permissions, reset passwords, and manage branch access. The `/settings` route redirects directly to `/settings/user-management`.

**Route:** `apps/admin/src/app/(staff)/settings/user-management/page.tsx` (~1,503 lines) <br />
**Permission module:** `system-settings` (`can_view` for page access, `can_edit` for modifications)

## Data fetching

The user management page fetches data through API routes — not SWR hooks or direct Supabase queries.

| Source | Endpoint | Purpose |
| --- | --- | --- |
| Staff list | `GET /api/auth/staff` | All staff with merged permissions. Admin or super admin only. |
| Save changes | `PATCH /api/auth/staff/[staffId]` | Update role, status, branch, and permissions. |
| Create staff | `POST /api/auth/staff` | Create a new staff account. |
| Reset password | `PATCH /api/auth/staff/[staffId]/reset-password` | Reset another staff member's password. |

There are **no SWR hooks**, **no realtime subscriptions**, and **no polling** on this page. Data refreshes when you save changes or click Refresh.

## Page layout

```
┌──────────────────────────────────────────────────────────────────┐
│  User Management                                [Add Staff]       │
├────────────────┬─────────────────────────────────────────────────┤
│  Staff List    │  Configuration Panel                             │
│                │                                                  │
│  [Search]      │  Staff Name · Email                              │
│  [Branch ▼]    │  ┌──────────────────────────────────────────┐   │
│  [Role ▼]      │  │  Role ▼    Status ▼    Branch ▼          │   │
│                │  └──────────────────────────────────────────┘   │
│  ┌──────────┐  │                                                  │
│  │ Staff 1  │  │  Module Permissions Table                        │
│  │ Staff 2  │◄─│  ┌────────────┬──────┬──────┬────────┬──────┐  │
│  │ Staff 3  │  │  │ Module     │ View │ Edit │ Export │ Quick│  │
│  │ ...      │  │  ├────────────┼──────┼──────┼────────┼──────┤  │
│  └──────────┘  │  │ Dashboard  │  ✓   │  ✓   │   ✗    │ All  │  │
│                │  │ Analytics  │  ✓   │  ✗   │   ✗    │ None │  │
│                │  │ ...        │      │      │        │      │  │
│                │  └────────────┴──────┴──────┴────────┴──────┘  │
│                │                                                  │
│                │  [Save]  [Cancel]  [Reset Password]              │
├────────────────┴─────────────────────────────────────────────────┤
│  (Mobile: staff list opens as overlay sheet)                      │
└──────────────────────────────────────────────────────────────────┘
```

Split-panel layout — staff list on the left, configuration panel on the right. On mobile, the staff list opens as an overlay with a backdrop.

### Staff list panel

Each staff row shows:

- Name with a red dot indicator if there are unsaved changes.
- Email (truncated).
- Status badge (active/inactive), role badge, and branch badge.
- Red left border on the selected row.

### Filters

| Filter | Options |
| --- | --- |
| **Search** | Matches name or email. Debounced at 300 ms. |
| **Branch** | Kota Damansara / Kepong / All Branch. |
| **Role** | Trainer / Admin / Super Admin. |

All filters are client-side against the loaded staff list.

## Two-tier permission system

Permissions use a **role defaults + staff overrides** architecture. This is the core design pattern of the module.

### Tier 1: role defaults

The `role_permissions` table defines default permissions for each role (`trainer`, `admin`, `super_admin`). Every staff member inherits their role's defaults.

### Tier 2: staff overrides

The `staff_permissions` table stores per-staff permission overrides. When present, an override **completely replaces** the role default for that module.

### Merge algorithm

The `mergePermissions()` function in `src/lib/rbac.ts` combines both tiers:

1. Load role defaults for the staff member's role. Tag each with `source: "role"`.
2. Load staff overrides from `staff_permissions`. Tag each with `source: "override"`.
3. Overrides replace role defaults for the same module.
4. Modules with no entry in either table get all-false permissions.
5. Return the complete permission array, ordered by `MODULE_KEYS`.

### Smart permission storage

When saving permissions, the API compares each module's permissions against the role defaults:

- If the permission **matches** the role default, the override is **deleted** from `staff_permissions`.
- If the permission **differs** from the role default, it's **upserted** as an override.

This keeps the `staff_permissions` table minimal — only genuinely custom permissions are stored.

## Permission modules

13 modules organized into 5 categories, each with three permission actions (`can_view`, `can_edit`, `can_export`):

| Category | Modules |
| --- | --- |
| **Core** | `dashboard`, `analytics` |
| **Members and Leads** | `members`, `leads` |
| **Operations** | `operations-package`, `operations-payment`, `operations-appointment`, `operations-point-system` |
| **Staff Management** | `staff-trainer-schedule`, `staff-commission`, `staff-profile` |
| **Communication and Settings** | `chats`, `system-settings` |

### Permission actions

| Action | Purpose |
| --- | --- |
| `can_view` | Access to the module page. Checked by `ModuleAccessBoundary` and sidebar visibility. |
| `can_edit` | Create, update, and delete operations within the module. |
| `can_export` | Export data (Excel, PDF) from the module. |

### Permission table UI

The configuration panel shows all 13 modules in a table with toggle switches for each action. Features include:

- **CUSTOM badge** — red badge on modules where staff has an override different from the role default.
- **Quick actions** — "All" and "None" buttons appear on row hover to set all three permissions at once.
- **Category headers** — visual separators group modules by category.
- **Dirty indicator** — a red dot on the staff name in the list signals unsaved changes.

## Configuration panel

For the selected staff member, the configuration panel shows:

### Basic info row

| Field | Editable | Notes |
| --- | --- | --- |
| **Role** | Yes | Dropdown: Trainer, Admin, Super Admin. |
| **Status** | Yes | Dropdown: Active, Inactive. |
| **Branch** | Yes | Dropdown: Kota Damansara, Kepong, All Branch. |

### Actions

| Button | Purpose |
| --- | --- |
| **Save** | Sends `PATCH /api/auth/staff/[staffId]` with role, status, branch, and permissions. |
| **Cancel** | Discards unsaved changes and reloads the staff data. |
| **Reset Password** | Opens the reset password dialog. |

## Add staff dialog

Two sections in the dialog:

### Account information

| Field | Required | Validation |
| --- | --- | --- |
| **Name** | Yes | Non-empty. |
| **Email** | Yes | Valid email format. |
| **Temporary Password** | Yes | Minimum 8 characters. |
| **Contact Number** | Yes | Country code selector + local number. Validated with `validatePhoneWithCountry()` at 800 ms debounce. Auto-corrects valid numbers. |
| **Branch Access** | No | Kota Damansara / Kepong / All Branch. |
| **Role** | Yes | Trainer / Admin / Super Admin. |

Supported country codes: MY (+60), SG (+65), CN (+86), AU (+61), ID (+62), IN (+91), JP (+81), KR (+82), PH (+63), TH (+66), UK (+44), US (+1), VN (+84).

### Commission setting

| Field | Required | Validation |
| --- | --- | --- |
| **Trainer Type** | If trainer | Full Time / Part Time. |
| **Trainer Category** | If trainer | Junior / Senior / Master / Grand Master / Director. |

A warning box reminds you that these fields affect commission calculation.

### Submit flow

1. Validates all required fields, including phone number.
2. Checks for duplicate email in the `staff` table (returns 409 if found).
3. Creates a Supabase Auth user via the admin client with `email_confirm: true` (no invite email sent).
4. Inserts into the `staff` table with `id = auth user id` and `status = 'active'`.
5. If the `staff` insert fails, rolls back by deleting the auth user.

## Reset password dialog

A single password field with a minimum of 6 characters. Submits `PATCH /api/auth/staff/[staffId]/reset-password`.

The flow:

1. Looks up the target staff's email from the `staff` table.
2. Finds the matching Supabase Auth user by email (case-insensitive).
3. Updates the auth user's password via the Supabase admin API.

:::note
The admin password reset enforces only 6 characters minimum. The self-service password change (in the Profile Modal) enforces stronger requirements: minimum 8 characters with uppercase, lowercase, and digit.
:::

## Role hierarchy

The API enforces a strict hierarchy for staff editing:

| Editor role | Can edit |
| --- | --- |
| **Super Admin** | Anyone — trainers, admins, and other super admins. |
| **Admin** | Trainers and themselves. Cannot edit other admins or super admins. |
| **Trainer** | No one (via this page). Can only edit themselves via the Profile Modal. |

This hierarchy is enforced server-side in `PATCH /api/auth/staff/[staffId]`. Attempting to edit above your role returns 403.

## RBAC helper functions

**File:** `src/lib/rbac.ts` (~112 lines)

| Export | Purpose |
| --- | --- |
| `MODULE_KEYS` | Const array of all 13 module key strings. |
| `ModuleKey` | TypeScript type derived from `MODULE_KEYS`. |
| `PermissionAction` | Union type: `"view"` \| `"edit"` \| `"export"`. |
| `GranularPermissions` | Interface with `module`, `can_view`, `can_edit`, `can_export`, and `source` ("role" or "override"). |
| `mergePermissions(rolePerms, staffPerms)` | Merges role defaults with staff overrides. Returns ordered `GranularPermissions[]`. |
| `hasPermission(permissions, module, action)` | Checks if a specific action is allowed for a module. |
| `canAccessModule(permissions, module)` | Shorthand for `hasPermission(permissions, module, "view")`. |

### Authorization layers

The system enforces permissions at three layers:

| Layer | Mechanism | Purpose |
| --- | --- | --- |
| **Middleware** | `middleware.ts` | Verifies auth session, staff record exists, and status is active. Redirects to `/login` if not. |
| **Component** | `ModuleAccessBoundary` | Wraps protected pages. Checks `canAccessModule()` and shows an access denied screen if unauthorized. |
| **API** | Route handlers | Each API route independently verifies auth, staff status, and role hierarchy. |

## Current staff hook

**Hook:** `src/hooks/use-current-staff.ts` (~151 lines)

Every protected page uses `useCurrentStaff()` to access the authenticated staff member's profile and permissions.

**SWR configuration:**

- `revalidateOnFocus: true`, `refreshInterval: 60_000` (60 seconds).
- `shouldRetryOnError: false`, `errorRetryCount: 0`.
- `dedupingInterval: 5_000` (prevents duplicate requests within 5 seconds).

**Key behaviors:**

- Fetches `GET /api/auth/me` which returns the staff profile with merged permissions.
- A singleton `onAuthStateChange` listener syncs session changes (`SIGNED_IN`, `TOKEN_REFRESHED`, `SIGNED_OUT`) and revalidates the SWR cache.
- `401` response returns empty state (no staff).
- `403` response triggers `supabase.auth.signOut()` automatically.

**Returned helpers:**

- `hasPermission(module, action)` — checks a specific permission.
- `canAccessModule(module)` — checks if the staff can view a module.
- `refresh()` — force re-fetch the profile and permissions.

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/auth/me` | GET | Returns the current staff profile with merged permissions. Used by `useCurrentStaff()`. |
| `/api/auth/staff` | GET | Lists all staff with merged permissions. Admin or super admin only. |
| `/api/auth/staff` | POST | Creates a new staff account (auth user + staff record). Admin or super admin only. |
| `/api/auth/staff/[staffId]` | PATCH | Updates role, status, branch, and permissions for a staff member. Role hierarchy enforced. |
| `/api/auth/staff/[staffId]/reset-password` | PATCH | Resets a staff member's password. Admin or super admin only. |

### GET /api/auth/staff response

Returns staff with their complete merged permissions:

```json
{
  "staff": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "category": "trainer",
      "status": "active",
      "branch": "kota damansara",
      "permissions": [
        {
          "module": "members",
          "can_view": true,
          "can_edit": false,
          "can_export": false,
          "source": "role"
        }
      ]
    }
  ]
}
```

The `source` field indicates whether a permission comes from the role default or a staff override.

### PATCH /api/auth/staff/[staffId] payload

```json
{
  "category": "admin",
  "status": "active",
  "branch": "kota damansara",
  "permissions": [
    {
      "module": "members",
      "can_view": true,
      "can_edit": true,
      "can_export": false
    }
  ]
}
```

All fields are optional. The API only updates fields that are present in the payload.

## Validation

**File:** `src/lib/validations/auth.ts`

| Schema | Purpose |
| --- | --- |
| `createStaffSchema` | New staff creation. Validates name, email, strong password, category, branch, and gender. |
| `updateStaffSchema` | Staff update via user management. All fields optional. |
| `passwordResetSchema` | Admin password reset. Minimum 6 characters. |

:::note
Phone validation uses `validatePhoneWithCountry()` with real-time feedback (800 ms debounce) rather than a Zod schema. The validator auto-corrects valid numbers and shows inline errors for invalid ones.
:::

## Database tables

| Source | Purpose |
| --- | --- |
| `staff` (table) | Core staff records. Write target for account creation, role/status/branch changes. Keyed by Supabase Auth user ID. |
| `role_permissions` (table) | Default permissions per role. Composite key: `(role, module)`. Read by `/api/auth/me` and `/api/auth/staff` to compute merged permissions. |
| `staff_permissions` (table) | Per-staff permission overrides. Composite key: `(staff_id, module)`. Written by the user management page when permissions differ from role defaults. |

## Component files

| File | Purpose |
| --- | --- |
| `settings/user-management/page.tsx` | Split-panel user management with staff list, permission table, add staff dialog, and password reset (~1,503 lines). |
| `layout/module-access-boundary.tsx` | Client component wrapper that enforces module access permissions. Shows access denied or loading screen. |
| `hooks/use-current-staff.ts` | SWR hook for the authenticated staff's profile and merged permissions. Singleton auth listener with 60-second polling (~151 lines). |
| `lib/rbac.ts` | Module keys, permission types, merge algorithm, and helper functions (~112 lines). |
| `lib/validations/auth.ts` | Zod schemas for staff creation, updates, and password operations. |
