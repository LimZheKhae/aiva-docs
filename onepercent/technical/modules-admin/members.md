---
sidebar_position: 4
title: Members
description: "How the members module works — registration, profile management, packages, payments, notes, and portal invitations."
---

# Members

The members module is the largest module in the Admin app. It handles the full member lifecycle — registration with digital signatures, profile management, package assignment, payment tracking, appointment history, notes, and portal invitations.

**Routes:** <br />
`apps/admin/src/app/(staff)/members/page.tsx` — Member list <br />
`apps/admin/src/app/(staff)/members/new/page.tsx` — New member registration <br />
`apps/admin/src/app/(staff)/members/[id]/page.tsx` — Member detail <br />
**Permission module:** `members` (`can_view`, `can_edit`, `can_export`)

## Data fetching

**Hook:** `src/hooks/use-members.ts`

The members list uses `useState` + `useEffect` with a **Supabase Realtime subscription** on the `gym.member` table. The hook:

1. Queries `view_2_member` for all member records (ordered by `id` desc, branch-filtered).
2. Queries `staff` for trainer name resolution.
3. Queries `appointment` for last appointment per member.
4. Transforms raw `GymClient` rows into `Member` objects with computed fields: `age`, `memberSince`, `lastAppointment`, `trainerName`.

Realtime events (`INSERT`, `UPDATE`, `DELETE`) are applied to local state without re-fetching the full list. Branch filtering is applied to realtime events too.

### `view_2_member` vs `member` table

| Source | What it provides |
| --- | --- |
| `view_2_member` (view) | All member fields plus computed `status` (derived from `member_package.status`) and `balance_points`. Used for the list and profile display. |
| `member` (table) | Raw data including emergency contacts, identity number, and nationality. These fields aren't in the view, so the detail page queries the raw table separately. |

