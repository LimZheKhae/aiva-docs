---
sidebar_position: 3
title: Attendance & Check-in
description: "How the portal attendance module works — today's sessions, check-in window, self-service check-in, late detection, pending check-ins, and attendance history."
---

# Attendance and check-in

The attendance module lets members check in to their confirmed sessions directly from the portal. The page shows today's sessions with a check-in button, pending (unchecked) past sessions, and a full attendance history. Check-in uses a time window — members can check in from 15 minutes before to 30 minutes after the appointment start time.

## Routes

| Route | File | Lines | Purpose |
| --- | --- | --- | --- |
| `/attendance` | `app/(protected)/attendance/page.tsx` | ~562 | Today's sessions, pending check-ins, and recent history. |
| `/attendance/history` | `app/(protected)/attendance/history/page.tsx` | ~511 | Full attendance history with pagination. |

## Data fetching

**Hook:** `src/hooks/use-member-attendance.ts`

| Export | Purpose |
| --- | --- |
| `useMemberAttendance()` | Fetches today's appointments, past unchecked appointments, and recent attendance history via SWR. |
| `useAttendanceHistory()` | Paginated history with `loadMore()`. Returns completed sessions with check-in timestamps. |
| `submitMemberCheckIn(appointmentId)` | Server action. Updates `member_signed_attendance_at` on the appointment record. |
| `getCheckInStatus(session)` | Returns `\{ status, message, canCheckIn \}` based on the current time relative to the appointment. |

## Attendance page

**Route:** `apps/portal/src/app/(protected)/attendance/page.tsx` (~562 lines)

### Layout

```
┌──────────────────────────────────────────┐
│  Attendance                               │
├──────────────────────────────────────────┤
│  Today's Sessions                         │
│  ┌──────────────────────────────────────┐ │
│  │  ○ Large check-in circle             │ │
│  │  Trainer Name                        │ │
│  │  Time Range                          │ │
│  │  Status: Ready / Early / Late        │ │
│  │  [Check In]                          │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  Recent Sessions                          │
│  ┌ Pending (orange gradient) ──────────┐  │
│  │  Session needing check-in           │  │
│  └─────────────────────────────────────┘  │
│  ┌ Completed (green) ─────────────────┐   │
│  │  Checked-in session                 │   │
│  └─────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### Check-in status logic

The `getCheckInStatus()` function determines what the member sees:

| Status | Condition | Display | Can check in |
| --- | --- | --- | --- |
| `early` | More than 15 min before start | Clock icon, time until check-in opens | No |
| `ready` | Within 15 min before to 30 min after start | Green check icon, "Ready to check in" | Yes |
| `late` | Within the check-in window but past start time | Orange warning, "Late check-in" | Yes |
| `checked-in` | Already checked in | Green filled check, check-in time displayed | No |

### Check-in window

- **Opens:** 15 minutes before the appointment start time.
- **Closes:** 30 minutes after the appointment start time.
- Outside this window, the check-in button is disabled.

### Today's session cards

Large cards (28x28 circle with check/clock icon) showing:

- Trainer name.
- Time range.
- Status indicator with color coding.
- Check-in button (enabled only during the check-in window).

### Pending and completed sections

- **Pending check-ins** — orange gradient background. Shows past sessions where the member hasn't checked in yet.
- **Completed sessions** — green accent. Shows sessions with a recorded check-in time.

### Success overlay

After a successful check-in, a celebratory overlay displays showing the trainer name and appointment time.

### Server action

`submitMemberCheckIn(appointmentId)` updates the `member_signed_attendance_at` field on the appointment record with the current timestamp. This is a server action — it uses the Supabase server client.

## Attendance history

**Route:** `apps/portal/src/app/(protected)/attendance/history/page.tsx` (~511 lines)

### Sections

- **Pending check-ins** — sessions still awaiting check-in. Orange badge with count.
- **Completed sessions** — sessions with a recorded check-in. Green check-in icon.

### Pagination

Uses `useAttendanceHistory()` with a "Load More" button and animated loading dots. Shows the total session count at the bottom.

## Database tables

| Source | Purpose |
| --- | --- |
| `view_4_3_appointment` (view) | Appointments with joined member and trainer names. Filtered by member ID and status. |
| `appointment` (table) | Write target for check-in. The `member_signed_attendance_at` field records the check-in timestamp. |

:::note
The portal check-in is QR-less — members tap the check-in button directly. The admin app's check-in flow (in the appointment module) can also record attendance, but uses a different mechanism.
:::

## Component files

| File | Purpose |
| --- | --- |
| `app/(protected)/attendance/page.tsx` | Today's sessions with check-in buttons, pending, and recent history (~562 lines). |
| `app/(protected)/attendance/history/page.tsx` | Full attendance history with pending and completed sections (~511 lines). |
| `hooks/use-member-attendance.ts` | SWR hook for attendance data, check-in server action, and status helpers. |
| `components/ui/check-in-success-overlay.tsx` | Celebratory overlay after successful check-in. |
