---
sidebar_position: 5
title: Package
description: "How the package module works — package catalog, member enrollment with T&C and signatures, status lifecycle, and integration with other modules."
---

# Package

The package module manages the gym's product catalog and member enrollments. It has two distinct layers:

- **Package catalog** (`package` table) — The products available for sale (e.g., "12-Session PT Package").
- **Member packages** (`member_package` table) — Individual purchase records linking a member to a package with dates, trainer, pricing, and session tracking.

**Routes:** <br />
`apps/admin/src/app/(staff)/operations/package/page.tsx` — Package catalog list <br />
`apps/admin/src/app/(staff)/operations/package/new/page.tsx` — Create package <br />
`apps/admin/src/app/(staff)/operations/package/[id]/page.tsx` — Package detail <br />
`apps/admin/src/app/(staff)/operations/package/[id]/edit/page.tsx` — Edit package <br />
**Permission module:** `operations-package` (`can_view`, `can_edit`, `can_export`)

## Package catalog

### Catalog fields

| Field | Required | Details |
| --- | --- | --- |
| Name | Yes | Min 2 chars, max 100. Uniqueness checked via case-insensitive `.ilike()` with 500ms debounce. |
| Description | No | Free text. Parsed line-by-line as feature bullets in the UI. |
| Price (RM) | Yes | 0 to 1,000,000. |
| Session Count | Conditional | Number of PT sessions. Must have session count or membership period (or both). |
| Bonus Sessions | No | Catalog-level default bonus sessions. |
| Membership Period | Conditional | In months (max 120). Must have session count or membership period (or both). |
| Focus / Goals | No | e.g., "Fat loss, muscle building". |
| Branch | No | Null means available at all branches. |
| Status | Yes | `active` or `inactive`. |
| T&C | Yes | Links to a `tnc` record. Members must sign when purchasing. |

**Add-on fields** (all optional, max 200 chars): In-Body Check, Nutrition Plan, Merchandise, Weekend Guest Privilege, PT Voucher, Assisted Stretching, Branch Access, Shareable PT.

### Package type inference

The package type is inferred from `session_count` — not stored as a field:

| Condition | Type label |
| --- | --- |
| `session_count > 0` | Personal Training |
| `session_count = 0` or null | Membership |

## Catalog list page

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Search · Branch Filter · [+ New Package]                │
├──────────────────────────────────────────────────────────┤
│  Package Card Grid (1 col mobile / 2 sm / 3 xl)         │
│  Sorted by price descending (highest first)              │
└──────────────────────────────────────────────────────────┘
```

Each card displays: tier badge, name, subtitle (e.g., "12 One-on-One Sessions"), price, per-session price, branch, features (up to 6 bullets), active members count, total members count, and status badge.

### Visual tier system

Cards are styled based on price rank (most expensive first):

| Rank | Style |
| --- | --- |
| 1st (most expensive) | Gold title (`#F5C518`), dark header |
| 2nd | Near-black gradient, white title |
| 3rd | Dark gradient, bronze/copper title (`#C97A44`) |
| 4th+ | Darkest gradient, white title |

### Card actions

| Action | Permission | Behavior |
| --- | --- | --- |
| View Details | `can_view` | Navigates to `/operations/package/[id]`. |
| Edit Package | `can_edit` | Navigates to `/operations/package/[id]/edit`. |
| Export Data | `can_export` | Downloads CSV for this package's enrollments. |

## Package detail page

Shows the full package information with enrollment data.

### Sections

1. **Tier card** — Visual header with name, price, features, and metadata grid (Status, Branch, Session Count, Membership Period, Focus, Active Since).
2. **Quick actions** — Edit button + "More Actions" dropdown (Pause/Activate, Duplicate).
3. **Stat cards** (4) — Total Members, Active Members, Total Revenue (RM), Outstanding (RM).
4. **Members table** — First 10 enrolled members sorted by start date descending.

### Members table columns

| Column | Content |
| --- | --- |
| **Member** | Name (clickable → member profile). |
| **Status** | Package status badge. |
| **Payment Plan** | Payment plan type. |
| **Sessions** | Total, bonus, and remaining session counts. |
| **Trainer** | Assigned trainer name. |
| **Package Period** | Start → end date with tooltip. |
| **Membership End** | End date with bonus months note in green (if applicable). |
| **Outstanding** | Amount in red if > 0. |
| **Payment** | Button to open payment history modal. |

### Catalog lifecycle actions

| Action | Effect | Confirmation |
| --- | --- | --- |
| **Pause** (active → inactive) | Prevents new enrollments. Existing members are unaffected. | `ConfirmDialog` |
| **Activate** (inactive → active) | Allows new enrollments again. | `ConfirmDialog` |
| **Duplicate** | Creates a copy with " Copy" suffix, set to `inactive`. Navigates to the new package. | `ConfirmDialog` |

:::note
Packages are never deleted. They can only be paused (set to inactive). This preserves the integrity of existing member enrollments and payment history.
:::

## Package form (create and edit)

