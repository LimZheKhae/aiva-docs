---
sidebar_position: 8
title: Trainer Schedule
description: "How the trainer schedule module works — recurring weekly schedules, exclusion blocks, availability views, appointment conflict handling, and portal integration."
---

# Trainer schedule

The trainer schedule module manages trainer availability for appointment booking. It handles recurring weekly work schedules, single-date exclusion blocks (breaks, time-off), and a visual calendar showing how availability, exclusions, and appointments overlap. When schedule changes affect existing appointments, the module offers per-appointment conflict resolution.

**Route:** `apps/admin/src/app/(staff)/staff/trainer-schedule/page.tsx` (~707 lines) <br />
**Permission module:** `staff-trainer-schedule` (`can_view` for page access, `can_edit` for creating, editing, and deleting schedules and exclusions)

## Data fetching

### Schedule and exclusion data

**Hook:** `src/hooks/use-trainer-schedules.ts` (~385 lines)

Three parallel queries run when a trainer is selected:

| Query target | What it returns |
| --- | --- |
| `trainer_schedule` table | Recurring weekly schedules, ordered by `day_of_week` then `start_time`. |
| `trainer_exclusion` table | Single-date blocked periods, ordered by `exclusion_date` then `start_time`. Filtered to 30 days ago onwards. |
| `view_5_1_trainer_schedule` view | Computed daily availability windows with exclusions applied. Filtered by `trainer_id` and date range (today to 3 months ahead). |

**Realtime subscriptions** on both the `gym.trainer_schedule` and `gym.trainer_exclusion` tables (channel: `trainer-schedule-changes`). On any change, the hook refetches schedules, exclusions, and availability windows.

**Delete behavior:** All deletes are soft-deletes — the hook sets `is_active = false` instead of removing rows.

### Trainer list

**Hook:** `src/hooks/use-trainers.ts` (~142 lines)

Two exported hooks:

| Hook | Purpose |
| --- | --- |
| `useTrainerList()` | Lightweight query of `view_5_3_staff` for trainers, admins, and super admins. Returns names, branches, and categories. |
| `useTrainers()` | Full query that also joins schedules, appointments, and member packages to compute `totalClients` and `upcomingAppointments` per trainer. |

:::note
All schedule CRUD operations go directly through the Supabase browser client. There are **no dedicated API routes** for trainer schedules — this is the only module that handles all writes client-side.
:::

## Page layout

```
┌──────────────────────────────────────────────────────────┐
│  Trainer Schedule                                         │
│  [Trainer Selector]  Active: 3  Blocks: 1  Avail: 85%   │
├──────────────────────────────────────────────────────────┤

When a trainer is selected:
┌────────────────────────────┬─────────────────────────────┐
│  Week/Month Calendar       │  [Sessions] [Schedules]      │
│  - Green availability      │  [Blocks]                    │
│  - Exclusion overlays      │                              │
│  - Appointment cards       │  Tab content:                │
│  - Navigation arrows       │  - Appointments list         │
│                            │  - Schedule list + CRUD      │
│                            │  - Exclusion list + CRUD     │
└────────────────────────────┴─────────────────────────────┘
```

### Stats badges

Three badges in the header (visible when a trainer is selected):

| Badge | Value |
| --- | --- |
| **Active Schedules** | Count of active, currently valid schedules. |
| **Upcoming Blocks** | Count of future exclusion blocks. |
| **Availability %** | Percentage of scheduled time that's available (after exclusions). |

## Trainer selector

**Component:** `src/components/trainer-schedule/trainer-selector.tsx`

A searchable combobox (Command/Popover pattern) that groups trainers by branch.

| Staff role | Selector behavior |
| --- | --- |
| Trainer | Hidden. Shows a read-only badge with the trainer's own name. Auto-selects own ID. |
| Admin / Super Admin | Full combobox. All trainers visible (or branch-filtered). Auto-selects the first trainer. |

Each option shows: avatar, name, category badge, and branch badge. Active and inactive trainers are separated into groups.

## Schedule data model

### `trainer_schedule` table

| Field | Type | Details |
| --- | --- | --- |
| `id` | UUID | Primary key. |
| `trainer_id` | UUID | Foreign key to `staff.id`. |
| `day_of_week` | Integer | 0 = Sunday, 1 = Monday, ..., 6 = Saturday. |
| `start_time` | Text | Format: `HH:MM:SS` (e.g., `09:00:00`). |
| `end_time` | Text | Format: `HH:MM:SS`. |
| `valid_from` | Date | Schedule effective start date (`YYYY-MM-DD`). |
| `valid_to` | Date (nullable) | Schedule end date. `null` means ongoing — no end date. |
| `is_active` | Boolean | Soft-delete flag. `false` = deleted. |

