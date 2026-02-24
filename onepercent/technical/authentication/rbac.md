---
sidebar_position: 3
title: Role-based access control
description: Permission system with role defaults and staff-level overrides
---

# Role-based access control

The admin app uses a two-tier permission system: role-based defaults with optional per-staff overrides. This gives gym owners granular control over what each staff member can see and do.

## Modules

The system defines 13 permission modules:

| Module key | Area |
| --- | --- |
| `dashboard` | Main dashboard |
| `analytics` | Analytics and reports |
| `members` | Member management |
| `leads` | Lead tracking |
| `operations-package` | Package management |
| `operations-payment` | Payment processing |
| `operations-point-system` | Loyalty points |
| `operations-appointment` | Appointment scheduling |
| `staff-trainer-schedule` | Trainer schedules |
| `staff-commission` | Commission tracking |
| `staff-profile` | Staff profiles |
| `chats` | WhatsApp messaging |
| `system-settings` | System configuration |

## Actions

Each module supports three actions:

- **`view`**: can see the module and its data
- **`edit`**: can create, update, and delete records
- **`export`**: can export data to CSV or other formats

## Permission resolution

Permissions come from two database tables:

1. **`role_permissions`**: default permissions for each staff category (e.g., trainer, manager)
2. **`staff_permissions`**: per-staff overrides that take priority

The `mergePermissions()` function combines them:

```ts
export function mergePermissions(
  roleDefaults: PermissionRow[],
  staffOverrides: PermissionRow[]
): GranularPermissions[] {
  const map = new Map<string, GranularPermissions>();

  // Add role defaults first
  for (const entry of roleDefaults) {
    map.set(entry.module, { ...entry, source: "role" });
  }

  // Staff overrides replace role defaults
  for (const entry of staffOverrides) {
    map.set(entry.module, { ...entry, source: "override" });
  }

  // Return all MODULE_KEYS in order, defaulting to false
  return MODULE_KEYS.map(
    (module) => map.get(module) ?? { module, can_view: false, can_edit: false, can_export: false, source: "role" }
  );
}
```

## Checking permissions

Use `hasPermission()` and `canAccessModule()` to check access:

```ts
import { hasPermission, canAccessModule } from "@/lib/rbac";

// Check specific action
if (hasPermission(permissions, "members", "edit")) {
  // Allow editing members
}

// Check if user can see the module at all (shorthand for view)
if (canAccessModule(permissions, "analytics")) {
  // Show analytics link in sidebar
}
```

## Types

```ts
type ModuleKey =
  | "dashboard" | "analytics" | "members" | "leads"
  | "operations-package" | "operations-payment"
  | "operations-point-system" | "operations-appointment"
  | "staff-trainer-schedule" | "staff-commission"
  | "staff-profile" | "chats" | "system-settings";

type PermissionAction = "view" | "edit" | "export";

interface GranularPermissions {
  module: ModuleKey | string;
  can_view: boolean;
  can_edit: boolean;
  can_export: boolean;
  source: "role" | "override";
}
```
