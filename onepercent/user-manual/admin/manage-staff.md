---
sidebar_position: 11
title: Manage staff and permissions
description: "How to manage staff accounts — add new staff, assign roles, configure per-module permissions, and reset passwords."
---

# Manage staff and permissions

Create staff accounts, assign roles, and fine-tune what each person can access. The system uses a two-tier permission model — role defaults plus optional per-staff overrides.

## Before you begin

- You need `can_view` permission on the **System Settings** module to see staff accounts.
- You need `can_edit` permission to create, modify, or manage permissions.
- You must be an **Admin** or **Super Admin** to access this page.

## View staff

1. Click **System Settings** in the sidebar (navigates to User Management).
1. The left panel lists all staff members with their name, role, status, and branch.

<!-- ![User management page](./assets/manage-staff-overview.png) -->

### Search and filter

- **Search** — find by name or email.
- **Branch filter** — Kota Damansara / Kepong / All Branch.
- **Role filter** — Trainer / Admin / Super Admin.

## Add a new staff member

1. Click **Add Staff** in the top-right corner.
1. Fill in the **Account Information** section:
   - **Name** (required)
   - **Email** (required) — this becomes their login.
   - **Temporary Password** (required) — minimum 8 characters.
   - **Contact Number** (required) — with country code selector.
   - **Branch Access** — Kota Damansara, Kepong, or All Branch.
   - **Role** — Trainer, Admin, or Super Admin.
1. If the role is **Trainer**, fill in the **Commission Setting** section:
   - **Trainer Type** — Full Time or Part Time.
   - **Trainer Category** — Junior, Senior, Master, Grand Master, or Director.
1. Click **Add Staff**.

<!-- ![Add staff dialog](./assets/manage-staff-add-dialog.png) -->

The system creates both a Supabase Auth user and a staff record. The new staff member can log in immediately with their email and temporary password.

:::tip
Trainer type and category affect commission calculation rates. Make sure these are set correctly for trainers.
:::

## Configure permissions

1. Select a staff member from the list.
1. The right panel shows their role, status, branch, and the **permission table**.
1. Toggle checkboxes to grant or revoke permissions.

### Permission table

The table lists all 13 modules, grouped into categories:

| Category | Modules |
| --- | --- |
| **Core** | Dashboard, Analytics |
| **Members and Leads** | Members, Leads |
| **Operations** | Package, Payment, Appointment, Point System |
| **Staff Management** | Trainer Schedule, Commission, Staff Profile |
| **Communication and Settings** | Chats, System Settings |

Each module has three permission toggles:

| Permission | What it controls |
| --- | --- |
| **View** | Can see the module page and data. |
| **Edit** | Can create, update, and delete within the module. |
| **Export** | Can download Excel/PDF exports from the module. |

### Quick actions

- Hover over a module row to see **All** and **None** buttons.
- Click **All** to enable view, edit, and export for that module.
- Click **None** to disable all three.

### Custom overrides

When you change a permission that differs from the role default, a **CUSTOM** badge appears on that module. This means the staff member has a personal override for that module.

If you later change the staff member's role, the custom overrides remain — they aren't reset.

## Change a staff member's role

1. Select the staff member.
1. Change the **Role** dropdown (Trainer, Admin, or Super Admin).
1. Click **Save**.

The staff member inherits the new role's default permissions. Any existing custom overrides are preserved.

### Role hierarchy

| Your role | You can edit |
| --- | --- |
| **Super Admin** | Anyone. |
| **Admin** | Trainers and yourself. |
| **Trainer** | No one (via this page). |

You can't edit staff above your own role level.

## Change a staff member's status

1. Select the staff member.
1. Change the **Status** dropdown to **Active** or **Inactive**.
1. Click **Save**.

Inactive staff can't log in. The middleware blocks their session on the next request.

## Reset a password

1. Select the staff member.
1. Click **Reset Password**.
1. Enter a new password (minimum 6 characters).
1. Click **Reset Password** to confirm.

The staff member's password is updated immediately. They'll need to use the new password on their next login.

## Save and cancel changes

- A **red dot** appears next to the staff name when you have unsaved changes.
- Click **Save** to apply all changes (role, status, branch, and permissions) in one request.
- Click **Cancel** to discard all unsaved changes.

## Things to keep in mind

- The permission system has two tiers: **role defaults** (from `role_permissions`) and **staff overrides** (from `staff_permissions`). Overrides always take precedence.
- Only genuinely custom permissions are stored — if an override matches the role default, it's automatically cleaned up.
- Email addresses must be unique across all staff.
- Phone numbers are validated with real-time format checking and auto-correction.
- Staff permissions take up to 60 seconds to propagate (the `useCurrentStaff` hook polls every 60 seconds), or instantly on page refresh.