**Recurring pattern:** Weekly. Each row represents one recurring time slot on a specific day of the week, within a date range. A trainer working Monday 9 AM - 6 PM indefinitely has one row with `day_of_week = 1`, `valid_from = <start>`, `valid_to = null`.

Multiple rows can exist for the same day (e.g., a split shift) as long as they don't overlap in time and date range.

### `trainer_exclusion` table

| Field | Type | Details |
| --- | --- | --- |
| `id` | Integer | Auto-increment primary key. |
| `trainer_id` | UUID | Foreign key to `staff.id`. |
| `exclusion_date` | Date | The specific date being blocked (`YYYY-MM-DD`). Single-date only — not recurring. |
| `start_time` | Text | Block start time. |
| `end_time` | Text | Block end time. |
| `reason` | Text (nullable) | Required in the UI, nullable in the database. |
| `is_active` | Boolean | Soft-delete flag. |

## Computed availability view

**View:** `view_5_1_trainer_schedule`

This view is the **single source of truth** for trainer availability across both the admin and portal apps. It takes recurring `trainer_schedule` rows and expands them into concrete daily rows, then applies `trainer_exclusion` records to split or reduce availability windows.

| Column | Content |
| --- | --- |
| `trainer_id` | Trainer UUID. |
| `schedule_id` | Source schedule row UUID. |
| `name` | Trainer name. |
| `branch` | Trainer branch. |
| `work_date` | Concrete date (`YYYY-MM-DD`). One row per work day. |
| `start_time` | Available window start. |
| `end_time` | Available window end. |
| `out_from` | Exclusion start time on this date (if any). |
| `out_to` | Exclusion end time on this date (if any). |
| `reason` | Exclusion reason. |

The `out_from`/`out_to` fields carry exclusion periods pre-baked into each row, so consumers only need to query this single view to get effective availability.

```
trainer_schedule + trainer_exclusion
         |  (PostgreSQL view computation)
         v
  view_5_1_trainer_schedule
         |
         +---> Admin: calendar views, schedule editor, appointment form
         +---> Portal: date picker + time slot picker in booking flow
```

## Calendar views

### Week view

**Component:** `src/components/trainer-schedule/trainer-schedule-calendar.tsx`

A vertical timeline grid with `SLOT_HEIGHT = 48px` per hour. The time range is dynamically computed from the availability windows, falling back to 8 AM - 10 PM.

| Element | Visual style |
| --- | --- |
| **Availability windows** | Green bands spanning the available time range. |
| **Exclusion blocks** | Red/striped overlay on top of availability. |
| **Appointment cards** | Positioned by `start_time`/`end_time`. Shows member avatar, name, status badge, package name (tooltip), and contact. |
| **Outside-schedule warning** | Appointments flagged `isOutsideSchedule = true` show an `AlertTriangle` icon. |

**Navigation:** Previous/next week chevrons. Jump-to-date via a calendar popover.

**Actions on appointment cards** (when `canManageAppointments = true`): Confirm and Cancel inline buttons.

The component exposes `navigateToWeek(date)` and `getCurrentWeekRange()` via `forwardRef`, used by the appointments list to jump to a specific week when you click an appointment.

### Month view

**Component:** `src/components/trainer-schedule/monthly-calendar.tsx`

A standard month grid where each day cell shows three counters:

- Available slots count.
- Booked sessions count.
- Blocked periods count.

Clicking a day opens a popover with that day's appointments, availability windows, and exclusion blocks. Navigation via previous/next month chevrons.

A toggle in the top-right switches between week and month views (animated with framer-motion spring transitions).

## Side panel tabs

The right-side panel has three tabs:

### Sessions tab

**Component:** `src/components/trainer-schedule/appointments-list.tsx`

A chronological list of the trainer's appointments. Each row shows:

- Member avatar (DiceBear fallback), name, time, package name.
- Status badge.
- Inline Confirm/Cancel action buttons.

Clicking an appointment navigates the calendar to that week via `calendarRef.navigateToWeek()`.

### Schedules tab

**Component:** `src/components/trainer-schedule/schedule-list.tsx`

Lists all active schedules grouped by day of week (Monday through Sunday, in order `[1,2,3,4,5,6,0]`).

Each schedule row shows:

- Time range (e.g., "9:00 AM - 6:00 PM").
- Status badge: **Active**, **Upcoming** (valid_from in the future), or **Expired** (valid_to in the past).
- Edit and Delete buttons (visible when `canEdit = true`).