## Members list page

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Branch Picker (All / Kepong / Kota Damansara)           │
├──────────────────────────────────────────────────────────┤
│  Search Name · Search Phone · Status Filter              │
│  [+ New Member] · [Export]                               │
├──────────────────────────────────────────────────────────┤
│  Member Table (sortable, paginated, 20 per page)         │
│  → Click row: View Profile / Book Appointment            │
├──────────────────────────────────────────────────────────┤
│  Pagination Controls                                     │
└──────────────────────────────────────────────────────────┘
```

### Filters (all client-side)

| Filter | Match logic |
| --- | --- |
| **Search Name** | `name.toLowerCase().includes(term)` |
| **Search Phone** | `contact.toString().includes(term)` |
| **Status** | All / Active / Expired / Completed — exact match. |
| **Branch** | Auto-locked for single-branch staff. All-branch staff get a picker with per-branch counts. |

### Table columns

| Column | Visibility | Sortable |
| --- | --- | --- |
| **Member Info** | Always visible | By `name` |
| **Contact** | Toggleable (default: visible) | By `contact` |
| **Date of Birth** | Toggleable (default: visible) | By `dateOfBirth` |
| **Status** | Toggleable (default: visible) | By `status` (ordered: active → expired → completed) |
| **Branch** | Toggleable (default: visible) | By `branch` |
| **Trainer** | Toggleable (default: visible) | By `trainerName` |
| **Last Appointment** | Toggleable (default: hidden) | By `lastAppointment` |

Column visibility preferences are persisted to `localStorage` under key `members-visible-columns`.

### Row actions

| Action | Permission required | Behavior |
| --- | --- | --- |
| **View Profile** | `members.can_view` | Navigates to `/members/{id}`. |
| **Book Appointment** | `operations-appointment.can_edit` | Opens `NewAppointmentForm` modal inline. |

### CSV export

Calls `GET /api/members/export` with query params matching the current filter state.

**Columns:** ID, Name, Contact, Email, Gender, Date of Birth, Age (calculated server-side), Nationality, Identity Number, Branch, Marketing Source, Handler, Member Since, WhatsApp Number, WhatsApp Opt-In.

**Permission:** Requires `members.can_export`.

## New member registration

**Route:** `/members/new` — a single-page form (not a multi-step wizard in the current implementation).

### Lead pre-fill

When navigated from the leads conversion flow (`?from=lead&leadId=X&name=Y&contact=Z&source=A&branch=B`), the form pre-fills matching fields and displays a "Lead Data Pre-filled" toast. After successful member creation, the lead's status is automatically set to "converted."

### Draft auto-save

**Hook:** `src/hooks/use-member-draft.ts`

The form auto-saves to `localStorage` with a **500ms debounce** on every state change. On page load, if a draft exists, a 10-second action toast offers to restore it.

| Behavior | What happens |
| --- | --- |
| **Draft found on load** | Toast with "Continue" button. Auto-dismisses after 10 seconds. |
| **Save Draft button** | Saves immediately to localStorage. |
| **Navigating away dirty** | Dialog with three options: Cancel, Discard & Exit, Save & Exit. |
| **Browser close/refresh** | Native `beforeunload` dialog if form is dirty. |

### Form fields

**Personal information:**

| Field | Required | Details |
| --- | --- | --- |
| Full Name | Yes | `nameSchema` validation. |
| Phone Number | Yes | Country code select (13 codes: MY, SG, CN, AU, ID, IN, JP, KR, PH, TH, UK, US, VN) + number input. Validated with `libphonenumber-js`, 800ms debounce. |
| Gender | Yes | Male / Female. |
| Date of Birth | Yes | Day / Month / Year selects. Must be in past, age 10–120. |
| Nationality | Yes | 13 options (Malaysian, Singaporean, Chinese, etc.). |
| Branch | Yes | Restricted by staff branch. Kepong / Kota Damansara. |
| Email | Yes | Regex validation. |
| Identity Number | No | IC or passport number. |
| Response Handler | Yes | `ai agent` or `human` — controls WhatsApp response behavior. |
| Marketing Source | Yes | `SOURCE_CHANNELS` enum (same as leads module). |
| Tier | Yes | `company` (full commission) or `fans` (50% commission). Default: `company`. |

**Emergency contact:**

| Field | Required |
| --- | --- |
| Contact Name | Yes |
| Contact Number | Yes |
| Relationship | Yes |

### Duplicate detection

Two real-time checks run during form submission:

| Check | Endpoint | Behavior |
| --- | --- | --- |
| **Phone** | `GET /api/members/check-phone` | Checks multiple format variations. Blocks submission if duplicate found. |
| **Email** | `GET /api/members/check-email` | Blocks submission if duplicate found. |

An additional silent check against `GET /api/leads/check-phone` auto-links the new member to any matching lead record.

### Submit flow

1. Client-side Zod validation.
2. Phone and email duplicate checks.
3. Silent lead auto-link check.
4. `POST /api/members` — inserts into `member` table via admin client.
5. Server auto-sends portal invite via `supabase.auth.admin.inviteUserByEmail()` if email provided.
6. If linked to a lead, calls `PATCH /api/leads/{leadId}/status` to mark as converted.
7. Clears draft, navigates to `/members/{new_id}`.

:::note
A database trigger (`new_member_trigger` → `update_leads_status()`) also handles lead conversion, providing a safety net if the API call fails.
:::

## Member detail page

**Route:** `/members/[id]` <br />
**Component:** `src/components/members/member-detail-view.tsx` (~3,250 lines)

The detail page loads the member from the already-fetched `useMembers` list (no separate per-member API call). Detailed data (packages, payments, notes, etc.) is fetched directly by the component.

### Header

- Avatar (uploaded file or DiceBear fallback).
- Member name + ID badge.
- Stats row: Member Since, Points Balance (amber), Branch Badge, Last Appointment.
- Action buttons: **Portal Invite**, **Edit Profile**, **Add Package** (all gated by `can_edit`).

### Info cards (4 horizontal)

| Card | Fields |
| --- | --- |
| **Contact** | Phone, email. |
| **Emergency Contact** | Name, phone, relationship. Supports 2 emergency contacts. |
| **Personal Details** | Age, birthday, gender, nationality, tier. |
| **Membership Status** | Aggregate status calculated from all packages. Package count tooltip with per-package dates and status. |

### Tabs

Five tabs, synced to the URL via `?tab=` query param:

| Tab | Content |
| --- | --- |
| **Packages** | Active and other packages with session/time progress bars, T&C viewer, payment actions. |
| **Ledger** | Payment history with debit/credit/outstanding, invoice links, payment proof viewer. |
| **Appointments** | Upcoming (max 6) and recent/past (max 6) appointments. |
| **Notes** | Staff notes with real-time updates, inline edit/delete (owner only). |
| **Activity** | Unified chronological timeline of packages, appointments, and notes. |

## Packages tab

### Active packages

Data from `view_4_1_2_member_package`. Each card shows:

- Package name, branch, session count (with bonus/compensation badges).
- 4 info tiles: Start Date, End Date, Sessions Left, Trainer.
- **Sessions progress bar** — segmented visual (up to 150 segments). Used sessions in red, remaining in black.
- **Time remaining bar** — same style for days remaining vs total days.
- T&C button (if T&C data exists) — opens a modal with member and staff signatures.
- Add Payment button (if `can_edit` on `operations-payment`).

Expired and completed packages are shown in a collapsible "Other Packages" section below.

### Add package modal (3-step wizard)

| Step | Content |
| --- | --- |
| **1. Package details** | Package select (filtered by branch), custom price, bonus sessions, start/end dates, trainer select, closed-by multi-select. |
| **2. Terms & Conditions** | Auto-fetches T&C linked to the package. Checkbox acknowledgment required. |
| **3. Signatures** | Signature pad for member and staff. Both signatures are data URLs uploaded to Supabase Storage. |

### Edit package modal

- Select from active or expired packages.
- Editable: start/end dates, bonus months (auto-computes membership end date), trainer, closed-by.
- **Trainer restriction:** Trainers can only edit packages where `trainer_id` matches their own staff ID. The trainer field is always disabled for trainers.

## Ledger tab

Data from `view_4_2_member_payment_ledger`, enhanced with package names.

### Summary cards

One card per `member_package_id` showing: Package name, Total price, Collected (sum of debits), Outstanding (from `is_latest=true` records).

### Ledger table

| Column | Content |
| --- | --- |
| **Date** | Payment date. |
| **Package** | Package name. |
| **Type** | Payment type. |
| **Plan** | Payment plan. |
| **Debit** | Amount paid. |
| **Credit** | Credit applied. |
| **Outstanding** | Running balance. |
| **Proof** | Image viewer for payment proof. |
| **Invoice** | Invoice link + remark edit icon. |

Paginated at 10 records per page.

## Notes tab

Data from `view_2_3_member_notes`. Has a **Supabase Realtime subscription** on the `member_notes` table filtered by `member_id` — notes reload automatically on any change.

| Action | Who can do it |
| --- | --- |
| Add note | Any staff with `can_edit`. |
| Edit note | Only the staff member who created it. Ctrl+Enter to save, Escape to cancel. |
| Delete note | Only the staff member who created it. Inline two-step confirmation. |

## Activity tab

A unified chronological timeline (newest first) aggregating:

- Package start and end events.
- Membership end events.
- All appointments (with status).
- All notes (with text preview).

Each item type has a distinct icon and color.

## Edit profile

Triggered by the "Edit Profile" button. Renders as an **inline panel** above the info cards (not a modal).

| Field | Editable | Notes |
| --- | --- | --- |
| Avatar | Yes | Max 25MB, JPEG/PNG/WebP. Uploads to `member_avatar` Storage bucket. |
| Name | Yes | |
| Phone | Yes | Parsed and validated with `libphonenumber-js`. Uniqueness check excludes current member. |
| Email | Yes | |
| Date of Birth | Yes | Max date: 10 years ago. |
| Gender | Yes | |
| Branch | Yes | Disabled for single-branch staff. |

| Response Handler | Yes | AI Agent / Human. |
| Tier | Yes | Company / Fans. |

Saves directly via `supabase.from("member").update({...}).eq("id", member.id)` from the browser client.

## Portal invitation

The "Portal Invite" button (disabled if the member has no email) calls `POST /api/members/[id]/invite-portal`:

1. Looks up the member's email.
2. Attempts `supabase.auth.admin.inviteUserByEmail()` with a redirect to the Portal's `/auth/callback?next=/reset-password`.
3. If the user already exists in Supabase Auth, falls back to `supabase.auth.resetPasswordForEmail()`.
4. Returns `{ type: "invite" }` or `{ type: "recovery" }`.

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/members` | POST | Create a new member. Auto-sends portal invite if email provided. |
| `/api/members/export` | GET | Export filtered members as CSV. Requires `can_export`. |
| `/api/members/check-phone` | GET | Check phone uniqueness (supports `excludeId` param for edits). |
| `/api/members/check-email` | GET | Check email uniqueness. |
| `/api/members/[id]/invite-portal` | POST | Send portal invite or password reset email. |