**Component:** `src/app/(staff)/operations/package/components/package-form.tsx`

Used by both the create and edit pages. Three sections:

### Section 1: Package information

All catalog fields listed above. The name field has a real-time duplicate check (500ms debounce) that shows a spinner while checking and a red error if the name already exists.

**Validation rule:** Must have either `session_count > 0` or `membership_period > 0` (or both). Enforced by Zod `refine()`.

### Section 2: Terms & Conditions (required)

- Select from active T&C records filtered by staff branch, ordered by branch then version descending.
- Eye button toggles a preview showing T&C clauses as a numbered list.
- Amber warning if no T&C is selected.

### Section 3: Package add-ons (collapsible)

Eight free-text fields for describing package extras. Auto-expands in edit mode if any values exist.

## T&C management

**Components:** `src/components/operations/tnc-management-sheet.tsx`, `src/components/operations/tnc-editor.tsx`

The **Manage T&C** button on the package catalog page opens a slide-over sheet for creating and versioning T&C templates. Gated by `operations-package.can_edit`.

### T&C list sheet

A right-side sheet showing all T&C templates filtered by the staff member's branch. Each card displays the branch name, version badge, created date, and an HTML content preview (sanitized with DOMPurify, clamped to 2 lines). A copy/edit button opens the editor dialog.

### T&C editor dialog

A full-screen dialog with a Tiptap rich text editor. Supports bold, italic, underline, strikethrough, H1–H4, text alignment, ordered/bullet lists, blockquotes, horizontal rules, and undo/redo.

| Field | Details |
| --- | --- |
| **Branch** | Select from accessible branches. Disabled when editing (locked to the original branch). |
| **Version** | Auto-incremented — fetches the latest version for the selected branch and adds 1. |
| **Content** | Rich text area. Saved as HTML in `tnc.body`. |

### Versioning behavior

Editing a T&C doesn't update the existing record — it creates a new version and deactivates the previous one. This preserves the integrity of signed T&C records, since members' signatures reference the exact version they agreed to.

| Action | What happens |
| --- | --- |
| **Create** | Inserts a new `tnc` row with `status = 'active'` and auto-incremented version. |
| **Edit (new version)** | Inserts a new version with `status = 'active'`, then sets the old version to `inactive`. |

**Data hook:** `src/hooks/use-tnc.ts` — SWR hook querying the `tnc` table ordered by branch then version descending.

## Member enrollment

Enrolling a member in a package happens from the member detail page via the **Add Package Modal** — a 3-step wizard.

**Component:** `src/components/members/add-package-modal.tsx`

### Step 1: Package details

| Field | Details |
| --- | --- |
| Package | Dropdown of active packages filtered by member's branch. |
| Custom Price (RM) | Pre-populated from catalog price, editable per-enrollment. |
| Bonus Sessions | Extra sessions on top of the package's `session_count`. Shows total summary. |
| Package Start Date | DatePicker, defaults to today. |
| Package End Date | DatePicker, auto-populated from `membership_period` if set. |
| Bonus Month | 0–24. Extends membership end date beyond package end date. |
| Assign Trainer | Filtered by branch. Trainers can only assign themselves. |
| Closed By | Multi-select of active staff. Auto-selects current staff. |

A live preview shows computed membership dates: membership start = package start, membership end = package end + bonus months.

### Step 2: Terms & Conditions

- Auto-fetches the T&C linked to the selected package.
- Displays clauses as a numbered list.
- Requires a checkbox confirmation: "I confirm that the member has reviewed and agrees to the T&C."

### Step 3: Signatures

Two canvas signature pads — one for the member, one for the staff. Both are required. A progress indicator shows 0/2, 1/2, or 2/2.

### Submit flow

1. Insert `member_package` row with all enrollment data.
2. Upload member signature PNG to Supabase Storage (`signature/tnc/[memberPackageId]/member-sign-[timestamp].png`).
3. Upload staff signature PNG to Storage.
4. Insert `member_tnc` row linking the enrollment to the T&C with signature URLs and dates.
5. If `member_tnc` insert fails → rollback by deleting the `member_package` row.

### Trainer restrictions

| Staff role | Trainer field behavior |
| --- | --- |
| Admin/Manager | Can assign any trainer in the member's branch. |
| Trainer | Locked to themselves — dropdown is disabled. |

## Edit enrollment

**Component:** `src/components/members/edit-package-modal.tsx`

### Editable fields

- Package Start Date, Package End Date.
- Bonus Month (auto-computes membership end date = package end + bonus months).
- Trainer assignment.
- Closed By.

### Not editable

- Session counts (total, bonus).
- Total price.
- The package template itself.

### Trainer restrictions in edit mode