The list is scrollable at 480px max height.

When `canEdit = false`, a yellow alert banner appears: "You have view-only access to trainer schedules."

### Blocks tab

**Component:** `src/components/trainer-schedule/exclusion-manager.tsx`

Lists upcoming and past exclusion blocks. An "Add Block" button opens the exclusion creation dialog.

Each block row shows: date, time range, reason, and a delete button.

## Creating a schedule

**Component:** `src/components/trainer-schedule/schedule-editor.tsx`

A modal dialog (`max-w-[520px]`) for creating or editing a recurring schedule.

### Form fields

| Field | Control | Default | Constraints |
| --- | --- | --- | --- |
| **Day of week** | Select dropdown | Monday (1) | 0-6 (Sunday-Saturday). |
| **Start time** | Time input | `09:00` | Required. |
| **End time** | Time input | `18:00` | Required. Must be after start time. |
| **Effective from** | Date picker | Today | Can't be in the past (for new schedules). |
| **Effective until** | Date picker (clearable) | Empty (ongoing) | Must be on or after effective from. |

A live preview summary displays below the form: "Mondays, 09:00 - 18:00 / From Jan 1, 2025 (ongoing)".

### Validation

**File:** `src/lib/trainer-schedule-utils.ts` (~1,032 lines)

Real-time validation runs on every form change:

| Rule | Constraint |
| --- | --- |
| Minimum duration | 30 minutes. |
| Maximum duration | 16 hours. |
| Date range | `valid_to` must be on or after `valid_from`. |
| Conflict check | No overlap with existing active schedules for the same trainer, same day of week, and overlapping date range. |

Conflict display shows the conflicting schedule's day, time range, and date range.

## Editing a schedule

When editing, the dialog fetches all future active appointments (statuses: `pending pt`, `pending member`, `confirmed`, `acknowledged`) that fall within the schedule's pattern.

As you change fields, the editor computes in real time which appointments would be **affected** — those that fit within the old schedule but fall outside the new parameters.

Three outcomes:

| Scenario | Button | Behavior |
| --- | --- | --- |
| No affected appointments | "Update Schedule" | Saves the schedule normally. |
| Affected appointments exist | "Edit, But Keep Appointments" | Saves the new schedule. Appointments remain as-is (possibly outside schedule bounds). |
| Affected appointments exist | "Handle Conflicts" | Opens `AffectedAppointmentsDialog` for per-appointment resolution, then saves the schedule. |

## Deleting a schedule

Before deleting, the schedule list queries `view_4_3_appointment` for future active appointments on the same day-of-week within the schedule's date range.

| Scenario | Button | Behavior |
| --- | --- | --- |
| No affected appointments | "Delete Schedule" | Soft-deletes the schedule (`is_active = false`). |
| Affected appointments exist | "Delete, But Keep Appointments" | Soft-deletes immediately. Appointments remain unchanged. |
| Affected appointments exist | "Handle Conflicts" | Opens `AffectedAppointmentsDialog`, then soft-deletes. |

## Creating an exclusion block

The exclusion dialog collects:

| Field | Control | Details |
| --- | --- | --- |
| **Date** | Date picker | Must be today or future (max 365 days ahead). |
| **Start time** | Time input | Required. |
| **End time** | Time input | Required. Must be after start time. |
| **Reason** | Textarea | Required in the UI. |

**Quick select presets:**

| Preset | Time range |
| --- | --- |
| Full Day | 00:00 - 23:59 |
| Morning | 09:00 - 12:00 |
| Afternoon | 12:00 - 17:00 |
| Evening | 17:00 - 21:00 |

**Validation checks:**

- Trainer has a schedule on the selected date's day of week.
- No overlap with existing active exclusions.
- No conflict with existing active appointments on the same date and time.

If appointments conflict, the `AffectedAppointmentsDialog` opens for per-appointment resolution before the exclusion is created.

## Affected appointments dialog

**Component:** `src/components/trainer-schedule/affected-appointments-dialog.tsx`

A unified dialog shown when schedule edits, deletions, or exclusion creation affect existing appointments. It displays each affected appointment and lets you choose an action per appointment:

| Action | Effect |
| --- | --- |
| **Cancel** | Sets status to `cancelled`. Optional compensation flag. |
| **Reschedule** | Opens the reschedule flow to pick a new time within the updated availability. |
| **Leave pending** | Takes no action — the appointment remains as-is. |

Batch cancellation updates all selected appointments with `status = 'cancelled'` and appends "Cancelled due to schedule deletion" to the remark.

## Permissions

### Role-based behavior

