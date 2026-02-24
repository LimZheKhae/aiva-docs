---
sidebar_position: 2
title: Schedule & Booking
description: "How the portal schedule module works — upcoming sessions, 3-step booking wizard, trainer availability, time slot selection, appointment history, and status indicators."
---

# Schedule and booking

The schedule module is the portal's home screen. Members see their upcoming sessions, recent appointment history, and a button to book new sessions. The booking flow is a 3-step wizard: select package, choose duration, then pick a date and time. Appointments created from the portal arrive with `status: 'pending pt'` and require trainer confirmation.

## Routes

| Route | File | Lines | Purpose |
| --- | --- | --- | --- |
| `/schedule` | `app/(protected)/schedule/page.tsx` | ~605 | Upcoming sessions, recent history, and book button. |
| `/schedule/book` | `app/(protected)/schedule/book/page.tsx` | ~1,147 | 3-step booking wizard. |
| `/schedule/history` | `app/(protected)/schedule/history/page.tsx` | ~404 | Full appointment history with pagination. |

## Data fetching

**Hook:** `src/hooks/use-member-schedule.ts`

| Export | Purpose |
| --- | --- |
| `useMemberSchedule()` | Fetches appointments and packages via SWR. Key: `"member-schedule"`. Returns `memberId`, `memberBranch`, `appointments[]`, and `packages[]`. |
| `useAppointmentHistory()` | Paginated history with `loadMore()`. Fetches completed and cancelled appointments. |
| `getUpcomingAppointments()` | Filters appointments where `start_time > now`. |
| `getPastAppointments(apts, limit)` | Returns the last N completed appointments (default 5). |
| `getTotalRemainingSessions()` | Sums `remaining_pt_session` across all active packages. |
| `getAppointmentStatusConfig()` | Returns display config: `canAttend`, `showWarning`, `label`, `color`, and `icon`. |

**Booking-specific hooks:**

| Hook | File | Purpose |
| --- | --- | --- |
| `useTrainerAvailability(trainerId, dateFrom, dateTo)` | `src/hooks/use-trainer-availability.ts` | Returns `availableDates` as a `Set<string>` of `"YYYY-MM-DD"` dates with open slots. |
| `useAllTimeSlotsWithStatus(trainerId, date, duration)` | Same file | Returns `TimeSlotWithStatus[]` with real-time availability per slot. |

## Schedule page

**Route:** `apps/portal/src/app/(protected)/schedule/page.tsx` (~605 lines)

### Layout

```
┌──────────────────────────────────────────┐
│  Good morning, [Name]                     │
│  My Schedule          [X sessions left]   │
├──────────────────────────────────────────┤
│  Upcoming Sessions                        │
│  ┌──────────────────────────────────────┐ │
│  │  [Date Block]  Trainer Name          │ │
│  │               Time · Duration        │ │
│  │               Status indicator       │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  Cancellation Policy Notice               │
│                                           │
│  Recent Appointments (last 5)             │
│  - Date · Trainer · Status                │
│  - Date · Trainer · Status                │
│                                           │
│  [Book New Session]                       │
└──────────────────────────────────────────┘
```

### Status indicators

| Status | Display | Color |
| --- | --- | --- |
| `confirmed` | "Ready to attend" with check icon | Green |
| `pending pt` | "Wait for trainer confirmation" with warning icon | Orange |

Pending appointments display with a diagonal pattern background and a left accent border to visually distinguish them from confirmed sessions.

### Success overlay

When redirected back with `?booked=true`, a celebratory success overlay displays showing the trainer name and appointment time.

### Book button

The "Book New Session" button is disabled when the member has no active packages with remaining sessions.

## Booking wizard

**Route:** `apps/portal/src/app/(protected)/schedule/book/page.tsx` (~1,147 lines)

A 3-step wizard with a progress bar at the top.

### Step 1: select package

Displays all active packages with:

- Package name and trainer name.
- Remaining sessions out of total (e.g., "8 of 12 sessions").
- Branch badge.

The member selects which package to use for the booking. This determines the trainer, branch, and available durations.

### Step 2: select duration

Duration options depend on the package's remaining sessions:

| Remaining sessions | Available durations |
| --- | --- |
| 1+ | 30 min |
| 2+ | 60 min |
| 3+ | 90 min |
| 4+ | 120 min |

Each duration option shows a card with the time and a brief description.

### Step 3: select date and time

**Date selection:**

- A 30-day rolling calendar starting from tomorrow.
- Dates with available slots display normally.
- Dates without availability show as disabled with strikethrough text.
- Availability is fetched via `useTrainerAvailability()` which queries `view_5_1_trainer_schedule`.

**Time selection:**

- After selecting a date, time slots appear via `useAllTimeSlotsWithStatus()`.
- Each slot shows the start time and availability status.
- Already-booked slots display as disabled.
- If another member books a slot while the current member is browsing, the selected time auto-clears and the slot updates to unavailable.

### Booking submission

1. Inserts into the `appointment` table directly via the Supabase browser client.
2. Sets `status: 'pending pt'` (portal bookings always require trainer confirmation).
3. Sets `booking_source: 'manual'`.
4. Uses `formatDateTimeForDB()` for timezone-naive storage (space-separated format, not ISO T-separated).
5. On success, redirects to `/schedule?booked=true` to trigger the success overlay.

### Fully booked handling

If no time slots are available for a selected date, a "Fully Booked" modal appears with suggestions to try a different date or a shorter duration.

## Appointment history

**Route:** `apps/portal/src/app/(protected)/schedule/history/page.tsx` (~404 lines)

Displays all past appointments (completed, cancelled, and cancelled with penalty) in a paginated list.

### List items

Each item shows:

- Date badge (day number and month abbreviation).
- Trainer name.
- Date and time range.
- Status icon and label (completed, cancelled, cancelled with penalty).

### Pagination

Uses `useAppointmentHistory()` with a "Load More" button. Shows the total appointment count at the bottom.

## Database views

| Source | Purpose |
| --- | --- |
| `view_4_3_appointment` (view) | Appointments with joined member and trainer names. Used by `useMemberSchedule()`. |
| `view_5_1_trainer_schedule` (view) | Trainer availability with exclusions applied. Used by `useTrainerAvailability()`. |
| `appointment` (table) | Write target for new bookings. |
| `member_package` (table) | Package data including remaining sessions and trainer assignment. |

## Component files

| File | Purpose |
| --- | --- |
| `app/(protected)/schedule/page.tsx` | Schedule home with upcoming sessions, recent history, and book button (~605 lines). |
| `app/(protected)/schedule/book/page.tsx` | 3-step booking wizard with package, duration, and date/time selection (~1,147 lines). |
| `app/(protected)/schedule/history/page.tsx` | Full appointment history with pagination (~404 lines). |
| `hooks/use-member-schedule.ts` | SWR hook for appointments, packages, and history helpers. |
| `hooks/use-trainer-availability.ts` | Availability hooks for dates and time slots with real-time status. |
