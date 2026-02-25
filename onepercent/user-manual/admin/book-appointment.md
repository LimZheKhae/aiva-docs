---
sidebar_position: 4
title: Book an appointment
description: "How to book a personal training session — select a member, choose a date and time, and manage appointment statuses."
---

# Book an appointment

Schedule a personal training session for a member by selecting an available time slot from their trainer's schedule.

## Before you begin

- You need `can_edit` permission on the **Appointment** module.
- The member must have an active package with remaining sessions.
- The trainer must have availability set up (see [trainer schedule](./trainer-schedule)).

## View appointments

1. Click **Operations > Appointment** in the sidebar (or **Appointments** depending on your sidebar layout).
1. The page shows two views — toggle between **Calendar** and **List**.

### Calendar view

Shows appointments as blocks on a weekly or daily calendar. Each block displays the member name, trainer, and time.

<!-- ![Calendar view](./assets/book-appointment-calendar.png) -->

### List view

A table of all appointments with columns for date, time, member, trainer, status, and branch.

### Filters

- **Date range** — select a start and end date.
- **Trainer** — filter by specific trainer.
- **Status** — filter by appointment status.
- **Branch** — filter by gym branch.

## Book a new session

1. Click the **Book Appointment** button (or click an empty slot on the calendar).
1. **Select a member** — search by name or phone number.
1. **Select a package** — choose from the member's active packages (this determines the trainer).
1. **Select a duration** — 30, 60, 90, or 120 minutes (based on remaining sessions).
1. **Select a date** — dates with available slots are highlighted. Unavailable dates are greyed out.
1. **Select a time** — choose from the trainer's available time slots. Already-booked slots are disabled.
1. Click **Book**.

<!-- ![Booking form](./assets/book-appointment-form.png) -->

The appointment is created with status **Scheduled** (when booked by staff) or **Pending PT** (when booked by the member via portal).

## Appointment statuses

| Status | Meaning | Who sets it |
| --- | --- | --- |
| **Pending PT** | Waiting for trainer confirmation. | System (portal bookings). |
| **Scheduled** | Session is confirmed and on the calendar. | Staff or trainer (after confirming portal bookings). |
| **Completed** | Session finished, attendance recorded. | Staff (after check-in). |
| **Cancelled** | Cancelled without penalty — session returned to package. | Staff. |
| **Cancelled (Penalty)** | Cancelled with session deduction from package. | Staff. |

## Manage an existing appointment

Click an appointment in the calendar or list to open the detail panel. From here you can:

### Confirm a portal booking

- **Approve** a pending PT appointment to move it to **Scheduled**.

### Reschedule

1. Click **Reschedule**.
1. Select a new date and time from the trainer's availability.
1. Confirm the change.

### Cancel

1. Click **Cancel Appointment**.
1. Enter a cancellation **reason** (required).
1. Choose whether to apply a penalty:
   - **Penalty off** — cancels without deducting a session (session returned to package).
   - **Penalty on** — deducts one session from the package.
1. If no penalty, you can optionally check **Add Compensation** to grant an extra session.
1. Confirm.

### Record attendance

1. Click **Check In** on a scheduled appointment.
1. The system records the check-in timestamp and marks the session as **Completed**.

:::note
Members can also check in themselves from the portal during the check-in window (15 minutes before start time through to the end of the session).
:::

## Compensation sessions

If a session was cancelled unfairly, you can create a compensation session:

1. Open the cancelled appointment.
1. Click **Create Compensation**.
1. A new appointment is created with a compensation flag, restoring the deducted session.

## Bulk cancel

Cancel all appointments for a date range (e.g., gym closure or trainer leave):

1. Click **Bulk Cancel** on the appointments page.
1. Select the date range.
1. Optionally filter by trainer.
1. Choose whether to apply penalties.
1. Confirm.

## Things to keep in mind

- The availability algorithm checks the trainer's recurring schedule, exclusion blocks, and existing appointments before showing open slots.
- Portal bookings always arrive as **Pending PT** and need trainer confirmation.
- Cancelled appointments with penalty deduct from the package's remaining sessions.
- Completed appointments count toward the trainer's commission calculation.