| Aspect | Trainer | Admin / Super Admin |
| --- | --- | --- |
| **Trainer selector** | Hidden — auto-selects own ID with a read-only badge. | Full combobox to select any trainer. |
| **Visible trainers** | Only themselves. | All trainers (or branch-filtered for single-branch staff). |
| **Manage appointments** | Can confirm/cancel own appointments regardless of `canEdit`. | Requires `canEdit` permission. |
| **Create/edit schedules** | Requires `canEdit`. | Requires `canEdit`. |

### Appointment management permission

```
canManageAppointments =
  (isTrainer && staff.id === selectedTrainerId)
  || canEdit
```

### View-only state

When `canEdit = false`, all Add/Edit/Delete buttons are disabled. A yellow alert banner appears in both the Schedules and Blocks tabs: "You have view-only access to trainer schedules." The schedule editor renders a "View Only" dialog with only a Close button.

## Branch filtering

| Staff type | Visible trainers |
| --- | --- |
| Trainer | Only themselves. |
| All-branch staff (`branch = null` or `all branch`) | All trainers across all branches. |
| Single-branch staff | Trainers from their branch only. |

The trainer selector groups trainers by branch (defaults to "No Branch" if unset), with active and inactive trainers separated into groups.

## Portal connection

The portal's booking system reads the same `view_5_1_trainer_schedule` view used by the admin module.

**Hook:** `apps/portal/src/hooks/use-trainer-availability.ts`

Two key functions:

| Function | Purpose |
| --- | --- |
| `fetchTrainerAvailability(trainerId, from, to)` | Returns a set of available dates and schedule-by-date map. Used to highlight bookable dates in the portal's date picker. |
| `fetchAvailableTimeSlots(trainerId, date, duration)` | Queries the view for that date, subtracts booked appointments, returns free time slots. Used to populate the portal's time slot picker. |

The portal hook also subscribes to realtime changes on `gym.trainer_schedule` to invalidate the SWR cache when schedules change — ensuring members always see up-to-date availability.

## Database views and tables

| Source | Purpose |
| --- | --- |
| `view_5_1_trainer_schedule` (view) | Computed daily availability. Expands recurring schedules into per-date rows with exclusion periods applied. Single source of truth for both admin and portal. |
| `view_5_3_staff` (view) | Staff listing with category, branch, and status. Used for the trainer selector. |
| `view_4_3_appointment` (view) | Appointments with joined names. Queried to check for affected appointments during schedule changes. |
| `view_4_1_2_member_package` (view) | Active member packages. Used by `useTrainers()` to compute `totalClients` per trainer. |
| `trainer_schedule` (table) | Recurring weekly schedules. Write target for create/edit/delete. Realtime subscription target. |
| `trainer_exclusion` (table) | Single-date blocked periods. Write target for create/delete. Realtime subscription target. |
| `appointment` (table) | Write target for batch cancellation and inline confirm/cancel actions from the calendar. |

## Component files

| File | Purpose |
| --- | --- |
| `staff/trainer-schedule/page.tsx` | Page with two-panel layout, calendar toggle, trainer selector, tab orchestration (~707 lines). |
| `trainer-schedule/trainer-selector.tsx` | Searchable combobox grouped by branch. Role-aware (hidden for trainers). |
| `trainer-schedule/schedule-list.tsx` | Active schedules grouped by day. Edit/delete with conflict detection. |
| `trainer-schedule/schedule-editor.tsx` | Create/edit dialog with real-time conflict validation and affected appointment handling. |
| `trainer-schedule/exclusion-manager.tsx` | Exclusion list with quick-select presets and conflict validation. |
| `trainer-schedule/affected-appointments-dialog.tsx` | Per-appointment conflict resolution (cancel, reschedule, or leave). |
| `trainer-schedule/appointments-list.tsx` | Chronological appointment list with inline confirm/cancel actions. |
| `trainer-schedule/trainer-schedule-calendar.tsx` | Week-view timeline grid with availability bands, exclusion overlays, and appointment cards. |
| `trainer-schedule/monthly-calendar.tsx` | Month grid with per-day availability/booking/block counters. |
| `trainer-schedule/appointment-time-validator.tsx` | Time validation utility for the reschedule flow. |
| `hooks/use-trainer-schedules.ts` | Schedule, exclusion, and availability CRUD with realtime subscriptions (~385 lines). |
| `hooks/use-trainers.ts` | Trainer list with computed stats (clients, upcoming appointments). |
| `lib/trainer-schedule-utils.ts` | Validation functions, conflict detection, time slot computation (~1,032 lines). |