## Database views and tables

| Source | Purpose |
| --- | --- |
| `view_2_member` (view) | Members with computed status and points balance. Primary list source. |
| `view_2_3_member_notes` (view) | Notes with staff name join. |
| `view_4_1_2_member_package` (view) | Member packages with session counts, compensation, trainer info. |
| `view_4_2_member_payment_ledger` (view) | Payment ledger with running balances. |
| `member` (table) | Raw member data. Emergency contacts, identity number, nationality. Write target. |
| `member_notes` (table) | Staff notes. Realtime subscription target. |
| `member_tnc` (table) | T&C signatures per package. |
| `member_payment` (table) | Payment records. |
| `member_invoice` (table) | Invoice records and remarks. |
| `appointment` (table) | Appointments for last-appointment computation and history tab. |

## Component files

| File | Purpose |
| --- | --- |
| `members/page.tsx` | List page with filters, sorting, pagination, branch picker. |
| `members/[id]/page.tsx` | Detail page entry point. Loads member from hook by ID. |
| `members/new/page.tsx` | Registration form with draft system and lead pre-fill. |
| `members/member-table.tsx` | Sortable, animated data table with column visibility toggle. |
| `members/member-detail-view.tsx` | Full detail component (~3,250 lines). Header, info cards, 5 tabs, edit panel. |
| `members/member-detail-modal.tsx` | Legacy dialog-based detail view (superseded by full-page view). |
| `members/add-package-modal.tsx` | 3-step package assignment wizard with T&C and signatures. |
| `members/edit-package-modal.tsx` | Package editing for active/expired packages. |
| `members/column-visibility-dropdown.tsx` | Column toggle with localStorage persistence. |
| `members/avatar-upload.tsx` | Avatar file picker (max 25MB). |
| `members/lead-selection-card.tsx` | Lead display card used during member creation. |
| `hooks/use-members.ts` | List data, computed fields, Supabase Realtime. |
| `hooks/use-member-draft.ts` | Draft auto-save to localStorage with debounce. |
| `lib/validations/member.ts` | Zod schemas for all member forms. |