| Condition | Behavior |
| --- | --- |
| Trainer is the assigned trainer | Can edit dates and bonus months. Trainer field is disabled (can't reassign). |
| Trainer is NOT the assigned trainer | Entire form is disabled with "Access Restricted" warning. |
| Admin/Manager | Full access to all fields. |

## Status lifecycle

### Catalog statuses (`package.status`)

| Status | Meaning |
| --- | --- |
| `active` | Available for new enrollments. |
| `inactive` | Paused — existing enrollments unaffected, new ones blocked. |

### Enrollment statuses (`member_package.package_status`)

Computed by `view_4_1_2_member_package`:

| Status | Meaning |
| --- | --- |
| `active` | Within the package period. |
| `expired` | Package end date has passed. |
| `completed` | All sessions used. |

## Integration with other modules

The package module is central to the system — it feeds data to nearly every other module.

| Module | How it uses package data |
| --- | --- |
| **Appointments** | Every appointment has a `member_package_id`. Booking validates the date falls within the package period and checks `remaining_pt_session`. |
| **Payments** | Every payment links to a `member_package_id`. Outstanding balance is tracked per enrollment. |
| **Dashboard** | Active member count, outstanding total, expiring packages (7 and 30 days), and low-session alerts all query `view_4_1_2_member_package`. |
| **Members** | Member `status` is derived from their latest `member_package` record in `view_2_member`. |
| **Commission** | The `closed_by` array on `member_package` identifies which staff earn sales commission for the enrollment. |

## Data hooks

### `usePackages(options)`

**File:** `src/hooks/use-packages.ts`

Queries `package` and `view_4_1_2_member_package` in parallel. Returns `PackageSummary[]` with catalog fields plus computed `stats` (totalMembers, activeMembers, totalRevenue, outstanding, etc.) and raw `records`.

Branch filtering: all-branch staff see everything; single-branch staff see packages where `branch` equals theirs or is null.

### `usePackageDetail(packageId)`

**File:** `src/hooks/use-package-detail.ts`

Two-phase fetch:
1. Package row + member package records.
2. Member names, trainer names, and payment history (using IDs from phase 1).

Returns `PackageDetail` with resolved member entries, payment data, and computed `activeSince`.

**Exported mutation functions:**
- `createPackage(payload)` — duplicate check + insert, returns new ID.
- `updatePackage(id, payload)` — update all fields.
- `updatePackageStatus(id, status)` — status-only update.
- `duplicatePackage(id)` — fetch + create copy with " Copy" suffix.
- `checkDuplicatePackageName(name, excludeId?)` — case-insensitive uniqueness check.

## Export

`GET /api/operations/package/export?packageId=...`

**CSV columns:** Member Package ID, Member ID, Member Name, Package Start Date, Package End Date, Membership End Date, Package Status, Total Price, Total Paid, Outstanding, Payment Status, Total/Remaining/Paid/Bonus PT Sessions, Branch, Trainer ID, Created At.

**Filename:** `package_[name]_[packageId]_[YYYY-MM-DD].csv`

Requires `operations-package.can_export`. Branch access enforced server-side.

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/operations/package/export` | GET | Export enrollment data as CSV for a specific package. |

:::note
Package catalog CRUD (create, update, status change, duplicate) is performed directly via the Supabase browser client from hooks — not through API routes. Only the export has a dedicated API route for server-side permission and branch enforcement.
:::

## Database views and tables

| Source | Purpose |
| --- | --- |
| `package` (table) | Product catalog. Write target for create/edit/status. |
| `member_package` (table) | Enrollment records. Write target for add/edit enrollment. |
| `member_tnc` (table) | T&C signatures per enrollment. |
| `view_4_1_2_member_package` (view) | Denormalized enrollment view with computed `package_status`, `remaining_pt_session`, `outstanding`, `total_paid`, joined `package_name`, `member_name`, `trainer_name`. |
| `view_4_3_member_payment` (view) | Payment records linked to enrollments. |
| `view_2_1_tnc` (view) | T&C templates with branch, version, status. |

## Component files

| File | Purpose |
| --- | --- |
| `operations/package/page.tsx` | Catalog list with card grid, search, branch filter. |
| `operations/package/new/page.tsx` | Create package entry point. |
| `operations/package/[id]/page.tsx` | Package detail with stats, members table, lifecycle actions. |
| `operations/package/[id]/edit/page.tsx` | Edit package entry point. |
| `operations/package/components/package-form.tsx` | Reusable create/edit form (3 sections). |
| `operations/package/components/package-members-table.tsx` | Enrolled members table with payment modal. |
| `operations/package/components/package-tier-card.tsx` | Visual tier header card. |
| `operations/package/components/confirm-dialog.tsx` | Pause/activate/duplicate confirmation. |
| `operations/package/components/payment-modal.tsx` | Payment history per enrollment. |
| `members/add-package-modal.tsx` | 3-step enrollment wizard with T&C and signatures. |
| `members/edit-package-modal.tsx` | Edit enrollment dates, trainer, closed-by. |
| `hooks/use-packages.ts` | Catalog list with enrollment stats. |
| `hooks/use-package-detail.ts` | Single package detail with members and payments. |
| `lib/validations/package.ts` | Zod schemas (5) and date calculation helpers. |
| `lib/package-helpers.ts` | Formatting, tier palette, type inference utilities. |
